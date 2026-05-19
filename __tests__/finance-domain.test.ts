import { describe, it, expect } from "vitest";
import {
  deriveAccountBalances,
  calculateDashboardMetrics,
  type AccountBalance,
} from "@/lib/finance-domain";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAccount(overrides: Partial<{
  id: string;
  type: "debit" | "savings" | "credit_card" | "store_card" | "cash" | "envelope";
  currentBalanceCents: number;
}> = {}) {
  return {
    id: overrides.id ?? "acc1",
    type: overrides.type ?? "debit",
    currentBalanceCents: overrides.currentBalanceCents ?? 0,
  };
}

function makeAllocation(accountId: string, amountCents: number) {
  return { accountId, amountCents };
}

function makeTx(overrides: Partial<{
  accountId: string;
  budgetAccountId: string | null;
  amountCents: number;
  direction: "income" | "expense" | "transfer";
  source: "manual" | "screenshot" | "pdf" | "system";
}> = {}) {
  return {
    accountId: overrides.accountId ?? "acc1",
    budgetAccountId: "budgetAccountId" in overrides ? overrides.budgetAccountId ?? null : null,
    amountCents: overrides.amountCents ?? 0,
    direction: overrides.direction ?? "expense",
    source: overrides.source ?? "manual",
  };
}

const BASE_DATE = new Date("2020-01-01T00:00:00Z");

function makeCategory(name: string) {
  return { id: "cat1", userId: "user1", name, color: null, isSystem: false, createdAt: BASE_DATE };
}

function makeFullAccount(name: string) {
  return {
    id: "acc1", userId: "user1", name, type: "debit" as const,
    linkedCategoryId: null,
    currentBalanceCents: 0, sortOrder: 0, isActive: true,
    createdAt: BASE_DATE, updatedAt: BASE_DATE,
    creditAccount: null,
  };
}

function makeBudget(overrides: Partial<{
  categoryId: string | null;
  accountId: string | null;
  amountCents: number;
  periodStart: Date;
  periodEnd: Date;
  category: ReturnType<typeof makeCategory> | null;
  account: ReturnType<typeof makeFullAccount> | null;
}> = {}) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 10);
  const end = new Date(now);
  end.setDate(end.getDate() + 10);

  return {
    id: "bud1",
    userId: "user1",
    scope: "category" as "category" | "account" | "credit_cycle",
    categoryId: "categoryId" in overrides ? overrides.categoryId ?? null : "cat1",
    accountId: "accountId" in overrides ? overrides.accountId ?? null : null,
    creditCardCycleId: null,
    amountCents: overrides.amountCents ?? 10000,
    periodStart: overrides.periodStart ?? start,
    periodEnd: overrides.periodEnd ?? end,
    category: overrides.category !== undefined ? overrides.category : makeCategory("Comida"),
    account: overrides.account !== undefined ? overrides.account : null,
  };
}

function makeBalanceMetricsInput(overrides: Partial<Parameters<typeof calculateDashboardMetrics>[0]> = {}) {
  return {
    balances: overrides.balances ?? [],
    accounts: overrides.accounts ?? [],
    cardDueCents: overrides.cardDueCents ?? 0,
    installmentCents: overrides.installmentCents ?? 0,
    budgets: overrides.budgets ?? [],
    transactions: overrides.transactions ?? [],
  };
}

// ─── deriveAccountBalances ──────────────────────────────────────────────────

