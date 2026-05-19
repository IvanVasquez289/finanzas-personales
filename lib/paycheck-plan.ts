export type PaycheckDestination = {
  id: string;
  name: string;
  kind: "savings" | "envelope" | "bank" | "cash";
};

export type PaycheckPayment = {
  label: string;
  amount: number;
  dateIso: string;
  chip: string;
  muted?: boolean;
};

export type PaycheckBudget = {
  label: string;
  amount: number;
  spent: number;
  periodStart: string;
  periodEnd: string;
};

export type PaycheckPlanInput = {
  amount: number;
  receivedAt: string;
  previousReceivedAt?: string;
  destinations: PaycheckDestination[];
  payments: PaycheckPayment[];
  budgets: PaycheckBudget[];
  goal?: {
    currentAmount: number;
    targetAmount: number;
  };
};

export type PaycheckPlan = {
  daysUntilNextIncome: number;
  obligationAmount: number;
  cardAmount: number;
  installmentAmount: number;
  budgetReserveAmount: number;
  savingsAmount: number;
  freeAmount: number;
  dailyFreeAmount: number;
  unreservedAmount: number;
  suggestions: Record<string, number>;
  priorityItems: {
    label: string;
    amount: number;
    detail: string;
    tone: "danger" | "warn" | "pos" | "neutral";
  }[];
};

const DEFAULT_PAY_PERIOD_DAYS = 15;

export function buildPaycheckPlan(input: PaycheckPlanInput): PaycheckPlan {
  const amount = Math.max(0, roundCurrency(input.amount));
  const daysUntilNextIncome = inferPayPeriodDays(input.receivedAt, input.previousReceivedAt);
  const windowEnd = addDays(input.receivedAt, daysUntilNextIncome);
  const upcomingPayments = input.payments.filter((payment) => {
    if (payment.muted || payment.amount <= 0 || !payment.dateIso) return false;
    const paymentDate = payment.dateIso.slice(0, 10);
    return paymentDate >= input.receivedAt && paymentDate <= windowEnd;
  });
  const cardAmount = sum(
    upcomingPayments.filter((payment) => payment.chip === "Tarjeta").map((payment) => payment.amount),
  );
  const installmentAmount = sum(
    upcomingPayments.filter((payment) => payment.chip !== "Tarjeta").map((payment) => payment.amount),
  );
  const obligationAmount = Math.min(amount, roundCurrency(cardAmount + installmentAmount));
  const afterObligations = Math.max(0, amount - obligationAmount);
  const goalRemaining = Math.max(0, (input.goal?.targetAmount ?? 0) - (input.goal?.currentAmount ?? 0));
  const savingsAmount = hasSavingsDestination(input.destinations) && goalRemaining > 0
    ? Math.min(goalRemaining, roundToStep(afterObligations * 0.15, 50), afterObligations)
    : 0;
  const afterSavings = Math.max(0, afterObligations - savingsAmount);
  const budgetReserveAmount = Math.min(afterSavings, estimateBudgetReserve(input.budgets, daysUntilNextIncome));
  const freeAmount = Math.max(0, roundCurrency(afterSavings - budgetReserveAmount));
  const suggestions = buildDestinationSuggestions({
    destinations: input.destinations,
    obligationAmount,
    savingsAmount,
    budgetReserveAmount,
    freeAmount,
    incomeAmount: amount,
  });
  const suggestedEnvelopeAmount = sum(Object.values(suggestions));

  return {
    daysUntilNextIncome,
    obligationAmount,
    cardAmount: roundCurrency(cardAmount),
    installmentAmount: roundCurrency(installmentAmount),
    budgetReserveAmount,
    savingsAmount,
    freeAmount,
    dailyFreeAmount: daysUntilNextIncome > 0 ? roundCurrency(freeAmount / daysUntilNextIncome) : freeAmount,
    unreservedAmount: Math.max(0, roundCurrency(amount - suggestedEnvelopeAmount)),
    suggestions,
    priorityItems: [
      {
        label: "Tarjetas",
        amount: roundCurrency(cardAmount),
        detail: cardAmount > 0 ? "Reserva para pagos antes de la siguiente quincena" : "Sin pagos urgentes en la ventana",
        tone: cardAmount > 0 ? "danger" : "neutral",
      },
      {
        label: "MSI y compromisos",
        amount: roundCurrency(installmentAmount),
        detail: installmentAmount > 0 ? "Mensualidades y cargos recurrentes detectados" : "Sin mensualidades próximas",
        tone: installmentAmount > 0 ? "warn" : "neutral",
      },
      {
        label: "Ahorro",
        amount: savingsAmount,
        detail: savingsAmount > 0 ? "15% después de compromisos, limitado por la meta" : "Sin meta o sin margen después de compromisos",
        tone: savingsAmount > 0 ? "pos" : "neutral",
      },
      {
        label: "Gasto variable",
        amount: budgetReserveAmount,
        detail: "Reserva proporcional para presupuestos activos",
        tone: budgetReserveAmount > 0 ? "warn" : "neutral",
      },
      {
        label: "Libre diario",
        amount: freeAmount,
        detail: `${formatMoney(freeAmount / Math.max(1, daysUntilNextIncome))} por día durante ${daysUntilNextIncome} días`,
        tone: "pos",
      },
    ],
  };
}

