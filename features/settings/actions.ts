"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentFinanceUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type SettingsActionState = {
  ok: boolean;
  message: string;
};

const emptyState: SettingsActionState = { ok: false, message: "" };

const moneySchema = z.coerce.number().min(0);

export const initialSettingsState = emptyState;

export async function createAccountAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    name: z.string().trim().min(1, "Escribe el nombre."),
    type: z.enum(["debit", "savings", "cash", "envelope"]),
    openingBalance: moneySchema,
  }).safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    openingBalance: formData.get("openingBalance") || 0,
  });

  if (!parsed.success) return error(parsed.error.issues[0]?.message);
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  const balanceCents = toCents(parsed.data.openingBalance);
  const sortOrder = await nextAccountSortOrder(user.id);
  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      currentBalanceCents: balanceCents,
      sortOrder,
    },
  });

  if (balanceCents > 0) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: account.id,
        date: new Date(),
        amountCents: balanceCents,
        direction: "income",
        paymentMethod: "transfer",
        source: "system",
        status: "confirmed",
        description: "Saldo inicial",
        merchantNormalized: "SALDO INICIAL",
        fingerprint: `${account.id}:opening:${balanceCents}`,
      },
    });
  }

  revalidatePath("/");
  return { ok: true, message: "Cuenta creada." };
}

export async function updateAccountAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    type: z.enum(["debit", "savings", "cash", "envelope"]),
  }).safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) return error("Revisa la cuenta.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.account.update({
    where: { id: parsed.data.id, userId: user.id },
    data: { name: parsed.data.name, type: parsed.data.type },
  });

  revalidatePath("/");
  return { ok: true, message: "Cuenta actualizada." };
}

export async function deactivateAccountAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({ id: z.string().min(1) }).safeParse({ id: formData.get("id") });
  if (!parsed.success) return error("Selecciona una cuenta.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.account.update({
    where: { id: parsed.data.id, userId: user.id },
    data: { isActive: false },
  });

  revalidatePath("/");
  return { ok: true, message: "Cuenta desactivada." };
}

export async function adjustAccountBalanceAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    id: z.string().min(1),
    amount: z.coerce.number(),
    note: z.string().trim().max(120).optional(),
  }).safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });

  if (!parsed.success || parsed.data.amount === 0) return error("Escribe un ajuste distinto de cero.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  const account = await prisma.account.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!account) return error("La cuenta no existe.");

  const amountCents = Math.abs(toCents(parsed.data.amount));
  const direction = parsed.data.amount > 0 ? "income" : "expense";

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: account.id,
        date: new Date(),
        amountCents,
        direction,
        paymentMethod: "transfer",
        source: "system",
        status: "confirmed",
        description: parsed.data.note || "Ajuste manual auditado",
        merchantNormalized: "AJUSTE MANUAL",
        fingerprint: `${account.id}:adjustment:${Date.now()}:${amountCents}:${direction}`,
      },
    }),
    prisma.account.update({
      where: { id: account.id },
      data: {
        currentBalanceCents: {
          [direction === "income" ? "increment" : "decrement"]: amountCents,
        },
      },
    }),
  ]);

  revalidatePath("/");
  return { ok: true, message: "Ajuste registrado." };
}