describe("deriveAccountBalances", () => {
  it("returns stored balance when there are no allocations or transactions", () => {
    const accounts = [makeAccount({ id: "acc1", currentBalanceCents: 5000 })];
    const result = deriveAccountBalances({ accounts, allocations: [], transactions: [] });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ accountId: "acc1", balanceCents: 5000, source: "stored" });
  });

  it("derives debit balance as income minus expenses plus adjustments", () => {
    const accounts = [makeAccount({ id: "acc1", type: "debit" })];
    const transactions = [
      makeTx({ accountId: "acc1", amountCents: 10000, direction: "income" }),
      makeTx({ accountId: "acc1", amountCents: 3000, direction: "expense" }),
      makeTx({ accountId: "acc1", amountCents: 500, direction: "expense" }),
    ];
    const result = deriveAccountBalances({ accounts, allocations: [], transactions });

    expect(result[0]).toMatchObject({ balanceCents: 6500, source: "derived" });
  });

  it("derives savings/envelope balance as allocations minus expenses", () => {
    const accounts = [makeAccount({ id: "env1", type: "envelope" })];
    const allocations = [makeAllocation("env1", 8000), makeAllocation("env1", 2000)];
    const transactions = [makeTx({ accountId: "env1", amountCents: 3000, direction: "expense" })];
    const result = deriveAccountBalances({ accounts, allocations, transactions });

    expect(result[0]).toMatchObject({ balanceCents: 7000, source: "derived" });
  });

  it("uses budgetAccountId to reduce an envelope while keeping the payment account separate", () => {
    const accounts = [
      makeAccount({ id: "bank1", type: "debit" }),
      makeAccount({ id: "food", type: "envelope" }),
    ];
    const allocations = [makeAllocation("food", 5000)];
    const transactions = [
      makeTx({ accountId: "bank1", budgetAccountId: "food", amountCents: 1200, direction: "expense" }),
    ];
    const result = deriveAccountBalances({ accounts, allocations, transactions });

    expect(result.find((balance) => balance.accountId === "bank1")?.balanceCents).toBe(-1200);
    expect(result.find((balance) => balance.accountId === "food")?.balanceCents).toBe(3800);
  });

  it("always returns 0 for credit_card accounts", () => {
    const accounts = [makeAccount({ id: "cc1", type: "credit_card", currentBalanceCents: 50000 })];
    const transactions = [makeTx({ accountId: "cc1", amountCents: 1000, direction: "income" })];
    const result = deriveAccountBalances({ accounts, allocations: [], transactions });

    expect(result[0]).toMatchObject({ balanceCents: 0, source: "derived" });
  });

  it("always returns 0 for store_card accounts", () => {
    const accounts = [makeAccount({ id: "sc1", type: "store_card", currentBalanceCents: 12000 })];
    const transactions = [makeTx({ accountId: "sc1", amountCents: 500, direction: "expense" })];
    const result = deriveAccountBalances({ accounts, allocations: [], transactions });

    expect(result[0]).toMatchObject({ balanceCents: 0, source: "derived" });
  });

  it("applies system adjustments (income adds, expense subtracts) for debit accounts", () => {
    const accounts = [makeAccount({ id: "acc1", type: "debit" })];
    const transactions = [
      makeTx({ accountId: "acc1", amountCents: 10000, direction: "income" }),
      makeTx({ accountId: "acc1", amountCents: 1000, direction: "income", source: "system" }),
      makeTx({ accountId: "acc1", amountCents: 500, direction: "expense", source: "system" }),
    ];
    const result = deriveAccountBalances({ accounts, allocations: [], transactions });

    // income: 10000 + 1000(income) = 11000; expenses: 0; adjustments: +1000 - 500 = +500
    // Wait, let me re-read the logic:
    // income = all income transactions = 10000 + 1000 = 11000
    // expenses = expense + transfer transactions = 500
    // adjustments = system transactions: income +1000, expense -500 = +500
    // balance = income - expenses + adjustments = 11000 - 500 + 500 = 11000
    expect(result[0]).toMatchObject({ balanceCents: 11000, source: "derived" });
  });

  it("handles transfer direction as expense for balance calculation", () => {
    const accounts = [makeAccount({ id: "acc1", type: "debit" })];
    const transactions = [
      makeTx({ accountId: "acc1", amountCents: 10000, direction: "income" }),
      makeTx({ accountId: "acc1", amountCents: 2000, direction: "transfer" }),
    ];
    const result = deriveAccountBalances({ accounts, allocations: [], transactions });

    expect(result[0]).toMatchObject({ balanceCents: 8000, source: "derived" });
  });

  it("handles multiple accounts independently", () => {
    const accounts = [
      makeAccount({ id: "acc1", type: "debit" }),
      makeAccount({ id: "acc2", type: "envelope" }),
      makeAccount({ id: "acc3", type: "credit_card" }),
    ];
    const allocations = [makeAllocation("acc2", 5000)];
    const transactions = [
      makeTx({ accountId: "acc1", amountCents: 10000, direction: "income" }),
      makeTx({ accountId: "acc1", amountCents: 3000, direction: "expense" }),
      makeTx({ accountId: "acc2", amountCents: 1000, direction: "expense" }),
      makeTx({ accountId: "acc3", amountCents: 2000, direction: "expense" }),
    ];
    const result = deriveAccountBalances({ accounts, allocations, transactions });

    expect(result.find(b => b.accountId === "acc1")?.balanceCents).toBe(7000);
    expect(result.find(b => b.accountId === "acc2")?.balanceCents).toBe(4000);
    expect(result.find(b => b.accountId === "acc3")?.balanceCents).toBe(0);
  });

  it("ignores other account allocations/transactions for each balance", () => {
    const accounts = [makeAccount({ id: "acc1", type: "debit", currentBalanceCents: 9999 })];
    const allocations = [makeAllocation("acc2", 5000)];
    const transactions = [makeTx({ accountId: "acc2", amountCents: 1000, direction: "expense" })];
    const result = deriveAccountBalances({ accounts, allocations, transactions });

    // acc1 has no ledger, should return stored
    expect(result[0]).toMatchObject({ balanceCents: 9999, source: "stored" });
  });
});

