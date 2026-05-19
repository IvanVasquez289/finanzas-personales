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
    depositAccountId?: string;
  };
  allocation: {
    pagoTarjetas: number;
    ahorro: number;
    fijos: number;
    libre: number;
    items: {
      accountId: string;
      name: string;
      amount: number;
      color: string;
    }[];
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
    sortOrder: number;
    goal?: number;
    locked?: boolean;
  }[];
  bankAccounts: {
    id: string;
    name: string;
    balance: number;
    sub: string;
    sortOrder: number;
  }[];
  previousIncome?: {
    amount: number;
    receivedAt: string;
  };
  creditCards: {
    accountId: string;
    cycleId?: string;
    issuer: string;
    dot: string;
    daysToClose: number;
    cycleStartDate?: string;
    used: number;
    paid: number;
    due: number;
    budget: number;
    limit: number;
    cycleLabel: string;
    paymentDue: string;
    paymentDueIso: string;
    categorySpend: {
      label: string;
      value: number;
      color: string;
    }[];
    transactions: FinanceTransaction[];
  }[];
  payments: {
    accountId?: string;
    label: string;
    sub: string;
    date: string;
    dateIso: string;
    amount: number;
    chip: string;
    chipColor?: string;
    muted?: boolean;
    currentInstallment?: number;
    totalInstallments?: number;
  }[];
  transactions: {
    id: string;
    merchant: string;
    cat: string;
    account: string;
    amount: number;
    date: string;
    dateIso: string;
    income?: boolean;
  }[];
  movementDetail: FinanceTransaction[];
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
    budgetAccounts: {
      id: string;
      label: string;
      balance: number;
      color: string;
    }[];
  };
  settings: {
    accounts: {
      id: string;
      name: string;
      type: string;
      balance: number;
      isActive: boolean;
      sortOrder: number;
      credit?: {
        issuer: string;
        color: string;
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
      spent: number;
      periodStart: string;
      periodEnd: string;
      isRolling: boolean;
    }[];
    installmentPlans: {
      id: string;
      merchant: string;
      monthly: number;
      original: number;
      current: number;
      total: number;
      accountId: string;
      accountName: string;
    }[];
  };
};

export type FinanceTransaction = {
  id: string;
  merchant: string;
  cat: string;
  categoryId?: string;
  account: string;
  accountId: string;
  accountType: string;
  budgetAccount?: string;
  budgetAccountId?: string;
  amount: number;
  date: string;
  dateIso: string;
  direction: "income" | "expense" | "transfer";
  paymentMethod: string;
  source: string;
  status: string;
  cycleId?: string;
  cycleLabel?: string;
  income?: boolean;
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
  const palette = ["#2A5BFF", "#3DD68C", "#F5B544", "#8B6CF0", "#3DD6C9", "#E94B6A"];
  const color = palette[Math.abs(hashText(name)) % palette.length] ?? "#a4adbe";

  return { color, note: "Cuenta activa" };
}