export async function reorderAccountAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    id: z.string().min(1),
    direction: z.enum(["up", "down"]),
  }).safeParse({
    id: formData.get("id"),
    direction: formData.get("direction"),
  });

  if (!parsed.success) return error("Selecciona un sobre.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  const accounts = await prisma.account.findMany({
    where: {
      userId: user.id,
      isActive: true,
      type: { in: ["savings", "envelope"] },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const currentIndex = accounts.findIndex((account) => account.id === parsed.data.id);
  if (currentIndex < 0) return error("El sobre no existe.");

  const targetIndex = parsed.data.direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= accounts.length) {
    return { ok: true, message: "El orden ya está actualizado." };
  }

  const nextAccounts = [...accounts];
  const [current] = nextAccounts.splice(currentIndex, 1);
  nextAccounts.splice(targetIndex, 0, current);

  await prisma.$transaction(
    nextAccounts.map((account, index) =>
      prisma.account.updateMany({
        where: { id: account.id, userId: user.id },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePath("/");
  return { ok: true, message: "Orden actualizado." };
}

export async function createCreditCardAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    name: z.string().trim().min(1),
    issuer: z.string().trim().min(1),
    type: z.enum(["credit_card", "store_card"]),
    creditLimit: moneySchema,
    cutoffDay: z.coerce.number().int().min(1).max(31),
    paymentDueDay: z.coerce.number().int().min(1).max(31),
    personalBudget: moneySchema,
  }).safeParse({
    name: formData.get("name"),
    issuer: formData.get("issuer"),
    type: formData.get("type"),
    creditLimit: formData.get("creditLimit") || 0,
    cutoffDay: formData.get("cutoffDay"),
    paymentDueDay: formData.get("paymentDueDay"),
    personalBudget: formData.get("personalBudget") || 0,
  });

  if (!parsed.success) return error(parsed.error.issues[0]?.message);
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.account.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      sortOrder: await nextAccountSortOrder(user.id),
      creditAccount: {
        create: {
          issuer: parsed.data.issuer,
          creditLimitCents: toCents(parsed.data.creditLimit),
          cutoffDay: parsed.data.cutoffDay,
          paymentDueDay: parsed.data.paymentDueDay,
          personalBudgetCents: toCents(parsed.data.personalBudget),
        },
      },
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Tarjeta creada." };
}

export async function updateCreditCardAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    accountId: z.string().min(1),
    name: z.string().trim().min(1),
    issuer: z.string().trim().min(1),
    creditLimit: moneySchema,
    cutoffDay: z.coerce.number().int().min(1).max(31),
    paymentDueDay: z.coerce.number().int().min(1).max(31),
    personalBudget: moneySchema,
  }).safeParse({
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    issuer: formData.get("issuer"),
    creditLimit: formData.get("creditLimit") || 0,
    cutoffDay: formData.get("cutoffDay"),
    paymentDueDay: formData.get("paymentDueDay"),
    personalBudget: formData.get("personalBudget") || 0,
  });

  if (!parsed.success) return error("Revisa la tarjeta.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.account.update({
    where: { id: parsed.data.accountId, userId: user.id },
    data: {
      name: parsed.data.name,
      creditAccount: {
        update: {
          issuer: parsed.data.issuer,
          creditLimitCents: toCents(parsed.data.creditLimit),
          cutoffDay: parsed.data.cutoffDay,
          paymentDueDay: parsed.data.paymentDueDay,
          personalBudgetCents: toCents(parsed.data.personalBudget),
        },
      },
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Tarjeta actualizada." };
}

export async function createCategoryAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    name: z.string().trim().min(1),
    color: z.string().trim().min(4),
  }).safeParse({
    name: formData.get("name"),
    color: formData.get("color") || "#a4adbe",
  });

  if (!parsed.success) return error("Revisa la categoría.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.category.create({
    data: { userId: user.id, name: parsed.data.name, color: parsed.data.color },
  });

  revalidatePath("/");
  return { ok: true, message: "Categoría creada." };
}

export async function updateCategoryAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    color: z.string().trim().min(4),
  }).safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    color: formData.get("color") || "#a4adbe",
  });

  if (!parsed.success) return error("Revisa la categoría.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.category.update({
    where: { id: parsed.data.id, userId: user.id },
    data: { name: parsed.data.name, color: parsed.data.color },
  });

  revalidatePath("/");
  return { ok: true, message: "Categoría actualizada." };
}

export async function deleteCategoryAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({ id: z.string().min(1) }).safeParse({ id: formData.get("id") });
  if (!parsed.success) return error("Selecciona una categoría.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  const count = await prisma.transaction.count({ where: { userId: user.id, categoryId: parsed.data.id } });
  if (count > 0) return error("No se puede eliminar una categoría con movimientos.");

  await prisma.category.delete({ where: { id: parsed.data.id, userId: user.id } });
  revalidatePath("/");
  return { ok: true, message: "Categoría eliminada." };
}

export async function createGoalAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    name: z.string().trim().min(1),
    targetAmount: moneySchema,
  }).safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount") || 0,
  });
  if (!parsed.success) return error("Revisa la meta.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.goal.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      targetAmountCents: toCents(parsed.data.targetAmount),
      status: "active",
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Meta creada." };
}

