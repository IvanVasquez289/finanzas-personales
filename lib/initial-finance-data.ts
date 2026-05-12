import { prisma } from "@/lib/db";

const cents = (amount: number) => Math.round(amount * 100);

const categories = [
  ["Transporte", "#2A5BFF"],
  ["Comida/salidas", "#8B6CF0"],
  ["Tools/subs", "#3DD6C9"],
  ["MSI", "#F5B544"],
  ["Libre", "#F5B544"],
  ["Fijos", "#8B6CF0"],
  ["Ahorro", "#3DD68C"],
  ["Otros", "#a4adbe"],
] as const;

const accountSpecs = [
  ["Ahorro", "savings", 0],
  ["Pago tarjetas", "envelope", 0],
  ["Fijos", "envelope", 0],
  ["Libre", "envelope", 0],
  ["BBVA Débito", "debit", 0],
  ["Nu Débito", "debit", 0],
  ["BBVA Azul", "credit_card", 0],
  ["Liverpool", "store_card", 0],
] as const;

export async function ensureInitialFinanceData(userId: string) {
  const accountCount = await prisma.account.count({ where: { userId } });

  await Promise.all(
    categories.map(([name, color]) =>
      prisma.category.upsert({
        where: { userId_name: { userId, name } },
        update: { color, isSystem: true },
        create: { userId, name, color, isSystem: true },
      }),
    ),
  );

  if (accountCount > 0) return;

  const accounts = new Map<string, { id: string }>();

  for (const [name, type, balance] of accountSpecs) {
    const account = await prisma.account.upsert({
      where: { id: `${userId}:${name}` },
      update: {
        userId,
        name,
        type,
        currentBalanceCents: cents(balance),
        isActive: true,
      },
      create: {
        id: `${userId}:${name}`,
        userId,
        name,
        type,
        currentBalanceCents: cents(balance),
        isActive: true,
      },
    });

    accounts.set(name, account);
  }

  const bbva = accounts.get("BBVA Azul");
  const liverpool = accounts.get("Liverpool");

  if (bbva) {
    await prisma.creditAccount.upsert({
      where: { accountId: bbva.id },
      update: {
        issuer: "BBVA",
        creditLimitCents: cents(28000),
        cutoffDay: 5,
        paymentDueDay: 25,
        personalBudgetCents: cents(5000),
      },
      create: {
        accountId: bbva.id,
        issuer: "BBVA",
        creditLimitCents: cents(28000),
        cutoffDay: 5,
        paymentDueDay: 25,
        personalBudgetCents: cents(5000),
      },
    });
  }

  if (liverpool) {
    await prisma.creditAccount.upsert({
      where: { accountId: liverpool.id },
      update: {
        issuer: "Liverpool",
        creditLimitCents: cents(9000),
        cutoffDay: 21,
        paymentDueDay: 21,
        personalBudgetCents: cents(2200),
      },
      create: {
        accountId: liverpool.id,
        issuer: "Liverpool",
        creditLimitCents: cents(9000),
        cutoffDay: 21,
        paymentDueDay: 21,
        personalBudgetCents: cents(2200),
      },
    });
  }

  await prisma.goal.upsert({
    where: { id: `${userId}:goal:ahorro` },
    update: {
      name: "Meta de ahorro",
      targetAmountCents: cents(48000),
      status: "active",
    },
    create: {
      id: `${userId}:goal:ahorro`,
      userId,
      name: "Meta de ahorro",
      targetAmountCents: cents(48000),
      status: "active",
    },
  });
}
