"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentFinanceUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type ConfirmDistributionState = {
  ok: boolean;
  message: string;
};

const confirmDistributionSchema = z.object({
  amount: z.coerce.number().positive("El ingreso debe ser mayor a cero."),
  receivedAt: z.string().min(1, "Selecciona la fecha de recepción."),
  depositAccountId: z.string().min(1, "Selecciona la cuenta donde recibiste la quincena."),
});

export async function confirmDistributionAction(
  _previousState: ConfirmDistributionState,
  formData: FormData,
): Promise<ConfirmDistributionState> {
  const parsed = confirmDistributionSchema.safeParse({
    amount: formData.get("amount"),
    receivedAt: formData.get("receivedAt"),
    depositAccountId: formData.get("depositAccountId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa la distribución.",
    };
  }

  const values = parsed.data;
  const allocationInputs = formData.getAll("allocation").map((value) => {
    const [accountId, amount] = String(value).split(":");
    return {
      accountId,
      amount: Number(amount),
    };
  });
  const validAllocationInputs = allocationInputs.filter((input) => input.accountId && Number.isFinite(input.amount) && input.amount >= 0);
  const total = validAllocationInputs.reduce((sum, input) => sum + input.amount, 0);

  if (Math.round(total * 100) !== Math.round(values.amount * 100)) {
    return { ok: false, message: "La distribución debe cuadrar con el ingreso." };
  }

  if (validAllocationInputs.length === 0) {
    return { ok: false, message: "Crea al menos una cuenta o sobre para distribuir." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) {
    return { ok: false, message: "Inicia sesión para confirmar la distribución." };
  }

  const today = new Date(`${values.receivedAt}T12:00:00`);
  const dayKey = values.receivedAt;
  const incomeId = `${user.id}:income:${dayKey}`;
  const amountCents = toCents(values.amount);

  const depositAccount = await prisma.account.findFirst({
    where: {
      id: values.depositAccountId,
      userId: user.id,
      isActive: true,
      type: { in: ["debit", "cash"] },
    },
  });

  if (!depositAccount) {
    return { ok: false, message: "La cuenta de depósito no está disponible." };
  }

  const accounts = await prisma.account.findMany({
    where: {
      userId: user.id,
      id: { in: validAllocationInputs.map((input) => input.accountId) },
      isActive: true,
      type: { in: ["savings", "envelope"] },
    },
  });
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const missingAccount = validAllocationInputs.find((input) => !accountById.has(input.accountId));

  if (missingAccount) {
    return { ok: false, message: "Una cuenta seleccionada ya no está disponible." };
  }

  await prisma.$transaction(async (tx) => {
    const income = await tx.incomeEvent.upsert({
      where: { id: incomeId },
      update: {
        amountCents,
        receivedAt: today,
        depositAccountId: depositAccount.id,
        source: "Quincena",
      },
      create: {
        id: incomeId,
        userId: user.id,
        depositAccountId: depositAccount.id,
        amountCents,
        receivedAt: today,
        source: "Quincena",
      },
    });

    const previousAllocations = await tx.allocation.findMany({
      where: { incomeEventId: income.id },
      include: { account: true },
    });
    let previousSavingsCents = 0;
    let nextSavingsCents = 0;

    for (const allocation of previousAllocations) {
      if (allocation.account.type === "savings") previousSavingsCents += allocation.amountCents;
      await tx.account.update({
        where: { id: allocation.accountId },
        data: { currentBalanceCents: { decrement: allocation.amountCents } },
      });
    }

    await tx.allocation.deleteMany({
      where: { incomeEventId: income.id },
    });

    for (const input of validAllocationInputs) {
      const account = accountById.get(input.accountId);
      if (!account) continue;

      const allocationId = `${income.id}:${account.id}`;
      const nextAmountCents = toCents(input.amount);
      if (account.type === "savings") nextSavingsCents += nextAmountCents;

      await tx.allocation.create({
        data: {
          id: allocationId,
          incomeEventId: income.id,
          accountId: account.id,
          amountCents: nextAmountCents,
        }
      });

      await tx.account.update({
        where: { id: account.id },
        data: { currentBalanceCents: { increment: nextAmountCents } },
      });
    }

    const savingsDeltaCents = nextSavingsCents - previousSavingsCents;
    if (savingsDeltaCents !== 0) {
      const goal = await tx.goal.findFirst({
        where: { userId: user.id, status: "active" },
        orderBy: { createdAt: "asc" },
      });

      if (goal) {
        await tx.goal.update({
          where: { id: goal.id },
          data: { currentAmountCents: { increment: savingsDeltaCents } },
        });
      }
    }

    const fingerprint = `${dayKey}|QUINCENA|${amountCents}|${depositAccount.id}`;

    await tx.transaction.upsert({
      where: { userId_fingerprint: { userId: user.id, fingerprint } },
      update: {
        accountId: depositAccount.id,
        amountCents,
        direction: "income",
        description: "Ingreso quincenal",
        merchantNormalized: "QUINCENA",
        status: "confirmed",
      },
      create: {
        userId: user.id,
        accountId: depositAccount.id,
        date: today,
        amountCents,
        direction: "income",
        paymentMethod: "transfer",
        source: "manual",
        status: "confirmed",
        description: "Ingreso quincenal",
        merchantNormalized: "QUINCENA",
        fingerprint,
      },
    });
  });

  revalidatePath("/");

  return { ok: true, message: "Distribución confirmada." };
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}
