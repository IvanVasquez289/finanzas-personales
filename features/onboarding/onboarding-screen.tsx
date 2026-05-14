"use client";

import { ArrowLeft, CheckCircle2, Circle, CreditCard, Landmark, Target, WalletCards } from "lucide-react";
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
    { label: "Cuentas y sobres", detail: "Dónde existe tu dinero disponible.", done: data.envelopes.length > 0 || data.bankAccounts.length > 0, action: onAccounts, icon: WalletCards },
    { label: "Categorías y presupuestos", detail: "Reglas para clasificar y limitar gastos.", done: data.expenseForm.categories.length > 0 && data.settings.budgets.length > 0, action: onAccounts, icon: Landmark },
    { label: "Tarjetas", detail: "Corte, pago, presupuesto y color de cada tarjeta.", done: data.creditCards.length > 0, action: onCards, icon: CreditCard },
    { label: "Meta e ingreso", detail: "Ahorro objetivo y distribución de la quincena.", done: data.goals.ahorro.targetAmount > 0 && data.income.amount > 0, action: data.goals.ahorro.targetAmount > 0 ? onIncome : onPlan, icon: Target },
  ];
  const progress = checks.filter((check) => check.done).length;

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Ajustes</div>
        <div className="font-mono text-[13px] text-[#2A5BFF]">{progress}/{checks.length}</div>
      </div>

      <Card className="p-4">
        <div className="text-[18px] font-semibold">Configuración inicial</div>
        <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">
          Completa lo mínimo para que registrar gastos sea rápido: cuenta destino, categoría, tarjeta y distribución.
        </p>
      </Card>

      <div>
        <SectionHeader title="Estado" />
        <Card className="overflow-hidden">
          {checks.map((check, index) => {
            const StatusIcon = check.done ? CheckCircle2 : Circle;
            const ItemIcon = check.icon;
            return (
              <div key={check.label} className={`flex items-center gap-3 px-4 py-3.5 ${index === checks.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <div className="grid size-9 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-[#10141d]">
                  <ItemIcon size={17} color={check.done ? FT.pos : FT.textDim} />
                </div>
                <button type="button" onClick={check.action} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span>
                    <span className="block text-[14px] font-medium">{check.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-[1.35] text-[#6a7384]">{check.detail}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[12px]" style={{ color: check.done ? FT.pos : FT.textMute }}>
                    <StatusIcon size={15} />
                    {check.done ? "listo" : "abrir"}
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
