import type { CreditAccount } from "@prisma/client";

export type CreditCycleDates = {
  idStartKey: string;
  startDate: Date;
  endDate: Date;
  paymentDueDate: Date;
};

export function getCreditCycleDates(
  credit: Pick<CreditAccount, "id" | "cutoffDay" | "paymentDueDay">,
  purchaseDate = new Date(),
): CreditCycleDates {
  const date = startOfDayUtc(purchaseDate);
  const currentMonthCutoff = dayInMonthUtc(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    credit.cutoffDay,
  );
  const endDate = date > currentMonthCutoff
    ? dayInMonthUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, credit.cutoffDay)
    : currentMonthCutoff;
  const previousCutoff = dayInMonthUtc(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth() - 1,
    credit.cutoffDay,
  );
  const startDate = addDaysUtc(previousCutoff, 1);
  const dueCandidate = dayInMonthUtc(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    credit.paymentDueDay,
  );
  const paymentDueDate = dueCandidate > endDate
    ? dueCandidate
    : dayInMonthUtc(endDate.getUTCFullYear(), endDate.getUTCMonth() + 1, credit.paymentDueDay);

  return {
    idStartKey: toDateKey(startDate),
    startDate,
    endDate,
    paymentDueDate,
  };
}

export function cycleIdFor(creditAccountId: string, dates: Pick<CreditCycleDates, "idStartKey">) {
  return `${creditAccountId}:${dates.idStartKey}`;
}

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUtc(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function dayInMonthUtc(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