function defaultCardColor(name: string) {
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

  const [incomeEvents, accounts, allAccounts, goals, creditAccounts, transactions, movementTransactions, allTransactions, allocations, installmentPlans, budgets, categories] = await Promise.all([
    prisma.incomeEvent.findMany({
      where: { userId: user.id },
      orderBy: { receivedAt: "desc" },
      take: 24,
      include: {
        allocations: {
          include: { account: true },
        },
      },
    }),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
      include: { account: true, budgetAccount: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, status: "confirmed" },
      orderBy: { date: "desc" },
      take: 200,
      include: {
        account: true,
        budgetAccount: true,
        category: true,
        creditCardCycle: true,
      },
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
  ]);
  const currentIncomeEvent = incomeEvents[0] ?? null;
  const previousIncomeEvent = incomeEvents[1] ?? null;

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
    items: [] as FinanceSnapshot["allocation"]["items"],
  };

  for (const item of currentIncomeEvent?.allocations ?? []) {
    allocation.items.push({
      accountId: item.accountId,
      name: item.account.name,
      amount: toAmount(item.amountCents),
      color: envelopeMeta(item.account.name).color,
    });
  }

  const mainGoal = goals[0];
  const savingAccount = accounts.find((account) => account.type === "savings");
  const savingsAllocation = currentIncomeEvent?.allocations
    .filter((item) => item.account.type === "savings")
    .reduce((sum, item) => sum + toAmount(item.amountCents), 0) ?? 0;

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
        sortOrder: account.sortOrder,
        goal: account.type === "savings" && mainGoal ? toAmount(mainGoal.targetAmountCents) : undefined,
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
    const cycleTransactions = (cycle?.transactions ?? [])
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((transaction) => ({
        id: transaction.id,
        merchant: transaction.merchantNormalized ?? transaction.description ?? "Movimiento",
        cat: transaction.category?.name ?? "Sin categoría",
        account: credit.account.name,
        accountId: credit.accountId,
        accountType: credit.account.type,
        amount: -toAmount(transaction.amountCents),
        date: formatShortDate(transaction.date),
        dateIso: transaction.date.toISOString(),
        direction: transaction.direction,
        paymentMethod: transaction.paymentMethod,
        source: transaction.source,
        status: transaction.status,
        cycleId: cycle?.id,
        cycleLabel: cycle ? formatCycle(cycle.startDate, cycle.endDate) : undefined,
      }));

    return {
      issuer: credit.account.name,
      accountId: credit.accountId,
      cycleId: cycle?.id,
      dot: credit.color ?? defaultCardColor(credit.account.name),
      daysToClose: cycle ? daysUntil(cycle.endDate) : 0,
      cycleStartDate: cycle?.startDate.toISOString().slice(0, 10),
      used,
      paid: toAmount(cycle?.paidAmountCents),
      due: Math.max(0, used - toAmount(cycle?.paidAmountCents)),
      budget: cycle ? toAmount(cycle.budgetAmountCents) : toAmount(credit.personalBudgetCents),
      limit: toAmount(credit.creditLimitCents),
      cycleLabel: cycle ? formatCycle(cycle.startDate, cycle.endDate) : "Sin ciclo abierto",
      paymentDue: cycle ? formatShortDate(cycle.paymentDueDate) : "Sin fecha",
      paymentDueIso: cycle?.paymentDueDate.toISOString() ?? "",
      categorySpend,
      transactions: cycleTransactions,
    };
  });

  const payments = [
    ...installmentPlans.slice(0, 3).map((plan) => {
      const nextDate = new Date(plan.startDate);
      nextDate.setMonth(nextDate.getMonth() + plan.currentInstallment);
      return {
        accountId: plan.accountId,
        label: plan.merchant,
        sub: `Mensualidad ${plan.currentInstallment} de ${plan.totalInstallments}`,
        date: formatShortDate(nextDate),
        dateIso: nextDate.toISOString(),
        amount: toAmount(plan.monthlyAmountCents),
        chip: plan.account.type === "envelope" ? "Sobre" : "MSI",
        chipColor: plan.account.type === "store_card" ? "#E94B6A" : undefined,
        currentInstallment: plan.currentInstallment,
        totalInstallments: plan.totalInstallments,
      };
    }),
    ...creditCards.map((card) => ({
      label: card.issuer,
      sub: "Pago estimado del ciclo",
      date: card.paymentDue,
      dateIso: card.paymentDueIso,
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

  const currentSavings = mainGoal
    ? toAmount(mainGoal.currentAmountCents)
    : toAmount(savingAccount?.currentBalanceCents);

  return {
    user: {
      name: user.name,
      initials: initials(user.name),
    },
    income: {
      amount: toAmount(currentIncomeEvent?.amountCents),
      periodLabel: currentIncomeEvent ? `Quincena · ${formatShortDate(currentIncomeEvent.receivedAt)}` : "Sin ingreso registrado",
      receivedAt: currentIncomeEvent?.receivedAt.toISOString() ?? "",
      depositAccountId: currentIncomeEvent?.depositAccountId ?? undefined,
    },
    previousIncome: previousIncomeEvent
      ? {
          amount: toAmount(previousIncomeEvent.amountCents),
          receivedAt: previousIncomeEvent.receivedAt.toISOString(),
        }
      : undefined,
    allocation,
    dashboard: {
      libre: toAmount(dashboard.libreCents),
      committed: toAmount(dashboard.committedCents),
      alerts: dashboard.alerts,
    },
    goals: {
      ahorro: {
        name: mainGoal?.name ?? "Meta",
        currentAmount: currentSavings,
        targetAmount: mainGoal ? toAmount(mainGoal.targetAmountCents) : 0,
        monthlyDelta: savingsAllocation,
        history: buildSavingsHistory(incomeEvents, currentSavings),
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
        sortOrder: account.sortOrder,
      })),
    creditCards,
    payments,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      merchant: transaction.merchantNormalized ?? transaction.description ?? "Movimiento",
      cat: transaction.category?.name ?? "Sin categoría",
      account: transaction.account.name,
      amount: transaction.direction === "expense" ? -toAmount(transaction.amountCents) : toAmount(transaction.amountCents),
      date: formatShortDate(transaction.date),
      dateIso: transaction.date.toISOString(),
      income: transaction.direction === "income",
    })),
    movementDetail: movementTransactions.map((transaction) => ({
      id: transaction.id,
      merchant: transaction.merchantNormalized ?? transaction.description ?? "Movimiento",
      cat: transaction.category?.name ?? "Sin categoría",
      categoryId: transaction.categoryId ?? undefined,
      account: transaction.account.name,
      accountId: transaction.accountId,
      accountType: transaction.account.type,
      budgetAccount: transaction.budgetAccount?.name,
      budgetAccountId: transaction.budgetAccountId ?? undefined,
      amount: transaction.direction === "expense" ? -toAmount(transaction.amountCents) : toAmount(transaction.amountCents),
      date: formatShortDate(transaction.date),
      dateIso: transaction.date.toISOString(),
      direction: transaction.direction,
      paymentMethod: transaction.paymentMethod,
      source: transaction.source,
      status: transaction.status,
      cycleId: transaction.creditCardCycleId ?? undefined,
      cycleLabel: transaction.creditCardCycle
        ? formatCycle(transaction.creditCardCycle.startDate, transaction.creditCardCycle.endDate)
        : undefined,
      income: transaction.direction === "income",
    })),
    expenseForm: {
      categories: await getExpenseCategories(user.id),
      accounts: accounts
        .filter((account) => ["credit_card", "store_card", "debit", "cash"].includes(account.type))
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
      budgetAccounts: envelopes.map((envelope) => ({
        id: envelope.id,
        label: envelope.name,
        balance: envelope.balance,
        color: envelope.color,
      })),
    },
    settings: {
      accounts: allAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: toAmount(balanceByAccountId.get(account.id) ?? account.currentBalanceCents),
        isActive: account.isActive,
        sortOrder: account.sortOrder,
        credit: account.creditAccount
          ? {
              issuer: account.creditAccount.issuer,
              color: account.creditAccount.color ?? defaultCardColor(account.name),
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
      budgets: budgets.map((budget) => {
        const storedStart = budget.periodStart.toISOString().slice(0, 10);
        const storedEnd = budget.periodEnd.toISOString().slice(0, 10);
        const spanDays = (budget.periodEnd.getTime() - budget.periodStart.getTime()) / 86_400_000;
        const isRolling = spanDays >= 28 && spanDays <= 32 && storedEnd < new Date().toISOString().slice(0, 10);
        const todayIso = new Date().toISOString().slice(0, 10);
        const monthStart = todayIso.slice(0, 8) + "01";
        const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const monthEnd = `${todayIso.slice(0, 8)}${lastDay}`;
        const start = isRolling ? monthStart : storedStart;
        const end = isRolling ? monthEnd : storedEnd;
        const spentCents = allTransactions
          .filter((tx) => {
            if (tx.direction !== "expense") return false;
            const d = tx.date.toISOString().slice(0, 10);
            return d >= start && d <= end;
          })
          .filter((tx) =>
            budget.categoryId
              ? tx.categoryId === budget.categoryId
              : budget.accountId
                ? tx.accountId === budget.accountId
                : false,
          )
          .reduce((sum, tx) => sum + tx.amountCents, 0);
        return {
          id: budget.id,
          label: budget.category?.name ?? budget.account?.name ?? budget.scope,
          amount: toAmount(budget.amountCents),
          spent: toAmount(spentCents),
          periodStart: start,
          periodEnd: end,
          isRolling,
        };
      }),
      installmentPlans: installmentPlans.map((plan) => ({
        id: plan.id,
        merchant: plan.merchant,
        monthly: toAmount(plan.monthlyAmountCents),
        original: toAmount(plan.originalAmountCents),
        current: plan.currentInstallment,
        total: plan.totalInstallments,
        accountId: plan.accountId,
        accountName: plan.account.name,
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
    income: { amount: 0, periodLabel: "Sin datos", receivedAt: "" },
    allocation: { pagoTarjetas: 0, ahorro: 0, fijos: 0, libre: 0, items: [] },
    dashboard: { libre: 0, committed: 0, alerts: [] },
    goals: {
      ahorro: {
        name: "Meta",
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
    movementDetail: [],
    expenseForm: {
      categories: [],
      accounts: [],
      budgetAccounts: [],
    },
    settings: {
      accounts: [],
      categories: [],
      goals: [],
      budgets: [],
      installmentPlans: [],
    },
  };
}

function hashText(value: string) {
  return value.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function buildSavingsHistory(
  events: Array<{ receivedAt: Date; allocations: Array<{ amountCents: number; account: { type: string } }> }>,
  currentBalance: number,
): number[] {
  const monthlyMap = new Map<string, number>();
  for (const event of [...events].reverse()) {
    const month = event.receivedAt.toISOString().slice(0, 7);
    const savings = event.allocations
      .filter((a) => a.account.type === "savings")
      .reduce((sum, a) => sum + a.amountCents / 100, 0);
    if (savings > 0) monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + savings);
  }
  const months = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  if (months.length < 2) return [0, Math.round(currentBalance)];
  let cumulative = 0;
  const history = months.map(([, amount]) => { cumulative += amount; return Math.round(cumulative); });
  history[history.length - 1] = Math.round(currentBalance);
  return history;
}
