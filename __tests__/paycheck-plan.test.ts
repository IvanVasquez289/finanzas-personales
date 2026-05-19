import { describe, expect, it } from "vitest";
import { buildPaycheckPlan } from "@/lib/paycheck-plan";

describe("buildPaycheckPlan", () => {
  it("prioritizes upcoming card and installment payments within the pay period", () => {
    const plan = buildPaycheckPlan({
      amount: 10000,
      receivedAt: "2026-05-15",
      previousReceivedAt: "2026-04-30",
      destinations: [{ id: "fixed", name: "Fijos", kind: "envelope" }],
      payments: [
        { label: "BBVA Azul", amount: 2500, dateIso: "2026-05-20T12:00:00.000Z", chip: "Tarjeta" },
        { label: "Amazon MSI", amount: 500, dateIso: "2026-05-25T12:00:00.000Z", chip: "MSI" },
        { label: "Fuera de ventana", amount: 1200, dateIso: "2026-06-20T12:00:00.000Z", chip: "Tarjeta" },
      ],
      budgets: [],
    });

    expect(plan.daysUntilNextIncome).toBe(15);
    expect(plan.cardAmount).toBe(2500);
    expect(plan.installmentAmount).toBe(500);
    expect(plan.obligationAmount).toBe(3000);
    expect(plan.suggestions.fixed).toBe(3000);
    expect(plan.unreservedAmount).toBe(7000);
  });

  it("adds savings only after obligations and caps it by the remaining goal", () => {
    const plan = buildPaycheckPlan({
      amount: 8000,
      receivedAt: "2026-05-15",
      destinations: [
        { id: "sav", name: "Ahorro", kind: "savings" },
        { id: "free", name: "Libre diario", kind: "envelope" },
      ],
      payments: [{ label: "Tarjeta", amount: 2000, dateIso: "2026-05-20T12:00:00.000Z", chip: "Tarjeta" }],
      budgets: [],
      goal: { currentAmount: 9500, targetAmount: 10000 },
    });

    expect(plan.savingsAmount).toBe(500);
    expect(plan.suggestions.sav).toBe(500);
    expect(plan.suggestions.free).toBe(5500);
    expect(plan.unreservedAmount).toBe(2000);
  });

  it("reserves a proportional amount for active budgets", () => {
    const plan = buildPaycheckPlan({
      amount: 6000,
      receivedAt: "2026-05-15",
      previousReceivedAt: "2026-04-30",
      destinations: [
        { id: "food", name: "Comida", kind: "envelope" },
        { id: "free", name: "Libre diario", kind: "envelope" },
      ],
      payments: [],
      budgets: [
        {
          label: "Comida",
          amount: 4000,
          spent: 1000,
          periodStart: "2026-05-01",
          periodEnd: "2026-05-30",
        },
      ],
    });

    expect(plan.budgetReserveAmount).toBe(1500);
    expect(plan.freeAmount).toBe(4500);
    expect(plan.suggestions.food).toBe(1500);
    expect(plan.suggestions.free).toBe(4500);
  });

  it("keeps unmatched money unreserved instead of forcing it into an envelope", () => {
    const plan = buildPaycheckPlan({
      amount: 12345.67,
      receivedAt: "2026-05-15",
      destinations: [{ id: "other", name: "Otros", kind: "envelope" }],
      payments: [],
      budgets: [],
      goal: { currentAmount: 0, targetAmount: 100000 },
    });

    const assigned = Object.values(plan.suggestions).reduce((sum, value) => sum + value, 0);
    expect(assigned).toBe(0);
    expect(plan.unreservedAmount).toBe(12345.67);
  });
});
