"use server";

import { revalidatePath } from "next/cache";
import type { CreditAccount, Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentFinanceUser } from "@/lib/current-user";
import { cycleIdFor, getCreditCycleDates } from "@/lib/credit-cycles";
import { prisma } from "@/lib/db";

export type CreateExpenseState = {
  ok: boolean;
  message: string;
};

const createExpenseSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "El monto debe tener máximo dos decimales."),
  accountId: z.string().min(1, "Selecciona una cuenta."),
  budgetAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  merchant: z.string().trim().min(1, "Escribe el comercio."),
  note: z.string().trim().max(180, "La nota es demasiado larga.").optional(),
  date: z.string().min(1, "Selecciona la fecha."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Selecciona una hora válida."),
  isInstallment: z.boolean(),
  installments: z.coerce.number().int().min(2).max(24).optional(),
});

export async function createExpenseAction(
  _previousState: CreateExpenseState,
  formData: FormData,
): Promise<CreateExpenseState> {
  const parsed = createExpenseSchema.safeParse({
    amount: formData.get("amount"),
    accountId: formData.get("accountId"),
    budgetAccountId: formData.get("budgetAccountId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    merchant: formData.get("merchant"),
    note: formData.get("note"),
    date: formData.get("date"),
    time: formData.get("time"),
    isInstallment: formData.get("isInstallment") === "true",
    installments: formData.get("installments") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa los datos del gasto.",
    };
  }

  const amountCents = Math.round(Number(parsed.data.amount) * 100);
  if (amountCents <= 0) {
    return { ok: false, message: "El monto debe ser mayor a cero." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) {
    return { ok: false, message: "Inicia sesión para guardar gastos." };
  }

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId: user.id, isActive: true },
    include: {
      creditAccount: {
        include: {
          cycles: {
            where: { status: "open" },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  });

  if (!account) {
    return { ok: false, message: "La cuenta seleccionada no existe." };
  }

  const category = parsed.data.categoryId
    ? await prisma.category.findFirst({ where: { id: parsed.data.categoryId, userId: user.id } })
    : null;

  if (parsed.data.categoryId && !category) {
    return { ok: false, message: "La categoría seleccionada no existe." };
  }
  const budgetAccount = parsed.data.budgetAccountId
    ? await prisma.account.findFirst({
        where: {
          id: parsed.data.budgetAccountId,
          userId: user.id,
          isActive: true,
          type: { in: ["envelope", "savings"] },
        },
      })
    : null;

  if (parsed.data.budgetAccountId && !budgetAccount) {
    return { ok: false, message: "El sobre seleccionado no existe." };
  }

  const now = parseLocalDateTime(parsed.data.date, parsed.data.time);
  const isCreditAccount = account.type === "credit_card" || account.type === "store_card";

  if (isCreditAccount && !account.creditAccount) {
    return { ok: false, message: "La tarjeta seleccionada no tiene ciclo abierto." };
  }

  if (parsed.data.isInstallment && !isCreditAccount) {
    return { ok: false, message: "Los MSI solo se pueden registrar en una tarjeta." };
  }

  const merchantNormalized = normalizeMerchant(parsed.data.merchant);
  const fingerprint = createTransactionFingerprint({
    accountId: account.id,
    amountCents,
    date: now,
    merchantNormalized,
  });
  const duplicate = await findTolerantDuplicate({
    userId: user.id,
    accountId: account.id,
    amountCents,
    date: now,
    merchantNormalized,
  });

  if (duplicate) {
    return { ok: false, message: "Ya existe un gasto muy parecido en esas fechas." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const creditCycle = account.creditAccount
        ? await getOrCreateCreditCycle(tx, account.creditAccount, now)
        : null;

      await tx.transaction.create({
        data: {
          userId: user.id,
          accountId: account.id,
          budgetAccountId: budgetAccount?.id ?? null,
          creditCardCycleId: creditCycle?.id,
          categoryId: category?.id ?? null,
          date: now,
          merchantRaw: parsed.data.merchant,
          merchantNormalized,
          description: parsed.data.note || null,
          amountCents,
          direction: "expense",
          paymentMethod:
            isCreditAccount
              ? "credit_card"
              : account.type === "cash"
                ? "cash"
                : "debit",
          source: "manual",
          status: "confirmed",
          fingerprint,
        },
      });

      if (parsed.data.isInstallment && account.creditAccount) {
        const installments = parsed.data.installments ?? 3;
        const monthlyAmountCents = Math.round(amountCents / installments);

        await tx.installmentPlan.create({
          data: {
            userId: user.id,
            accountId: account.id,
            merchant: parsed.data.merchant,
            originalAmountCents: amountCents,
            monthlyAmountCents,
            totalInstallments: installments,
            currentInstallment: 1,
            startDate: now,
            status: "active",
          },
        });
      }

      if (!isCreditAccount) {
        await tx.account.update({
          where: { id: account.id },
          data: { currentBalanceCents: { decrement: amountCents } },
        });
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, message: "Este gasto parece estar duplicado." };
    }

    throw error;
  }

  revalidatePath("/");

  return { ok: true, message: "Gasto guardado." };
}

export type TransactionMutationState = { ok: boolean; message: string };

const updateTransactionSchema = z.object({
  transactionId: z.string().min(1),
  merchant: z.string().trim().min(1, "Escribe el comercio."),
  categoryId: z.string().optional(),
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Monto inválido."),
  date: z.string().min(1, "Selecciona la fecha."),
});

export async function updateTransactionAction(
  _prev: TransactionMutationState,
  formData: FormData,
): Promise<TransactionMutationState> {
  const parsed = updateTransactionSchema.safeParse({
    transactionId: formData.get("transactionId"),
    merchant: formData.get("merchant"),
    categoryId: formData.get("categoryId") || undefined,
    amount: formData.get("amount"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const tx = await prisma.transaction.findFirst({
    where: { id: parsed.data.transactionId, userId: user.id },
  });
  if (!tx) return { ok: false, message: "Movimiento no encontrado." };

  const amountCents = Math.round(Number(parsed.data.amount) * 100);
  if (amountCents <= 0) return { ok: false, message: "El monto debe ser mayor a cero." };

  const category = parsed.data.categoryId
    ? await prisma.category.findFirst({ where: { id: parsed.data.categoryId, userId: user.id } })
    : null;
  if (parsed.data.categoryId && !category) return { ok: false, message: "Categoría no encontrada." };

  await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      merchantRaw: parsed.data.merchant,
      merchantNormalized: normalizeMerchant(parsed.data.merchant),
      categoryId: category?.id ?? null,
      amountCents,
      date: new Date(parsed.data.date),
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Movimiento actualizado." };
}

export async function deleteTransactionAction(
  _prev: TransactionMutationState,
  formData: FormData,
): Promise<TransactionMutationState> {
  const transactionId = formData.get("transactionId");
  if (typeof transactionId !== "string" || !transactionId) {
    return { ok: false, message: "ID inválido." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: user.id },
  });
  if (!tx) return { ok: false, message: "Movimiento no encontrado." };

  await prisma.transaction.delete({ where: { id: tx.id } });

  revalidatePath("/");
  return { ok: true, message: "Movimiento eliminado." };
}

async function findTolerantDuplicate({
  userId,
  accountId,
  amountCents,
  date,
  merchantNormalized,
}: {
  userId: string;
  accountId: string;
  amountCents: number;
  date: Date;
  merchantNormalized: string;
}) {
  const start = new Date(date);
  start.setDate(start.getDate() - 2);
  const end = new Date(date);
  end.setDate(end.getDate() + 2);

  return prisma.transaction.findFirst({
    where: {
      userId,
      accountId,
      amountCents,
      merchantNormalized,
      direction: "expense",
      status: "confirmed",
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true },
  });
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
    update: {
      startDate: dates.startDate,
      endDate: dates.endDate,
      paymentDueDate: dates.paymentDueDate,
      budgetAmountCents: credit.personalBudgetCents,
      status: "open",
    },
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

function normalizeMerchant(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function createTransactionFingerprint({
  accountId,
  amountCents,
  date,
  merchantNormalized,
}: {
  accountId: string;
  amountCents: number;
  date: Date;
  merchantNormalized: string;
}) {
  const day = date.toISOString().slice(0, 10);
  return `${day}|${merchantNormalized}|${amountCents}|${accountId}`;
}

function parseLocalDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
