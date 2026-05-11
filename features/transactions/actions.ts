"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  categoryId: z.string().min(1, "Selecciona una categoría."),
  merchant: z.string().trim().min(1, "Escribe el comercio."),
  note: z.string().trim().max(180, "La nota es demasiado larga.").optional(),
});

export async function createExpenseAction(
  _previousState: CreateExpenseState,
  formData: FormData,
): Promise<CreateExpenseState> {
  const parsed = createExpenseSchema.safeParse({
    amount: formData.get("amount"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    merchant: formData.get("merchant"),
    note: formData.get("note"),
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

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    return { ok: false, message: "No hay usuario configurado." };
  }

  const [account, category] = await Promise.all([
    prisma.account.findFirst({
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
    }),
    prisma.category.findFirst({
      where: { id: parsed.data.categoryId, userId: user.id },
    }),
  ]);

  if (!account) {
    return { ok: false, message: "La cuenta seleccionada no existe." };
  }

  if (!category) {
    return { ok: false, message: "La categoría seleccionada no existe." };
  }

  const now = new Date();
  const cycle = account.creditAccount?.cycles.find(
    (item) => now >= item.startDate && now <= item.endDate,
  ) ?? account.creditAccount?.cycles[0];

  if ((account.type === "credit_card" || account.type === "store_card") && !cycle) {
    return { ok: false, message: "La tarjeta seleccionada no tiene ciclo abierto." };
  }

  const merchantNormalized = normalizeMerchant(parsed.data.merchant);
  const fingerprint = createTransactionFingerprint({
    accountId: account.id,
    amountCents,
    date: now,
    merchantNormalized,
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId: user.id,
          accountId: account.id,
          creditCardCycleId: cycle?.id,
          categoryId: category.id,
          date: now,
          merchantRaw: parsed.data.merchant,
          merchantNormalized,
          description: parsed.data.note || null,
          amountCents,
          direction: "expense",
          paymentMethod:
            account.type === "credit_card" || account.type === "store_card"
              ? "credit_card"
              : account.type === "cash"
                ? "cash"
                : "debit",
          source: "manual",
          status: "confirmed",
          fingerprint,
        },
      });

      if (account.type !== "credit_card" && account.type !== "store_card") {
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

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