export async function updateGoalAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    targetAmount: moneySchema,
    status: z.enum(["active", "completed", "paused"]),
  }).safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount") || 0,
    status: formData.get("status"),
  });
  if (!parsed.success) return error("Revisa la meta.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.goal.update({
    where: { id: parsed.data.id, userId: user.id },
    data: {
      name: parsed.data.name,
      targetAmountCents: toCents(parsed.data.targetAmount),
      status: parsed.data.status,
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Meta actualizada." };
}

export async function createBudgetAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({
    scope: z.enum(["category", "account"]),
    targetId: z.string().min(1),
    amount: moneySchema,
    periodStart: z.string().min(1),
    periodEnd: z.string().min(1),
  }).safeParse({
    scope: formData.get("scope"),
    targetId: formData.get("targetId"),
    amount: formData.get("amount") || 0,
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
  });
  if (!parsed.success) return error("Revisa el presupuesto.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  const [category, account] = await Promise.all([
    prisma.category.findFirst({ where: { id: parsed.data.targetId, userId: user.id } }),
    prisma.account.findFirst({ where: { id: parsed.data.targetId, userId: user.id } }),
  ]);
  const scope = category ? "category" : account ? "account" : parsed.data.scope;
  if (!category && !account) return error("El objetivo del presupuesto no existe.");

  await prisma.budget.create({
    data: {
      userId: user.id,
      scope,
      categoryId: category ? parsed.data.targetId : null,
      accountId: account ? parsed.data.targetId : null,
      amountCents: toCents(parsed.data.amount),
      periodStart: new Date(`${parsed.data.periodStart}T00:00:00`),
      periodEnd: new Date(`${parsed.data.periodEnd}T23:59:59`),
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Presupuesto creado." };
}

export async function deleteBudgetAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({ id: z.string().min(1) }).safeParse({ id: formData.get("id") });
  if (!parsed.success) return error("Selecciona un presupuesto.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  await prisma.budget.delete({ where: { id: parsed.data.id, userId: user.id } });
  revalidatePath("/");
  return { ok: true, message: "Presupuesto eliminado." };
}

export async function deleteAccountAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({ id: z.string().min(1) }).safeParse({ id: formData.get("id") });
  if (!parsed.success) return error("Selecciona una cuenta.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!account) return error("La cuenta no existe.");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.installmentPlan.deleteMany({ where: { accountId: parsed.data.id } });
      await tx.allocation.deleteMany({ where: { accountId: parsed.data.id } });
      await tx.transaction.deleteMany({ where: { accountId: parsed.data.id, userId: user.id } });
      await tx.account.delete({ where: { id: parsed.data.id, userId: user.id } });
    });
  } catch {
    return error("No se pudo eliminar la cuenta.");
  }

  revalidatePath("/");
  return { ok: true, message: "Cuenta eliminada." };
}

export async function deleteCreditCardAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = z.object({ id: z.string().min(1) }).safeParse({ id: formData.get("id") });
  if (!parsed.success) return error("Selecciona una tarjeta.");
  const user = await getCurrentFinanceUser();
  if (!user) return error("Inicia sesión.");

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.id, userId: user.id },
    include: { creditAccount: { include: { cycles: { select: { id: true } } } } },
  });
  if (!account || !account.creditAccount) return error("La tarjeta no existe.");

  const cycleIds = account.creditAccount.cycles.map((c) => c.id);

  try {
    await prisma.$transaction(async (tx) => {
      if (cycleIds.length > 0) {
        await tx.transaction.updateMany({
          where: { creditCardCycleId: { in: cycleIds } },
          data: { creditCardCycleId: null },
        });
        await tx.budget.deleteMany({ where: { creditCardCycleId: { in: cycleIds } } });
        await tx.creditCardCycle.deleteMany({ where: { id: { in: cycleIds } } });
      }
      await tx.installmentPlan.deleteMany({ where: { accountId: parsed.data.id } });
      await tx.transaction.deleteMany({ where: { accountId: parsed.data.id, userId: user.id } });
      await tx.creditAccount.delete({ where: { accountId: parsed.data.id } });
      await tx.account.delete({ where: { id: parsed.data.id, userId: user.id } });
    });
  } catch {
    return error("No se pudo eliminar la tarjeta.");
  }

  revalidatePath("/");
  return { ok: true, message: "Tarjeta eliminada." };
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

async function nextAccountSortOrder(userId: string) {
  const last = await prisma.account.findFirst({
    where: { userId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return (last?.sortOrder ?? -1) + 1;
}

function error(message = "Revisa los datos.") {
  return { ok: false, message };
}
