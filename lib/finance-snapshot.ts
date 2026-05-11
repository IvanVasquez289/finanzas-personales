import { prisma } from "@/lib/db";

export type FinanceSnapshot = {
  user: {
    name: string;
    initials: string;
  };
  income: {
    amount: number;
    periodLabel: string;
    receivedAt: string;
  };
  allocation: {
    pagoTarjetas: number;
    ahorro: number;
    fijos: number;
    libre: number;
  };
  goals: {
    ahorro: {
      name: string;
      currentAmount: number;
      targetAmount: number;
      monthlyDelta: number;
      history: number[];
    };
  };
  envelopes: {
    name: string;
    balance: number;
    color: string;
    note: string;
    goal?: number;
    locked?: boolean;
  }[];
  bankAccounts: {
    name: string;
    balance: number;
    sub: string;
  }[];
  creditCards: {
    issuer: string;
    dot: string;
    daysToClose: number;
    used: number;
    budget: number;
    limit: number;
    cycleLabel: string;
    paymentDue: string;
  }[];
  payments: {
    label: string;
    sub: string;
    date: string;
    amount: number;
    chip: string;
    chipColor?: string;
    muted?: boolean;
  }[];
  transactions: {
    merchant: string;
    cat: string;
    account: string;
    amount: number;
    date: string;
    income?: boolean;
  }[];
};

const MX_DATE = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Mexico_City",
});

const toAmount = (cents: number | null | undefined) => (cents ?? 0) / 100;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatShortDate(date: Date) {
  return MX_DATE.format(date).replace(".", "");
}

function formatCycle(start: Date, end: Date) {
  return `${formatShortDate(start)} → ${formatShortDate(end)}`;
}

function envelopeMeta(name: string) {
  const meta: Record<string, { color: string; note: string; locked?: boolean }> = {
    Ahorro: { color: "#3DD68C", note: "No tocar · meta MacBook", locked: true },
    "Pago tarjetas": { color: "#2A5BFF", note: "Reservado para tarjetas" },
    Fijos: { color: "#8B6CF0", note: "Pagos obligatorios del periodo" },
    Libre: { color: "#F5B544", note: "Gastos variables" },
  };

  return meta[name] ?? { color: "#a4adbe", note: "Cuenta activa" };
}

function cardColor(name: string) {
  if (name.toLowerCase().includes("liverpool")) return "#E94B6A";
  return "#2A5BFF";
}

