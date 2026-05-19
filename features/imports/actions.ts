"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentFinanceUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { cycleIdFor, getCreditCycleDates } from "@/lib/credit-cycles";
import type { CreditAccount, Prisma } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ImportActionState = {
  ok: boolean;
  message: string;
  batchId?: string;
};

export type ImportItemUpdate = {
  status?: "pending" | "confirmed" | "ignored" | "duplicate";
  detectedMerchant?: string;
  detectedAmountCents?: number;
  detectedDate?: string;
  suggestedCategoryId?: string | null;
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createBatchSchema = z.object({
  source: z.enum(["screenshot", "pdf"]),
  accountId: z.string().min(1, "Selecciona una cuenta."),
  rawText: z.string().trim().min(1, "Pega el texto extraído del documento."),
});

const confirmItemSchema = z.object({
  merchant: z.string().trim().min(1),
  amountCents: z.number().int().positive(),
  date: z.string().min(1),
  categoryId: z.string().min(1),
});

// ─── createImportBatchAction ─────────────────────────────────────────────────

export async function createImportBatchAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const parsed = createBatchSchema.safeParse({
    source: formData.get("source"),
    accountId: formData.get("accountId"),
    rawText: formData.get("rawText"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) return { ok: false, message: "Inicia sesión para importar." };

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId: user.id, isActive: true, type: { in: ["debit", "cash", "credit_card", "store_card"] } },
  });
  if (!account) return { ok: false, message: "La cuenta seleccionada no existe." };

  const items = parseRawText(parsed.data.rawText);

  const batch = await prisma.importBatch.create({
    data: {
      userId: user.id,
      source: parsed.data.source,
      status: items.length > 0 ? "review" : "processing",
      rawText: parsed.data.rawText,
      items: {
        create: items.map((item) => ({
          detectedDate: item.date ? new Date(item.date) : null,
          detectedMerchant: item.merchant,
          detectedAmountCents: item.amountCents,
          status: "pending",
        })),
      },
    },
  });

  revalidatePath("/");

  return {
    ok: true,
    message:
      items.length > 0
        ? `Lote creado con ${items.length} movimiento${items.length !== 1 ? "s" : ""} detectado${items.length !== 1 ? "s" : ""}.`
        : "Lote creado. Agrega movimientos manualmente en la revisión.",
    batchId: batch.id,
  };
}

// ─── updateImportItemAction ───────────────────────────────────────────────────

export async function updateImportItemAction(
  itemId: string,
  update: ImportItemUpdate,
): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentFinanceUser();
  if (!user) return { ok: false, message: "Inicia sesión." };

  const item = await prisma.importItem.findFirst({
    where: { id: itemId, importBatch: { userId: user.id } },
  });
  if (!item) return { ok: false, message: "El movimiento no existe." };

  await prisma.importItem.update({
    where: { id: itemId },
    data: {
      status: update.status,
      detectedMerchant: update.detectedMerchant,
      detectedAmountCents: update.detectedAmountCents,
      detectedDate: update.detectedDate ? new Date(update.detectedDate) : undefined,
      suggestedCategoryId: update.suggestedCategoryId,
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Movimiento actualizado." };
}

// ─── confirmImportBatchAction ─────────────────────────────────────────────────

export async function confirmImportBatchAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const batchId = (formData.get("batchId") as string | null)?.trim();
  const accountId = (formData.get("accountId") as string | null)?.trim();

  if (!batchId || !accountId) {
    return { ok: false, message: "Datos incompletos para confirmar el lote." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) return { ok: false, message: "Inicia sesión." };

  const batch = await prisma.importBatch.findFirst({
    where: { id: batchId, userId: user.id },
    include: { items: { where: { status: "confirmed" } } },
  });
  if (!batch) return { ok: false, message: "El lote no existe." };
  if (batch.status === "completed") return { ok: false, message: "Este lote ya fue confirmado." };

  const confirmedItems = batch.items;
  if (confirmedItems.length === 0) {
    return { ok: false, message: "Confirma al menos un movimiento antes de importar." };
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id, isActive: true, type: { in: ["debit", "cash", "credit_card", "store_card"] } },
    include: {
      creditAccount: {
        include: { cycles: { where: { status: "open" }, orderBy: { startDate: "desc" } } },
      },
    },
  });
  if (!account) return { ok: false, message: "La cuenta seleccionada no existe." };

  const isCreditAccount = account.type === "credit_card" || account.type === "store_card";
  let created = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const item of confirmedItems) {
      const parsed = confirmItemSchema.safeParse({
        merchant: item.detectedMerchant,
        amountCents: item.detectedAmountCents,
        date: item.detectedDate?.toISOString().slice(0, 10),
        categoryId: item.suggestedCategoryId,
      });

      if (!parsed.success) {
        skipped++;
        continue;
      }

      const txDate = new Date(parsed.data.date);
      const merchantNormalized = normalizeMerchant(parsed.data.merchant);
      const fingerprint = `${parsed.data.date}|${merchantNormalized}|${parsed.data.amountCents}|${account.id}`;

      const exists = await tx.transaction.findFirst({
        where: { userId: user.id, fingerprint },
        select: { id: true },
      });

      if (exists) {
        await tx.importItem.update({
          where: { id: item.id },
          data: { status: "duplicate", duplicateTransactionId: exists.id },
        });
        skipped++;
        continue;
      }

      const creditCycle =
        isCreditAccount && account.creditAccount
          ? await getOrCreateCreditCycle(tx, account.creditAccount, txDate)
          : null;

      await tx.transaction.create({
        data: {
          userId: user.id,
          accountId: account.id,
          creditCardCycleId: creditCycle?.id ?? null,
          categoryId: parsed.data.categoryId,
          date: txDate,
          merchantRaw: parsed.data.merchant,
          merchantNormalized,
          amountCents: parsed.data.amountCents,
          direction: "expense",
          paymentMethod: isCreditAccount
            ? "credit_card"
            : account.type === "cash"
              ? "cash"
              : "debit",
          source: batch.source === "screenshot" ? "screenshot" : "pdf",
          status: "confirmed",
          fingerprint,
        },
      });

      if (!isCreditAccount) {
        await tx.account.update({
          where: { id: account.id },
          data: { currentBalanceCents: { decrement: parsed.data.amountCents } },
        });
      }

      created++;
    }

    await tx.importBatch.update({
      where: { id: batchId },
      data: { status: "completed" },
    });
  });

  revalidatePath("/");

  return {
    ok: true,
    message: `${created} movimiento${created !== 1 ? "s" : ""} importado${created !== 1 ? "s" : ""}${skipped > 0 ? `, ${skipped} omitido${skipped !== 1 ? "s" : ""}` : ""}.`,
  };
}

