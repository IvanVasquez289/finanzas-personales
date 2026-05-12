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
  pago: z.coerce.number().min(0, "Pago tarjetas no puede ser negativo."),
  ahorro: z.coerce.number().min(0, "Ahorro no puede ser negativo."),
  fijos: z.coerce.number().min(0, "Fijos no puede ser negativo."),
  libre: z.coerce.number().min(0, "Libre no puede ser negativo."),
  receivedAt: z.string().min(1, "Selecciona la fecha de recepción."),
});

const allocationTargets = [
  ["pago", "Pago tarjetas"],
  ["ahorro", "Ahorro"],
  ["fijos", "Fijos"],
  ["libre", "Libre"],
] as const;

export async function confirmDistributionAction(
  _previousState: ConfirmDistributionState,
  formData: FormData,
): Promise<ConfirmDistributionState> {
  const parsed = confirmDistributionSchema.safeParse({
    amount: formData.get("amount"),
    pago: formData.get("pago"),
    ahorro: formData.get("ahorro"),
    fijos: formData.get("fijos"),
    libre: formData.get("libre"),
    receivedAt: formData.get("receivedAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa la distribución.",
    };
  }

  const values = parsed.data;
  const total = values.pago + values.ahorro + values.fijos + values.libre;

  if (Math.round(total * 100) !== Math.round(values.amount * 100)) {
    return { ok: false, message: "La distribución debe cuadrar con el ingreso." };
  }

  const user = await getCurrentFinanceUser();
  if (!user) {
    return { ok: false, message: "Inicia sesión para confirmar la distribución." };
  }

  const today = new Date(`${values.receivedAt}T12:00:00`);
  const dayKey = values.receivedAt;
  const incomeId = `${user.id}:income:${dayKey}`;
  const amountCents = toCents(values.amount);

  const accounts = await prisma.account.findMany({
    where: {
      userId: user.id,
      name: { in: allocationTargets.map(([, name]) => name) },
      isActive: true,
    },
  });
  const accountByName = new Map(accounts.map((account) => [account.name, account]));
  const missingAccount = allocationTargets.find(([, name]) => !accountByName.has(name));

  if (missingAccount) {
    return { ok: false, message: `Falta el sobre ${missingAccount[1]}.` };
  }

  await prisma.$transaction(async (tx) => {
    const income = await tx.incomeEvent.upsert({
      where: { id: incomeId },
      update: {
        amountCents,
        receivedAt: today,
        source: "Quincena",
      },
      create: {
        id: incomeId,
        userId: user.id,
        amountCents,
        receivedAt: today,
        source: "Quincena",
      },
    });

    for (const [key, accountName] of allocationTargets) {
      const account = accountByName.get(accountName);
      if (!account) continue;

      const allocationId = `${income.id}:${account.id}`;
      const nextAmountCents = toCents(values[key]);
      const existingAllocation = await tx.allocation.findUnique({
        where: { id: allocationId },
      });
      const previousAmountCents = existingAllocation?.amountCents ?? 0;
      const deltaCents = nextAmountCents - previousAmountCents;

      await tx.allocation.upsert({
        where: { id: allocationId },
        update: { amountCents: nextAmountCents },
        create: {
          id: allocationId,
          incomeEventId: income.id,
          accountId: account.id,
          amountCents: nextAmountCents,
        },
      });

      if (deltaCents !== 0) {
        await tx.account.update({
          where: { id: account.id },
          data: { currentBalanceCents: { increment: deltaCents } },
        });

        if (account.name === "Ahorro") {
          const goal = await tx.goal.findFirst({
            where: { userId: user.id, status: "active" },
            orderBy: { createdAt: "asc" },
          });

          if (goal) {
            await tx.goal.update({
              where: { id: goal.id },
              data: { currentAmountCents: { increment: deltaCents } },
            });
          }
        }
      }
    }

    const depositAccount =
      (await tx.account.findFirst({
        where: { userId: user.id, type: "debit", isActive: true },
        orderBy: { createdAt: "asc" },
      })) ?? accounts[0];
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
