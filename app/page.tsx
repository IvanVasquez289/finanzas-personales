import { FinanceApp } from "@/components/finance-app";
import { requireCurrentFinanceUser } from "@/lib/current-user";
import { getFinanceSnapshot } from "@/lib/finance-snapshot";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireCurrentFinanceUser();
  const snapshot = await getFinanceSnapshot(user.id);

  return <FinanceApp snapshot={snapshot} />;
}
