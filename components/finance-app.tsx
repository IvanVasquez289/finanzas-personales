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
import { TransactionsScreen } from "@/features/transactions/transactions-screen";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";

export function FinanceApp({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [screen, setScreen] = useState<AppScreen>("home");
  const activeTab =
    screen === "settings-accounts"
      ? "env"
      : screen === "settings-cards"
        ? "cards"
        : screen === "settings-plan"
          ? "goal"
          : screen === "transactions"
            ? "home"
          : screen;

  return (
    <AppShell active={activeTab} onNavigate={setScreen}>
      {screen === "home" ? (
        <DashboardScreen
          data={snapshot}
          onViewCards={() => setScreen("cards")}
          onViewTransactions={() => setScreen("transactions")}
        />
      ) : null}
      {screen === "cards" ? (
        <CardDetailScreen data={snapshot} onBack={() => setScreen("home")} onManage={() => setScreen("settings-cards")} />
      ) : null}
      {screen === "env" ? <EnvelopesScreen data={snapshot} onManage={() => setScreen("settings-accounts")} /> : null}
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
          onManageGoal={() => setScreen("settings-plan")}
        />
      ) : null}
      {screen === "settings-accounts" ? <SettingsScreen data={snapshot} section="accounts" onBack={() => setScreen("env")} /> : null}
      {screen === "settings-cards" ? <SettingsScreen data={snapshot} section="cards" onBack={() => setScreen("cards")} /> : null}
      {screen === "settings-plan" ? <SettingsScreen data={snapshot} section="plan" onBack={() => setScreen("goal")} /> : null}
      {screen === "transactions" ? <TransactionsScreen data={snapshot} onBack={() => setScreen("home")} /> : null}
    </AppShell>
  );
}
