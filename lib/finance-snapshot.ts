import { prisma } from "@/lib/db";
import { getCreditCycleDates } from "@/lib/credit-cycles";
import { calculateDashboardMetrics, deriveAccountBalances } from "@/lib/finance-domain";

export type FinanceSnapshot = {
  user: {
    name: string;
    initials: string;
  };
  income: {
    amount: number;
    periodLabel: string;
    receivedAt: string;
    templates: {
      id: string;
      name: string;
      pago: number;
      ahorro: number;
      fijos: number;
      libre: number;
    }[];
  };
  allocation: {
    pagoTarjetas: number;
    ahorro: number;
    fijos: number;
    libre: number;
  };
  dashboard: {
    libre: number;
    committed: number;
    alerts: {
      label: string;
      detail: string;
      tone: "warn" | "danger";
    }[];
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
    id: string;
    name: string;
    balance: number;
    color: string;
    note: string;
    goal?: number;
    locked?: boolean;
  }[];
  bankAccounts: {
    id: string;
    name: string;
    balance: number;
    sub: string;
  }[];
  creditCards: {
    accountId: string;
    cycleId?: string;
    issuer: string;
    dot: string;
    daysToClose: number;
    used: number;
    paid: number;
    due: number;
    budget: number;
    limit: number;
    cycleLabel: string;
    paymentDue: string;
    categorySpend: {
      label: string;
      value: number;
      color: string;
    }[];
  }[];
  payments: {
    accountId?: string;
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
    dateIso: string;
    income?: boolean;
  }[];
  expenseForm: {
    categories: {
      id: string;
      label: string;
      color: string;
    }[];
    accounts: {
      id: string;
      label: string;
      sub: string;
      paymentMethod: "credit_card" | "debit" | "cash" | "transfer";
      cycleLabel?: string;
    }[];
  };
  settings: {
    accounts: {
      id: string;
      name: string;
      type: string;
      balance: number;
      isActive: boolean;
      credit?: {
        issuer: string;
        limit: number;
        cutoffDay: number;
        paymentDueDay: number;
        personalBudget: number;
      };
    }[];
    categories: {
      id: string;
      name: string;
      color: string;
      isSystem: boolean;
    }[];
    goals: {
      id: string;
      name: string;
      currentAmount: number;
      targetAmount: number;
      status: string;
    }[];
    budgets: {
      id: string;
      label: string;
      amount: number;
      periodStart: string;
      periodEnd: string;
    }[];
    templates: {
      id: string;
      name: string;
      pago: number;
      ahorro: number;
      fijos: number;
      libre: number;
    }[];
  };
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

function categoryColor(name: string) {
  const colors: Record<string, string> = {
    Transporte: "#2A5BFF",
    "Comida/salidas": "#8B6CF0",
    "Tools/subs": "#3DD6C9",
    MSI: "#F5B544",
    Libre: "#E94B6A",
    Fijos: "#3DD68C",
  };

  return colors[name] ?? "#a4adbe";
}

function daysUntil(date: Date) {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export async function getFinanceSnapshot(userId: string): Promise<FinanceSnapshot> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return emptySnapshot();
  }

  const [latestIncome, accounts, allAccounts, goals, creditAccounts, transactions, allTransactions, allocations, installmentPlans, budgets, categories, templates] = await Promise.all([
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
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { creditAccount: true },
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
          where: { status: { in: ["open", "closed", "paid"] } },
          orderBy: { startDate: "desc" },
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
    prisma.transaction.findMany({
      where: { userId: user.id, status: "confirmed" },
    }),
    prisma.allocation.findMany({
      where: { incomeEvent: { userId: user.id } },
    }),
    prisma.installmentPlan.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { startDate: "asc" },
      include: { account: true },
    }),
    prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: { periodStart: "desc" },
      include: { category: true, account: true },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.distributionTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const balances = deriveAccountBalances({
    accounts,
    allocations,
    transactions: allTransactions,
  });
  const balanceByAccountId = new Map(balances.map((balance) => [balance.accountId, balance.balanceCents]));

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
        id: account.id,
        balance: toAmount(balanceByAccountId.get(account.id) ?? account.currentBalanceCents),
        color: meta.color,
        note: meta.note,
        locked: meta.locked,
        goal: account.name === "Ahorro" && mainGoal ? toAmount(mainGoal.targetAmountCents) : undefined,
      };
    });

  const creditCards = creditAccounts.map((credit) => {
    const currentCycleDates = getCreditCycleDates(credit);
    const cycle = credit.cycles.find(
      (item) =>
        item.startDate.toISOString().slice(0, 10) === currentCycleDates.startDate.toISOString().slice(0, 10) &&
        item.endDate.toISOString().slice(0, 10) === currentCycleDates.endDate.toISOString().slice(0, 10),
    ) ?? credit.cycles[0];
    const used = cycle
      ? cycle.transactions.reduce((sum, transaction) => sum + toAmount(transaction.amountCents), 0)
      : 0;
    const categorySpend = Object.values(
      (cycle?.transactions ?? []).reduce<Record<string, { label: string; value: number; color: string }>>((acc, transaction) => {
        const label = transaction.category?.name ?? "Sin categoría";
        acc[label] ??= { label, value: 0, color: categoryColor(label) };
        acc[label].value += toAmount(transaction.amountCents);
        return acc;
      }, {}),
    );

    return {
      issuer: credit.account.name,
      accountId: credit.accountId,
      cycleId: cycle?.id,
      dot: cardColor(credit.account.name),
      daysToClose: cycle ? daysUntil(cycle.endDate) : 0,
      used,
      paid: toAmount(cycle?.paidAmountCents),
      due: Math.max(0, used - toAmount(cycle?.paidAmountCents)),
      budget: cycle ? toAmount(cycle.budgetAmountCents) : toAmount(credit.personalBudgetCents),
      limit: toAmount(credit.creditLimitCents),
      cycleLabel: cycle ? formatCycle(cycle.startDate, cycle.endDate) : "Sin ciclo abierto",
      paymentDue: cycle ? formatShortDate(cycle.paymentDueDate) : "Sin fecha",
      categorySpend,
    };
  });

  const payments = [
    ...installmentPlans.slice(0, 3).map((plan) => ({
      accountId: plan.accountId,
      label: plan.merchant,
      sub: `Mensualidad ${plan.currentInstallment} de ${plan.totalInstallments}`,
      date: formatShortDate(plan.startDate),
      amount: toAmount(plan.monthlyAmountCents),
      chip: plan.account.type === "envelope" ? "Fijos" : "MSI",
      chipColor: plan.account.type === "store_card" ? "#E94B6A" : undefined,
    })),
    ...creditCards.map((card) => ({
      label: card.issuer,
      sub: "Pago estimado del ciclo",
      date: card.paymentDue,
      amount: card.due,
      chip: "Tarjeta",
      chipColor: card.dot,
      muted: card.due === 0,
    })),
  ];
  const cardDueCents = creditCards.reduce((sum, card) => sum + Math.round(card.due * 100), 0);
  const installmentCents = installmentPlans.reduce((sum, plan) => sum + plan.monthlyAmountCents, 0);
  const dashboard = calculateDashboardMetrics({
    balances,
    accounts,
    cardDueCents,
    installmentCents,
    budgets,
    transactions: allTransactions,
  });

  return {
    user: {
      name: user.name,
      initials: initials(user.name),
    },
    income: {
      amount: toAmount(latestIncome?.amountCents),
      periodLabel: latestIncome ? `Quincena · ${formatShortDate(latestIncome.receivedAt)}` : "Sin ingreso registrado",
      receivedAt: latestIncome?.receivedAt.toISOString() ?? "",
      templates: templates.map((template) => ({
        id: template.id,
        name: template.name,
        pago: toAmount(template.pagoTarjetasCents),
        ahorro: toAmount(template.ahorroCents),
        fijos: toAmount(template.fijosCents),
        libre: toAmount(template.libreCents),
      })),
    },
    allocation,
    dashboard: {
      libre: toAmount(dashboard.libreCents),
      committed: toAmount(dashboard.committedCents),
      alerts: dashboard.alerts,
    },
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
        id: account.id,
        balance: toAmount(balanceByAccountId.get(account.id) ?? account.currentBalanceCents),
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
      dateIso: transaction.date.toISOString(),
      income: transaction.direction === "income",
    })),
    expenseForm: {
      categories: await getExpenseCategories(user.id),
      accounts: accounts
        .filter((account) => ["credit_card", "store_card", "debit", "cash", "envelope"].includes(account.type))
        .map((account) => {
          const credit = creditAccounts.find((item) => item.accountId === account.id);
          const cycle = credit?.cycles[0];
          const isCredit = account.type === "credit_card" || account.type === "store_card";

          return {
            id: account.id,
            label: account.name,
            sub: isCredit
              ? `${credit?.issuer ?? "Crédito"} · presupuesto ${toCurrency(toAmount(credit?.personalBudgetCents))}`
              : `${account.type === "envelope" ? "Sobre" : "Cuenta"} · ${toCurrency(toAmount(balanceByAccountId.get(account.id) ?? account.currentBalanceCents))}`,
            paymentMethod: isCredit ? "credit_card" : account.type === "cash" ? "cash" : "debit",
            cycleLabel: cycle ? `Ciclo ${formatCycle(cycle.startDate, cycle.endDate)}` : undefined,
          };
        }),
    },
    settings: {
      accounts: allAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: toAmount(balanceByAccountId.get(account.id) ?? account.currentBalanceCents),
        isActive: account.isActive,
        credit: account.creditAccount
          ? {
              issuer: account.creditAccount.issuer,
              limit: toAmount(account.creditAccount.creditLimitCents),
              cutoffDay: account.creditAccount.cutoffDay,
              paymentDueDay: account.creditAccount.paymentDueDay,
              personalBudget: toAmount(account.creditAccount.personalBudgetCents),
            }
          : undefined,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        color: category.color ?? "#a4adbe",
        isSystem: category.isSystem,
      })),
      goals: goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: toAmount(goal.currentAmountCents),
        targetAmount: toAmount(goal.targetAmountCents),
        status: goal.status,
      })),
      budgets: budgets.map((budget) => ({
        id: budget.id,
        label: budget.category?.name ?? budget.account?.name ?? budget.scope,
        amount: toAmount(budget.amountCents),
        periodStart: budget.periodStart.toISOString().slice(0, 10),
        periodEnd: budget.periodEnd.toISOString().slice(0, 10),
      })),
      templates: templates.map((template) => ({
        id: template.id,
        name: template.name,
        pago: toAmount(template.pagoTarjetasCents),
        ahorro: toAmount(template.ahorroCents),
        fijos: toAmount(template.fijosCents),
        libre: toAmount(template.libreCents),
      })),
    },
  };
}

async function getExpenseCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    label: category.name,
    color: category.color ?? "#a4adbe",
  }));
}

function toCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function emptySnapshot(): FinanceSnapshot {
  return {
    user: { name: "Iván", initials: "IV" },
    income: { amount: 0, periodLabel: "Sin datos", receivedAt: "", templates: [] },
    allocation: { pagoTarjetas: 0, ahorro: 0, fijos: 0, libre: 0 },
    dashboard: { libre: 0, committed: 0, alerts: [] },
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
    expenseForm: {
      categories: [],
      accounts: [],
    },
    settings: {
      accounts: [],
      categories: [],
      goals: [],
      budgets: [],
      templates: [],
    },
  };
}
