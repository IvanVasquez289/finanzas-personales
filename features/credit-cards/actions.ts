"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

export type RegisterCardPaymentState = {
  ok: boolean;
  message: string;
};

const registerCardPaymentSchema = z.object({
  cycleId: z.string().min(1, "Selecciona un ciclo."),
  amount: z.coerce.number().positive("El pago debe ser mayor a cero."),
});

export async function registerCardPaymentAction(
  _previousState: RegisterCardPaymentState,
  formData: FormData,
): Promise<RegisterCardPaymentState> {
  const parsed = registerCardPaymentSchema.safeParse({
    cycleId: formData.get("cycleId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa el pago.",
    };
  }

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    return { ok: false, message: "No hay usuario configurado." };
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

  await prisma.$transaction(async (tx) => {
    const today = new Date();
    const fingerprint = `${today.toISOString().slice(0, 10)}|PAGO ${cycle.creditAccount.account.name.toUpperCase()}|${amountCents}|${cycle.id}`;
    const existingPayment = await tx.transaction.findUnique({
      where: { userId_fingerprint: { userId: user.id, fingerprint } },
    });
    const previousAmountCents = existingPayment?.amountCents ?? 0;
    const deltaCents = amountCents - previousAmountCents;

    await tx.creditCardCycle.update({
      where: { id: cycle.id },
      data: {
        paidAmountCents: { increment: deltaCents },
        statementAmountCents: cycle.statementAmountCents ?? amountCents,
      },
    });

    const paymentEnvelope = await tx.account.findFirst({
      where: { userId: user.id, name: "Pago tarjetas", isActive: true },
    });

    if (paymentEnvelope && deltaCents !== 0) {
      await tx.account.update({
        where: { id: paymentEnvelope.id },
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
        accountId: paymentEnvelope?.id ?? cycle.creditAccount.accountId,
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
