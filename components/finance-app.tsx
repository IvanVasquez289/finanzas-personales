"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EnvelopesScreen } from "@/features/accounts/envelopes-screen";
import { CardDetailScreen } from "@/features/credit-cards/card-detail-screen";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { DistributionScreen } from "@/features/income/distribution-screen";
import type { AppScreen } from "@/features/navigation/types";
import { SettingsScreen } from "@/features/settings/settings-screen";
import { ExpenseFormScreen } from "@/features/transactions/expense-form-screen";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";

export function FinanceApp({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [screen, setScreen] = useState<AppScreen>("home");

  return (
    <AppShell active={screen} onNavigate={setScreen}>
      {screen === "home" ? <DashboardScreen data={snapshot} /> : null}
      {screen === "cards" ? <CardDetailScreen data={snapshot} /> : null}
      {screen === "env" ? <EnvelopesScreen data={snapshot} /> : null}
      {screen === "add" ? (
        <ExpenseFormScreen
          data={snapshot}
          onCancel={() => setScreen("home")}
          onSaved={() => setScreen("home")}
        />
      ) : null}
      {screen === "goal" ? (
        <DistributionScreen
          data={snapshot}
          onBack={() => setScreen("home")}
          onSaved={() => setScreen("home")}
        />
      ) : null}
      {screen === "settings" ? <SettingsScreen data={snapshot} /> : null}
    </AppShell>
  );
}
