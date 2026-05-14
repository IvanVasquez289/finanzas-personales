import { describe, it, expect } from "vitest";
import { getCreditCycleDates, cycleIdFor } from "@/lib/credit-cycles";

function makeCreditAccount(cutoffDay: number, paymentDueDay: number, id = "cred1") {
  return { id, cutoffDay, paymentDueDay };
}

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

// ─── getCreditCycleDates ────────────────────────────────────────────────────

describe("getCreditCycleDates", () => {
  it("puts a purchase before cutoff into the current-month cycle", () => {
    // cutoff = 25, purchase = May 10 → cycle ends May 25
    const credit = makeCreditAccount(25, 17);
    const purchaseDate = utcDate(2026, 5, 10);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.endDate).toEqual(utcDate(2026, 5, 25));
  });

  it("puts a purchase on the cutoff day into the current-month cycle", () => {
    const credit = makeCreditAccount(25, 17);
    const purchaseDate = utcDate(2026, 5, 25);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.endDate).toEqual(utcDate(2026, 5, 25));
  });

  it("puts a purchase after cutoff into the next-month cycle", () => {
    // cutoff = 25, purchase = May 26 → cycle ends Jun 25
    const credit = makeCreditAccount(25, 17);
    const purchaseDate = utcDate(2026, 5, 26);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.endDate).toEqual(utcDate(2026, 6, 25));
  });

  it("sets startDate to the day after the previous cutoff", () => {
    // cutoff = 25, purchase = May 10 → end = May 25, start = Apr 26
    const credit = makeCreditAccount(25, 17);
    const purchaseDate = utcDate(2026, 5, 10);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.startDate).toEqual(utcDate(2026, 4, 26));
  });

  it("calculates paymentDueDate in the same month as endDate when dueDay > cutoffDay", () => {
    // cutoff = 10, due = 17, purchase = May 5 → end = May 10, due = May 17
    const credit = makeCreditAccount(10, 17);
    const purchaseDate = utcDate(2026, 5, 5);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.paymentDueDate).toEqual(utcDate(2026, 5, 17));
  });

  it("pushes paymentDueDate to next month when dueDay < cutoffDay", () => {
    // cutoff = 25, due = 5, purchase = May 10 → end = May 25, candidate due = May 5 (before end) → Jun 5
    const credit = makeCreditAccount(25, 5);
    const purchaseDate = utcDate(2026, 5, 10);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.paymentDueDate).toEqual(utcDate(2026, 6, 5));
  });

  it("handles cutoffDay at end of month — clamps to last day in short months", () => {
    // cutoff = 31, purchase = Feb 10 → Feb has 28 days → end = Feb 28
    const credit = makeCreditAccount(31, 15);
    const purchaseDate = utcDate(2026, 2, 10);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.endDate).toEqual(utcDate(2026, 2, 28));
  });

  it("handles cutoff = 28 in February correctly (leap year)", () => {
    const credit = makeCreditAccount(28, 15);
    const purchaseDate = utcDate(2028, 2, 10); // 2028 is a leap year
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.endDate).toEqual(utcDate(2028, 2, 28));
  });

  it("crosses year boundary from December to January", () => {
    // cutoff = 5, purchase = Dec 10 → end = Jan 5 next year
    const credit = makeCreditAccount(5, 20);
    const purchaseDate = utcDate(2026, 12, 10);
    const result = getCreditCycleDates(credit, purchaseDate);

    expect(result.endDate).toEqual(utcDate(2027, 1, 5));
    expect(result.startDate).toEqual(utcDate(2026, 12, 6));
  });

  it("returns idStartKey as YYYY-MM-DD string of startDate", () => {
    const credit = makeCreditAccount(25, 17);
    const purchaseDate = utcDate(2026, 5, 10);
    const result = getCreditCycleDates(credit, purchaseDate);

    // startDate = Apr 26
    expect(result.idStartKey).toBe("2026-04-26");
  });

  it("defaults purchaseDate to now when not provided", () => {
    const credit = makeCreditAccount(25, 17);
    const before = Date.now();
    const result = getCreditCycleDates(credit);
    const after = Date.now();

    // The cycle should contain today
    expect(result.startDate.getTime()).toBeLessThanOrEqual(before);
    expect(result.endDate.getTime()).toBeGreaterThanOrEqual(after);
  });
});

// ─── cycleIdFor ─────────────────────────────────────────────────────────────

describe("cycleIdFor", () => {
  it("combines creditAccountId and idStartKey with colon separator", () => {
    const id = cycleIdFor("cred-abc", { idStartKey: "2026-04-26" });
    expect(id).toBe("cred-abc:2026-04-26");
  });

  it("produces different IDs for different start keys", () => {
    const id1 = cycleIdFor("cred1", { idStartKey: "2026-04-26" });
    const id2 = cycleIdFor("cred1", { idStartKey: "2026-05-26" });
    expect(id1).not.toBe(id2);
  });

  it("produces different IDs for different credit accounts with same start key", () => {
    const id1 = cycleIdFor("cred1", { idStartKey: "2026-04-26" });
    const id2 = cycleIdFor("cred2", { idStartKey: "2026-04-26" });
    expect(id1).not.toBe(id2);
  });

  it("is consistent with getCreditCycleDates output", () => {
    const credit = makeCreditAccount(25, 17);
    const dates = getCreditCycleDates(credit, utcDate(2026, 5, 10));
    const id = cycleIdFor(credit.id, dates);

    expect(id).toBe(`${credit.id}:${dates.idStartKey}`);
  });
});
