"use client";

import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";

export function OnboardingScreen({
  data,
  onBack,
  onAccounts,
  onCards,
  onPlan,
  onIncome,
}: {
  data: FinanceSnapshot;
  onBack: () => void;
  onAccounts: () => void;
  onCards: () => void;
  onPlan: () => void;
  onIncome: () => void;
}) {
  const checks = [
    { label: "Sobres y cuentas", done: data.envelopes.length > 0 || data.bankAccounts.length > 0, action: onAccounts },
    { label: "Categorías", done: data.expenseForm.categories.length > 0, action: onAccounts },
    { label: "Tarjetas", done: data.creditCards.length > 0, action: onCards },
    { label: "Meta", done: data.goals.ahorro.targetAmount > 0, action: onPlan },
    { label: "Presupuestos", done: data.settings.budgets.length > 0, action: onAccounts },
    { label: "Ingreso inicial", done: data.income.amount > 0, action: onIncome },
  ];
  const progress = checks.filter((check) => check.done).length;

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Onboarding</div>
        <div className="font-mono text-[13px] text-[#2A5BFF]">{progress}/{checks.length}</div>
      </div>

      <Card className="p-4">
        <div className="text-[18px] font-semibold">Configuración inicial</div>
        <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">
          Empieza vacío y configura tus propias cuentas, categorías, tarjetas, metas y presupuestos.
        </p>
      </Card>

      <div>
        <SectionHeader title="Estado" />
        <Card className="overflow-hidden">
          {checks.map((check, index) => {
            const Icon = check.done ? CheckCircle2 : Circle;
            return (
              <div key={check.label} className={`flex items-center gap-3 px-4 py-3.5 ${index === checks.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <Icon size={18} color={check.done ? FT.pos : FT.textFade} />
                <button type="button" onClick={check.action} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-[14px] font-medium">{check.label}</span>
                  <span className="text-[12px]" style={{ color: check.done ? FT.pos : FT.textMute }}>
                    {check.done ? "listo" : "configurar"}
                  </span>
                </button>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
