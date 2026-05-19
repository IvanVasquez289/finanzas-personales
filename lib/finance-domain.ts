import type { Account, Allocation, Budget, Category, Transaction } from "@prisma/client";

export type AccountBalance = {
  accountId: string;
  balanceCents: number;
  source: "derived" | "stored";
};

export type DashboardMetrics = {
  libreCents: number;
  committedCents: number;
  alerts: {
    label: string;
    detail: string;
    tone: "warn" | "danger";
  }[];
};

export function deriveAccountBalances({
  accounts,
  allocations,
  transactions,
}: {
  accounts: Pick<Account, "id" | "type" | "currentBalanceCents">[];
  allocations: Pick<Allocation, "accountId" | "amountCents">[];
  transactions: Pick<Transaction, "accountId" | "budgetAccountId" | "amountCents" | "direction" | "source">[];
}): AccountBalance[] {
  return accounts.map((account) => {
    const accountAllocations = allocations
      .filter((allocation) => allocation.accountId === account.id)
      .reduce((sum, allocation) => sum + allocation.amountCents, 0);
    const accountTransactions = transactions.filter((transaction) => transaction.accountId === account.id);
    const budgetTransactions = transactions.filter((transaction) => transaction.budgetAccountId === account.id);
    const income = accountTransactions
      .filter((transaction) => transaction.direction === "income")
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);
    const expenses = accountTransactions
      .filter((transaction) => transaction.direction === "expense" || transaction.direction === "transfer")
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);
    const adjustments = accountTransactions
      .filter((transaction) => transaction.source === "system")
      .reduce((sum, transaction) => {
        if (transaction.direction === "income") return sum + transaction.amountCents;
        if (transaction.direction === "expense") return sum - transaction.amountCents;
        return sum;
      }, 0);
    const legacyEnvelopeTransactions =
      account.type === "savings" || account.type === "envelope"
        ? accountTransactions.filter((transaction) => !transaction.budgetAccountId && transaction.source !== "system")
        : [];
    const hasLedger = accountAllocations !== 0 || accountTransactions.length > 0 || budgetTransactions.length > 0;

    if (!hasLedger) {
      return {
        accountId: account.id,
        balanceCents: account.currentBalanceCents,
        source: "stored",
      };
    }

    if (account.type === "savings" || account.type === "envelope") {
      const budgetExpenses = [...budgetTransactions, ...legacyEnvelopeTransactions]
        .filter((transaction) => transaction.direction === "expense" || transaction.direction === "transfer")
        .reduce((sum, transaction) => sum + transaction.amountCents, 0);
      const budgetAdjustments = accountTransactions
        .filter((transaction) => transaction.source === "system")
        .reduce((sum, transaction) => {
          if (transaction.direction === "income") return sum + transaction.amountCents;
          if (transaction.direction === "expense") return sum - transaction.amountCents;
          return sum;
        }, 0);

      return {
        accountId: account.id,
        balanceCents: accountAllocations - budgetExpenses + budgetAdjustments,
        source: "derived",
      };
    }

    if (account.type === "credit_card" || account.type === "store_card") {
      return {
        accountId: account.id,
        balanceCents: 0,
        source: "derived",
      };
    }

    return {
      accountId: account.id,
      balanceCents: income - expenses + adjustments,
      source: "derived",
    };
  });
}

export function calculateDashboardMetrics({
  balances,
  accounts,
  cardDueCents,
  installmentCents,
  budgets,
  transactions,
}: {
  balances: AccountBalance[];
  accounts: Pick<Account, "id" | "name" | "type">[];
  cardDueCents: number;
  installmentCents: number;
  budgets: (Budget & { category?: Category | null; account?: Account | null })[];
  transactions: Pick<Transaction, "categoryId" | "accountId" | "amountCents" | "direction" | "status" | "date">[];
}): DashboardMetrics {
  const spendableAccountIds = new Set(
    accounts
      .filter((account) => ["debit", "cash", "envelope", "savings"].includes(account.type))
      .map((account) => account.id),
  );
  const libreCents = balances
    .filter((balance) => spendableAccountIds.has(balance.accountId))
    .reduce((sum, balance) => sum + balance.balanceCents, 0);
  const committedCents = cardDueCents + installmentCents;
  const now = new Date();
  const alerts = budgets.flatMap((budget) => {
    if (budget.periodStart > now || budget.periodEnd < now) return [];

    const spent = transactions
      .filter((transaction) => {
        if (transaction.direction !== "expense" || transaction.status !== "confirmed") return false;
        if (transaction.date < budget.periodStart || transaction.date > budget.periodEnd) return false;
        if (budget.categoryId) return transaction.categoryId === budget.categoryId;
        if (budget.accountId) return transaction.accountId === budget.accountId;
        return false;
      })
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);

    const ratio = budget.amountCents > 0 ? spent / budget.amountCents : 0;
    if (ratio < 0.85) return [];

    const label = budget.category?.name ?? budget.account?.name ?? "Presupuesto";
    return [{
      label,
      detail: ratio >= 1 ? "Presupuesto rebasado" : "Presupuesto cerca del límite",
      tone: ratio >= 1 ? "danger" as const : "warn" as const,
    }];
  });

  for (const balance of balances) {
    if (balance.balanceCents >= 0 || !spendableAccountIds.has(balance.accountId)) continue;
    const account = accounts.find((item) => item.id === balance.accountId);
    alerts.unshift({
      label: account?.name ?? "Cuenta",
      detail: "El saldo está en negativo",
      tone: "danger",
    });
  }

  return {
    libreCents,
    committedCents,
    alerts,
  };
}