function buildDestinationSuggestions({
  destinations,
  obligationAmount,
  savingsAmount,
  budgetReserveAmount,
  freeAmount,
  incomeAmount,
}: {
  destinations: PaycheckDestination[];
  obligationAmount: number;
  savingsAmount: number;
  budgetReserveAmount: number;
  freeAmount: number;
  incomeAmount: number;
}) {
  const suggestions: Record<string, number> = Object.fromEntries(destinations.map((destination) => [destination.id, 0]));
  const savings = destinations.find((destination) => destination.kind === "savings");
  const fixedEnvelope = findDestination(destinations, ["fijo", "servicio", "renta", "casa", "deuda"]);
  const variableEnvelope = findDestination(destinations, ["variable", "comida", "super", "transporte", "gasto"]);
  const freeEnvelope = findDestination(destinations, ["libre", "diario", "personal"]);

  add(suggestions, savings?.id, savingsAmount);
  add(suggestions, fixedEnvelope?.id, obligationAmount);
  add(suggestions, variableEnvelope?.id ?? freeEnvelope?.id, budgetReserveAmount);
  add(suggestions, freeEnvelope?.id, freeAmount);

  const capped: Record<string, number> = {};
  let remaining = incomeAmount;
  for (const [id, value] of Object.entries(suggestions)) {
    const next = Math.min(Math.max(0, roundCurrency(value)), Math.max(0, remaining));
    capped[id] = next;
    remaining = roundCurrency(remaining - next);
  }

  return capped;
}

function inferPayPeriodDays(receivedAt: string, previousReceivedAt?: string) {
  if (!receivedAt || !previousReceivedAt) return DEFAULT_PAY_PERIOD_DAYS;
  const current = new Date(`${receivedAt.slice(0, 10)}T12:00:00`);
  const previous = new Date(`${previousReceivedAt.slice(0, 10)}T12:00:00`);
  const days = Math.round((current.getTime() - previous.getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days < 7 || days > 31) return DEFAULT_PAY_PERIOD_DAYS;
  return days;
}

function estimateBudgetReserve(budgets: PaycheckBudget[], daysUntilNextIncome: number) {
  return roundToStep(
    sum(
      budgets.map((budget) => {
        const remaining = Math.max(0, budget.amount - budget.spent);
        const periodDays = daysBetween(budget.periodStart, budget.periodEnd) + 1;
        const ratio = periodDays > 0 ? Math.min(1, daysUntilNextIncome / periodDays) : 0.5;
        return remaining * ratio;
      }),
    ),
    50,
  );
}

function hasSavingsDestination(destinations: PaycheckDestination[]) {
  return destinations.some((destination) => destination.kind === "savings");
}

function findDestination(destinations: PaycheckDestination[], keywords: string[]) {
  return destinations.find((destination) => {
    const name = destination.name.toLowerCase();
    return keywords.some((keyword) => name.includes(keyword));
  });
}

function add(target: Record<string, number>, id: string | undefined, amount: number) {
  if (!id || !Number.isFinite(amount)) return;
  target[id] = roundCurrency((target[id] ?? 0) + amount);
}

function sum(values: number[]) {
  return roundCurrency(values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0));
}

function roundCurrency(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function roundToStep(value: number, step: number) {
  return Math.floor(Math.max(0, value) / step) * step;
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const startDate = new Date(`${start.slice(0, 10)}T12:00:00`);
  const endDate = new Date(`${end.slice(0, 10)}T12:00:00`);
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function formatMoney(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}