function daysUntil(date: Date) {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    return emptySnapshot();
  }

  const [latestIncome, accounts, goals, creditAccounts, transactions, installmentPlans] = await Promise.all([
    prisma.incomeEvent.findFirst({
      where: { userId: user.id },
      orderBy: { receivedAt: "desc" },
      include: {
        allocations: {
          include: { account: true },
        },
      },
    }),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.goal.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.creditAccount.findMany({
      where: { account: { userId: user.id, isActive: true } },
      include: {
        account: true,
        cycles: {
          where: { status: "open" },
          orderBy: { startDate: "desc" },
          take: 1,
          include: {
            transactions: {
              where: { status: "confirmed", direction: "expense" },
              include: { category: true },
            },
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, status: "confirmed" },
      orderBy: { date: "desc" },
      take: 8,
      include: { account: true, category: true },
    }),
    prisma.installmentPlan.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { startDate: "asc" },
      include: { account: true },
    }),
  ]);

  const allocation = {
    pagoTarjetas: 0,
    ahorro: 0,
    fijos: 0,
    libre: 0,
  };

  for (const item of latestIncome?.allocations ?? []) {
    if (item.account.name === "Pago tarjetas") allocation.pagoTarjetas += toAmount(item.amountCents);
    if (item.account.name === "Ahorro") allocation.ahorro += toAmount(item.amountCents);
    if (item.account.name === "Fijos") allocation.fijos += toAmount(item.amountCents);
    if (item.account.name === "Libre") allocation.libre += toAmount(item.amountCents);
  }

  const mainGoal = goals[0];
  const savingAccount = accounts.find((account) => account.name === "Ahorro");

  const envelopes = accounts
    .filter((account) => ["savings", "envelope"].includes(account.type))
    .map((account) => {
      const meta = envelopeMeta(account.name);
      return {
        name: account.name,
        balance: toAmount(account.currentBalanceCents),
        color: meta.color,
        note: meta.note,
        locked: meta.locked,
        goal: account.name === "Ahorro" && mainGoal ? toAmount(mainGoal.targetAmountCents) : undefined,
      };
    });

  const creditCards = creditAccounts.map((credit) => {
    const cycle = credit.cycles[0];
    const used = cycle
      ? cycle.transactions.reduce((sum, transaction) => sum + toAmount(transaction.amountCents), 0)
      : 0;

    return {
      issuer: credit.account.name,
      dot: cardColor(credit.account.name),
      daysToClose: cycle ? daysUntil(cycle.endDate) : 0,
      used,
      budget: cycle ? toAmount(cycle.budgetAmountCents) : toAmount(credit.personalBudgetCents),
      limit: toAmount(credit.creditLimitCents),
      cycleLabel: cycle ? formatCycle(cycle.startDate, cycle.endDate) : "Sin ciclo abierto",
      paymentDue: cycle ? formatShortDate(cycle.paymentDueDate) : "Sin fecha",
    };
  });

  const payments = [
    ...installmentPlans.slice(0, 3).map((plan) => ({
      label: plan.merchant,
      sub: `Mensualidad ${plan.currentInstallment} de ${plan.totalInstallments}`,
      date: "21 may",
      amount: toAmount(plan.monthlyAmountCents),
      chip: plan.account.type === "envelope" ? "Fijos" : "MSI",
      chipColor: plan.account.type === "store_card" ? "#E94B6A" : undefined,
    })),
    ...creditCards.map((card) => ({
      label: card.issuer,
      sub: "Pago estimado del ciclo",
      date: card.paymentDue,
      amount: card.used,
      chip: "Tarjeta",
      chipColor: card.dot,
      muted: card.used === 0,
    })),
  ];

  return {
    user: {
      name: user.name,
      initials: initials(user.name),
    },
    income: {
      amount: toAmount(latestIncome?.amountCents),
      periodLabel: latestIncome ? `Quincena · ${formatShortDate(latestIncome.receivedAt)}` : "Sin ingreso registrado",
      receivedAt: latestIncome?.receivedAt.toISOString() ?? "",
    },
    allocation,
    goals: {
      ahorro: {
        name: mainGoal?.name ?? "Meta de ahorro",
        currentAmount: mainGoal ? toAmount(mainGoal.currentAmountCents) : toAmount(savingAccount?.currentBalanceCents),
        targetAmount: mainGoal ? toAmount(mainGoal.targetAmountCents) : 0,
        monthlyDelta: allocation.ahorro,
        history: [
          3500,
          4200,
          4800,
          5100,
          5300,
          5500,
          6200,
          7400,
          8200,
          9100,
          10100,
          mainGoal ? toAmount(mainGoal.currentAmountCents) : toAmount(savingAccount?.currentBalanceCents),
        ],
      },
    },
    envelopes,
    bankAccounts: accounts
      .filter((account) => ["debit", "cash"].includes(account.type))
      .map((account) => ({
        name: account.name,
        balance: toAmount(account.currentBalanceCents),
        sub: "Cuenta activa",
      })),
    creditCards,
    payments,
    transactions: transactions.map((transaction) => ({
      merchant: transaction.merchantNormalized ?? transaction.description ?? "Movimiento",
      cat: transaction.category?.name ?? "Sin categoría",
      account: transaction.account.name,
      amount: transaction.direction === "expense" ? -toAmount(transaction.amountCents) : toAmount(transaction.amountCents),
      date: formatShortDate(transaction.date),
      income: transaction.direction === "income",
    })),
  };
}

function emptySnapshot(): FinanceSnapshot {
  return {
    user: { name: "Iván", initials: "IV" },
    income: { amount: 0, periodLabel: "Sin datos", receivedAt: "" },
    allocation: { pagoTarjetas: 0, ahorro: 0, fijos: 0, libre: 0 },
    goals: {
      ahorro: {
        name: "Meta de ahorro",
        currentAmount: 0,
        targetAmount: 48000,
        monthlyDelta: 0,
        history: [0],
      },
    },
    envelopes: [],
    bankAccounts: [],
    creditCards: [],
    payments: [],
    transactions: [],
  };
}
