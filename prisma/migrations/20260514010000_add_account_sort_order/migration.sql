ALTER TABLE "Account" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered_accounts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "createdAt" ASC, id ASC
    ) - 1 AS position
  FROM "Account"
)
UPDATE "Account"
SET "sortOrder" = ordered_accounts.position
FROM ordered_accounts
WHERE "Account".id = ordered_accounts.id;
