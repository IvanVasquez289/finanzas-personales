-- Separate the physical account used for money movement from the budget envelope consumed by a transaction.
ALTER TABLE "IncomeEvent" ADD COLUMN "depositAccountId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "budgetAccountId" TEXT;

CREATE INDEX "IncomeEvent_depositAccountId_idx" ON "IncomeEvent"("depositAccountId");
CREATE INDEX "Transaction_budgetAccountId_idx" ON "Transaction"("budgetAccountId");

ALTER TABLE "IncomeEvent"
  ADD CONSTRAINT "IncomeEvent_depositAccountId_fkey"
  FOREIGN KEY ("depositAccountId") REFERENCES "Account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_budgetAccountId_fkey"
  FOREIGN KEY ("budgetAccountId") REFERENCES "Account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill budget envelopes for historical movements that were recorded directly against envelope accounts.
UPDATE "Transaction" tx
SET "budgetAccountId" = tx."accountId"
FROM "Account" account
WHERE account.id = tx."accountId"
  AND account.type IN ('envelope', 'savings');

-- Backfill the income deposit account with the first active physical account for each user when available.
UPDATE "IncomeEvent" income
SET "depositAccountId" = (
  SELECT account.id
  FROM "Account" account
  WHERE account."userId" = income."userId"
    AND account."isActive" = true
    AND account.type IN ('debit', 'cash')
  ORDER BY
    CASE account.type
      WHEN 'debit' THEN 0
      WHEN 'cash' THEN 1
      ELSE 3
    END,
    account."createdAt" ASC
  LIMIT 1
)
WHERE income."depositAccountId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "Account" account
    WHERE account."userId" = income."userId"
      AND account."isActive" = true
      AND account.type IN ('debit', 'cash')
  );
