require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const cents = (amount) => Math.round(amount * 100);

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "ivan.local@finanzas.app" },
    update: { name: "Iván" },
    create: { email: "ivan.local@finanzas.app", name: "Iván" },
  });

  const categories = await Promise.all(
    [
      ["Transporte", "#2A5BFF"],
      ["Comida/salidas", "#8B6CF0"],
      ["Tools/subs", "#3DD6C9"],
      ["MSI", "#F5B544"],
      ["Libre", "#F5B544"],
      ["Fijos", "#8B6CF0"],
      ["Ahorro", "#3DD68C"],
      ["Otros", "#a4adbe"],
    ].map(([name, color]) =>
      prisma.category.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: { color, isSystem: true },
        create: { userId: user.id, name, color, isSystem: true },
      }),
    ),
  );

  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const accountSpecs = [
    ["Ahorro", "savings", 11000],
    ["Pago tarjetas", "envelope", 5127],
    ["Fijos", "envelope", 1900],
    ["Libre", "envelope", 1820],
    ["BBVA Débito", "debit", 8847],
    ["Nu Débito", "debit", 0],
    ["BBVA Azul", "credit_card", 0],
    ["Liverpool", "store_card", 0],
  ];

  const accounts = {};
  for (const [name, type, balance] of accountSpecs) {
    accounts[name] = await prisma.account.upsert({
      where: { id: `${user.id}:${name}` },
      update: {
        userId: user.id,
        name,
        type,
        currentBalanceCents: cents(balance),
        isActive: true,
      },
      create: {
        id: `${user.id}:${name}`,
        userId: user.id,
        name,
        type,
        currentBalanceCents: cents(balance),
        isActive: true,
      },
    });
  }

  const bbvaCredit = await prisma.creditAccount.upsert({
    where: { accountId: accounts["BBVA Azul"].id },
    update: {
      issuer: "BBVA",
      creditLimitCents: cents(28000),
      cutoffDay: 5,
      paymentDueDay: 25,
      personalBudgetCents: cents(5000),
    },
    create: {
      accountId: accounts["BBVA Azul"].id,
      issuer: "BBVA",
      creditLimitCents: cents(28000),
      cutoffDay: 5,
      paymentDueDay: 25,
      personalBudgetCents: cents(5000),
    },
  });

  const liverpoolCredit = await prisma.creditAccount.upsert({
    where: { accountId: accounts["Liverpool"].id },
    update: {
      issuer: "Liverpool",
      creditLimitCents: cents(9000),
      cutoffDay: 21,
      paymentDueDay: 21,
      personalBudgetCents: cents(2200),
    },
    create: {
      accountId: accounts["Liverpool"].id,
      issuer: "Liverpool",
      creditLimitCents: cents(9000),
      cutoffDay: 21,
      paymentDueDay: 21,
      personalBudgetCents: cents(2200),
    },
  });

  const bbvaCycle = await prisma.creditCardCycle.upsert({
    where: { id: `${bbvaCredit.id}:2026-05-06` },
    update: {
      startDate: new Date("2026-05-06T06:00:00.000Z"),
      endDate: new Date("2026-06-05T06:00:00.000Z"),
      paymentDueDate: new Date("2026-06-25T06:00:00.000Z"),
      budgetAmountCents: cents(5000),
      status: "open",
    },
    create: {
      id: `${bbvaCredit.id}:2026-05-06`,
      creditAccountId: bbvaCredit.id,
      startDate: new Date("2026-05-06T06:00:00.000Z"),
      endDate: new Date("2026-06-05T06:00:00.000Z"),
      paymentDueDate: new Date("2026-06-25T06:00:00.000Z"),
      budgetAmountCents: cents(5000),
      status: "open",
    },
  });

  const liverpoolCycle = await prisma.creditCardCycle.upsert({
    where: { id: `${liverpoolCredit.id}:2026-04-22` },
    update: {
      startDate: new Date("2026-04-22T06:00:00.000Z"),
      endDate: new Date("2026-05-21T06:00:00.000Z"),
      paymentDueDate: new Date("2026-05-21T06:00:00.000Z"),
      budgetAmountCents: cents(2200),
      status: "open",
    },
    create: {
      id: `${liverpoolCredit.id}:2026-04-22`,
      creditAccountId: liverpoolCredit.id,
      startDate: new Date("2026-04-22T06:00:00.000Z"),
      endDate: new Date("2026-05-21T06:00:00.000Z"),
      paymentDueDate: new Date("2026-05-21T06:00:00.000Z"),
      budgetAmountCents: cents(2200),
      status: "open",
    },
  });

  await prisma.goal.upsert({
    where: { id: `${user.id}:goal:ahorro` },
    update: {
      name: "Meta · MacBook + colchón",
      targetAmountCents: cents(48000),
      currentAmountCents: cents(11000),
      status: "active",
    },
    create: {
      id: `${user.id}:goal:ahorro`,
      userId: user.id,
      name: "Meta · MacBook + colchón",
      targetAmountCents: cents(48000),
      currentAmountCents: cents(11000),
      status: "active",
    },
  });

  const income = await prisma.incomeEvent.upsert({
    where: { id: `${user.id}:income:2026-05-01` },
    update: {
      amountCents: cents(9250),
      receivedAt: new Date("2026-05-01T12:00:00.000Z"),
      source: "Quincena",
    },
    create: {
      id: `${user.id}:income:2026-05-01`,
      userId: user.id,
      amountCents: cents(9250),
      receivedAt: new Date("2026-05-01T12:00:00.000Z"),
      source: "Quincena",
    },
  });

  for (const [name, amount] of [
    ["Pago tarjetas", 2500],
    ["Ahorro", 2500],
    ["Fijos", 1000],
    ["Libre", 3250],
  ]) {
    await prisma.allocation.upsert({
      where: { id: `${income.id}:${accounts[name].id}` },
      update: { amountCents: cents(amount) },
      create: {
        id: `${income.id}:${accounts[name].id}`,
        incomeEventId: income.id,
        accountId: accounts[name].id,
        amountCents: cents(amount),
      },
    });
  }

  const transactionSpecs = [
    ["2026-05-09T20:22:00.000Z", "Uber", "UBER RIDE", 69.6, "Transporte", accounts["BBVA Azul"].id, bbvaCycle.id, "credit_card"],
    ["2026-05-09T15:05:00.000Z", "Spotify", "SPOTIFY", 115, "Tools/subs", accounts["BBVA Azul"].id, bbvaCycle.id, "credit_card"],
    ["2026-05-08T20:00:00.000Z", "iCloud+", "APPLE ICLOUD", 49, "Tools/subs", accounts["BBVA Azul"].id, bbvaCycle.id, "credit_card"],
    ["2026-05-08T16:30:00.000Z", "Didi", "DIDI RIDES", 128.4, "Transporte", accounts["BBVA Azul"].id, bbvaCycle.id, "credit_card"],
    ["2026-05-07T18:10:00.000Z", "Claude", "CLAUDE.AI", 399, "Tools/subs", accounts["BBVA Azul"].id, bbvaCycle.id, "credit_card"],
    ["2026-05-07T03:15:00.000Z", "Uber Eats", "UBER EATS", 245, "Comida/salidas", accounts["BBVA Azul"].id, bbvaCycle.id, "credit_card"],
    ["2026-05-08T02:11:00.000Z", "Bama", "BAMA", 87.5, "Libre", accounts["BBVA Débito"].id, null, "debit"],
    ["2026-05-05T18:00:00.000Z", "Liverpool", "LIVERPOOL", 1280, "MSI", accounts["Liverpool"].id, liverpoolCycle.id, "credit_card"],
  ];

  for (const [date, merchant, raw, amount, categoryName, accountId, cycleId, paymentMethod] of transactionSpecs) {
    const fingerprint = `${date.slice(0, 10)}|${merchant.toUpperCase()}|${amount.toFixed(2)}|${accountId}`;
    await prisma.transaction.upsert({
      where: { userId_fingerprint: { userId: user.id, fingerprint } },
      update: {
        accountId,
        creditCardCycleId: cycleId,
        categoryId: categoryByName[categoryName].id,
        merchantRaw: raw,
        merchantNormalized: merchant.toUpperCase(),
        amountCents: cents(amount),
        direction: "expense",
        paymentMethod,
        source: "manual",
        status: "confirmed",
      },
      create: {
        userId: user.id,
        accountId,
        creditCardCycleId: cycleId,
        categoryId: categoryByName[categoryName].id,
        date: new Date(date),
        merchantRaw: raw,
        merchantNormalized: merchant.toUpperCase(),
        amountCents: cents(amount),
        direction: "expense",
        paymentMethod,
        source: "manual",
        status: "confirmed",
        fingerprint,
      },
    });
  }

  await prisma.transaction.upsert({
    where: {
      userId_fingerprint: {
        userId: user.id,
        fingerprint: "2026-05-01|QUINCENA|9250.00|NU",
      },
    },
    update: {
      amountCents: cents(9250),
      direction: "income",
      categoryId: categoryByName["Ahorro"].id,
    },
    create: {
      userId: user.id,
      accountId: accounts["Nu Débito"].id,
      date: new Date("2026-05-01T12:00:00.000Z"),
      merchantNormalized: "QUINCENA",
      description: "Ingreso quincenal",
      amountCents: cents(9250),
      direction: "income",
      paymentMethod: "transfer",
      source: "manual",
      status: "confirmed",
      categoryId: categoryByName["Ahorro"].id,
      fingerprint: "2026-05-01|QUINCENA|9250.00|NU",
    },
  });

  for (const [merchant, original, monthly, totalInstallments, currentInstallment, accountName] of [
    ["MacBook", 16800, 1400, 12, 9, "Fijos"],
    ["Apple · Audífonos", 4800, 400, 12, 6, "BBVA Azul"],
    ["Liverpool · Ropa", 2100, 350, 6, 2, "Liverpool"],
    ["Amazon · Monitor", 3870, 645, 6, 3, "BBVA Azul"],
  ]) {
    await prisma.installmentPlan.upsert({
      where: { id: `${user.id}:msi:${merchant}` },
      update: {
        originalAmountCents: cents(original),
        monthlyAmountCents: cents(monthly),
        totalInstallments,
        currentInstallment,
        status: "active",
      },
      create: {
        id: `${user.id}:msi:${merchant}`,
        userId: user.id,
        accountId: accounts[accountName].id,
        merchant,
        originalAmountCents: cents(original),
        monthlyAmountCents: cents(monthly),
        totalInstallments,
        currentInstallment,
        startDate: new Date("2025-09-01T06:00:00.000Z"),
        status: "active",
      },
    });
  }

  console.log("Seed complete:", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
