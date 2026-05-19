"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentFinanceUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type RegisterCardPaymentState = {
  ok: boolean;
  message: string;
};

const registerCardPaymentSchema = z.object({
  cycleId: z.string().min(1, "Selecciona un ciclo."),
  amount: z.coerce.number().positive("El pago debe ser mayor a cero."),
  paymentAccountId: z.string().optional(),
});

export async function registerCardPaymentAction(
  _previousState: RegisterCardPaymentState,
  formData: FormData,
): Promise<RegisterCardPaymentState> {
  const parsed = registerCardPaymentSchema.safeParse({
    cycleId: formData.get("cycleId"),
    amount: formData.get("amount"),
    paymentAccountId: formData.get("paymentAccountId") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa el pago.",
    };
  }

  const user = await getCurrentFinanceUser();
  if (!user) {
    return { ok: false, message: "Inicia sesión para registrar pagos." };
  }

  const amountCents = Math.round(parsed.data.amount * 100);
  const cycle = await prisma.creditCardCycle.findFirst({
    where: {
      id: parsed.data.cycleId,
      creditAccount: { account: { userId: user.id } },
    },
    include: { creditAccount: { include: { account: true } } },
  });

  if (!cycle) {
    return { ok: false, message: "El ciclo seleccionado no existe." };
  }

  const paymentAccount = parsed.data.paymentAccountId
    ? await prisma.account.findFirst({
        where: {
          id: parsed.data.paymentAccountId,
          userId: user.id,
          isActive: true,
          type: { in: ["debit", "cash"] },
        },
      })
    : await prisma.account.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          type: { in: ["debit", "cash"] },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

  if (!paymentAccount) {
    return { ok: false, message: "Crea o selecciona una cuenta origen para pagar la tarjeta." };
  }

  await prisma.$transaction(async (tx) => {
    const today = new Date();
    const fingerprint = `${today.toISOString().slice(0, 10)}|PAGO ${cycle.creditAccount.account.name.toUpperCase()}|${cycle.id}`;
    const cycleExpenseCents = await tx.transaction.aggregate({
      where: {
        creditCardCycleId: cycle.id,
        direction: "expense",
        status: "confirmed",
      },
      _sum: { amountCents: true },
    });
    const statementAmountCents = cycle.statementAmountCents ?? cycleExpenseCents._sum.amountCents ?? 0;
    const existingPayment = await tx.transaction.findUnique({
      where: { userId_fingerprint: { userId: user.id, fingerprint } },
    });
    const previousAmountCents = existingPayment?.amountCents ?? 0;
    const deltaCents = amountCents - previousAmountCents;

    await tx.creditCardCycle.update({
      where: { id: cycle.id },
      data: {
        paidAmountCents: { increment: deltaCents },
        statementAmountCents,
        status: (cycle.paidAmountCents ?? 0) + deltaCents >= statementAmountCents ? "paid" : cycle.status,
      },
    });

    if (deltaCents !== 0) {
      await tx.account.update({
        where: { id: paymentAccount.id },
        data: { currentBalanceCents: { decrement: deltaCents } },
      });
    }

    await tx.transaction.upsert({
      where: { userId_fingerprint: { userId: user.id, fingerprint } },
      update: {
        amountCents,
        description: `Pago de tarjeta ${cycle.creditAccount.account.name}`,
        status: "confirmed",
      },
      create: {
        userId: user.id,
        accountId: paymentAccount.id,
        creditCardCycleId: cycle.id,
        date: today,
        merchantNormalized: `PAGO ${cycle.creditAccount.account.name.toUpperCase()}`,
        description: `Pago de tarjeta ${cycle.creditAccount.account.name}`,
        amountCents,
        direction: "transfer",
        paymentMethod: "transfer",
        source: "manual",
        status: "confirmed",
        fingerprint,
      },
    });
  });

  revalidatePath("/");

  return { ok: true, message: "Pago registrado." };
}

export async function closeCreditCycleAction(
  _previousState: RegisterCardPaymentState,
  formData: FormData,
): Promise<RegisterCardPaymentState> {
  const parsed = z.object({ cycleId: z.string().min(1) }).safeParse({
    cycleId: formData.get("cycleId"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Selecciona un ciclo." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) {
    return { ok: false, message: "Inicia sesión para cerrar ciclos." };
  }

  const cycle = await prisma.creditCardCycle.findFirst({
    where: {
      id: parsed.data.cycleId,
      creditAccount: { account: { userId: user.id } },
    },
  });

  if (!cycle) {
    return { ok: false, message: "El ciclo seleccionado no existe." };
  }

  const total = await prisma.transaction.aggregate({
    where: {
      creditCardCycleId: cycle.id,
      direction: "expense",
      status: "confirmed",
    },
    _sum: { amountCents: true },
  });

  await prisma.creditCardCycle.update({
    where: { id: cycle.id },
    data: {
      statementAmountCents: total._sum.amountCents ?? 0,
      status: (cycle.paidAmountCents ?? 0) >= (total._sum.amountCents ?? 0) ? "paid" : "closed",
    },
  });

  revalidatePath("/");

  return { ok: true, message: "Ciclo cerrado." };
}
