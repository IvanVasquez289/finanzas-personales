CREATE TABLE "DistributionTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pagoTarjetasCents" INTEGER NOT NULL DEFAULT 0,
    "ahorroCents" INTEGER NOT NULL DEFAULT 0,
    "fijosCents" INTEGER NOT NULL DEFAULT 0,
    "libreCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DistributionTemplate_userId_name_key" ON "DistributionTemplate"("userId", "name");
CREATE INDEX "DistributionTemplate_userId_idx" ON "DistributionTemplate"("userId");

ALTER TABLE "DistributionTemplate" ADD CONSTRAINT "DistributionTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DistributionTemplate" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "DistributionTemplate" FROM anon, authenticated, service_role;
