import { FinanceApp } from "@/components/finance-app";
import { getFinanceSnapshot } from "@/lib/finance-snapshot";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getFinanceSnapshot();

  return <FinanceApp snapshot={snapshot} />;
}