// ─── getImportBatchesAction ───────────────────────────────────────────────────

export async function getImportBatchesAction() {
  const user = await getCurrentFinanceUser();
  if (!user) return [];

  return prisma.importBatch.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
    take: 10,
    include: {
      items: {
        orderBy: { detectedDate: "asc" },
        include: { suggestedCategory: { select: { id: true, name: true } } },
      },
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeMerchant(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

async function getOrCreateCreditCycle(
  tx: Prisma.TransactionClient,
  credit: Pick<CreditAccount, "id" | "cutoffDay" | "paymentDueDay" | "personalBudgetCents">,
  date: Date,
) {
  const dates = getCreditCycleDates(credit, date);
  const id = cycleIdFor(credit.id, dates);

  return tx.creditCardCycle.upsert({
    where: { id },
    update: {},
    create: {
      id,
      creditAccountId: credit.id,
      startDate: dates.startDate,
      endDate: dates.endDate,
      paymentDueDate: dates.paymentDueDate,
      budgetAmountCents: credit.personalBudgetCents,
      status: "open",
    },
  });
}

/**
 * Parses free-form text pasted from a bank app or PDF copy-paste.
 * Detects lines containing a date, a merchant name, and a peso amount.
 * Expected (flexible): "DD/MM/YYYY  MERCHANT NAME  $1,234.56"
 */
function parseRawText(raw: string): Array<{
  date: string | null;
  merchant: string;
  amountCents: number;
}> {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: Array<{ date: string | null; merchant: string; amountCents: number }> = [];

  const datePattern = /(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/;
  const amountPattern = /\$?\s*([\d,]+\.?\d{0,2})/;

  for (const line of lines) {
    const amountMatch = line.match(amountPattern);
    if (!amountMatch) continue;

    const rawAmount = amountMatch[1].replace(/,/g, "");
    const amountCents = Math.round(Number(rawAmount) * 100);
    if (!amountCents || amountCents <= 0) continue;

    const dateMatch = line.match(datePattern);
    let isoDate: string | null = null;
    if (dateMatch) {
      const [, d, m, y] = dateMatch;
      const year = y.length === 2 ? `20${y}` : y;
      isoDate = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    const merchant = line
      .replace(datePattern, "")
      .replace(amountPattern, "")
      .replace(/[$,]/g, "")
      .trim()
      .replace(/\s+/g, " ");

    if (!merchant) continue;

    results.push({ date: isoDate, merchant, amountCents });
  }

  return results;
}