// ─── calculateDashboardMetrics ───────────────────────────────────────────────

describe("calculateDashboardMetrics", () => {
  it("sums spendable account balances for libreCents", () => {
    const accounts = [
      { id: "debit1", name: "BBVA Débito", type: "debit" as const },
      { id: "env1", name: "Ahorro", type: "envelope" as const },
      { id: "cc1", name: "BBVA Crédito", type: "credit_card" as const },
    ];
    const balances: AccountBalance[] = [
      { accountId: "debit1", balanceCents: 10000, source: "derived" },
      { accountId: "env1", balanceCents: 5000, source: "derived" },
      { accountId: "cc1", balanceCents: 0, source: "derived" },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ balances, accounts }));

    // credit_card is NOT spendable, so 10000 + 5000 = 15000
    expect(result.libreCents).toBe(15000);
  });

  it("includes savings accounts in libreCents", () => {
    const accounts = [{ id: "sav1", name: "Ahorro", type: "savings" as const }];
    const balances: AccountBalance[] = [{ accountId: "sav1", balanceCents: 20000, source: "derived" }];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ balances, accounts }));

    expect(result.libreCents).toBe(20000);
  });

  it("excludes credit_card and store_card from libreCents", () => {
    const accounts = [
      { id: "cc1", name: "Crédito", type: "credit_card" as const },
      { id: "sc1", name: "Liverpool", type: "store_card" as const },
    ];
    const balances: AccountBalance[] = [
      { accountId: "cc1", balanceCents: 50000, source: "derived" },
      { accountId: "sc1", balanceCents: 30000, source: "derived" },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ balances, accounts }));

    expect(result.libreCents).toBe(0);
  });

  it("sets committedCents as cardDueCents + installmentCents", () => {
    const result = calculateDashboardMetrics(
      makeBalanceMetricsInput({ cardDueCents: 15000, installmentCents: 3000 })
    );
    expect(result.committedCents).toBe(18000);
  });

  it("generates warn alert when budget is 85-99% spent", () => {
    const budget = makeBudget({ amountCents: 10000, category: makeCategory("Comida") });
    const transactions = [
      {
        categoryId: "cat1",
        accountId: "acc1",
        amountCents: 8600,
        direction: "expense" as const,
        status: "confirmed" as const,
        date: new Date(),
      },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ budgets: [budget], transactions }));

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]).toMatchObject({ label: "Comida", tone: "warn" });
  });

  it("generates danger alert when budget is 100%+ spent", () => {
    const budget = makeBudget({ amountCents: 10000, category: makeCategory("Comida") });
    const transactions = [
      {
        categoryId: "cat1",
        accountId: "acc1",
        amountCents: 12000,
        direction: "expense" as const,
        status: "confirmed" as const,
        date: new Date(),
      },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ budgets: [budget], transactions }));

    expect(result.alerts[0]).toMatchObject({ tone: "danger", detail: "Presupuesto rebasado" });
  });

  it("ignores transactions below 85% budget threshold", () => {
    const budget = makeBudget({ amountCents: 10000 });
    const transactions = [
      {
        categoryId: "cat1",
        accountId: "acc1",
        amountCents: 8000,
        direction: "expense" as const,
        status: "confirmed" as const,
        date: new Date(),
      },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ budgets: [budget], transactions }));

    expect(result.alerts).toHaveLength(0);
  });

  it("ignores non-expense transactions for budget calculation", () => {
    const budget = makeBudget({ amountCents: 10000 });
    const transactions = [
      {
        categoryId: "cat1",
        accountId: "acc1",
        amountCents: 9000,
        direction: "income" as const,
        status: "confirmed" as const,
        date: new Date(),
      },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ budgets: [budget], transactions }));

    expect(result.alerts).toHaveLength(0);
  });

  it("ignores transactions outside budget period", () => {
    const past = new Date();
    past.setDate(past.getDate() - 40);
    const pastEnd = new Date();
    pastEnd.setDate(pastEnd.getDate() - 30);
    const budget = makeBudget({ amountCents: 10000, periodStart: past, periodEnd: pastEnd });
    const transactions = [
      {
        categoryId: "cat1",
        accountId: "acc1",
        amountCents: 9500,
        direction: "expense" as const,
        status: "confirmed" as const,
        date: new Date(),
      },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ budgets: [budget], transactions }));

    expect(result.alerts).toHaveLength(0);
  });

  it("adds danger alert for negative spendable account balance", () => {
    const accounts = [{ id: "acc1", name: "BBVA Débito", type: "debit" as const }];
    const balances: AccountBalance[] = [{ accountId: "acc1", balanceCents: -500, source: "derived" }];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ balances, accounts }));

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]).toMatchObject({
      label: "BBVA Débito",
      tone: "danger",
      detail: "El saldo está en negativo",
    });
  });

  it("does not alert for negative credit card balance (not spendable)", () => {
    const accounts = [{ id: "cc1", name: "Crédito", type: "credit_card" as const }];
    const balances: AccountBalance[] = [{ accountId: "cc1", balanceCents: -10000, source: "derived" }];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ balances, accounts }));

    expect(result.alerts).toHaveLength(0);
  });

  it("returns zero libreCents and no alerts for empty input", () => {
    const result = calculateDashboardMetrics(makeBalanceMetricsInput());

    expect(result.libreCents).toBe(0);
    expect(result.committedCents).toBe(0);
    expect(result.alerts).toHaveLength(0);
  });

  it("uses account name as fallback label for account-scoped budget alerts", () => {
    const budget = makeBudget({
      categoryId: null,
      accountId: "acc1",
      amountCents: 10000,
      category: null,
      account: makeFullAccount("Gastos Fijos"),
    });
    budget.scope = "account";
    const transactions = [
      {
        categoryId: null,
        accountId: "acc1",
        amountCents: 9000,
        direction: "expense" as const,
        status: "confirmed" as const,
        date: new Date(),
      },
    ];
    const result = calculateDashboardMetrics(makeBalanceMetricsInput({ budgets: [budget], transactions }));

    expect(result.alerts[0]?.label).toBe("Gastos Fijos");
  });
});
