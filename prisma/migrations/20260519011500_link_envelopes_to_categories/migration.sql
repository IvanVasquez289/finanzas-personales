ALTER TABLE "Account" ADD COLUMN "linkedCategoryId" TEXT;

CREATE INDEX "Account_linkedCategoryId_idx" ON "Account"("linkedCategoryId");

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_linkedCategoryId_fkey"
  FOREIGN KEY ("linkedCategoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
