"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Circle, CreditCard, Gauge, PiggyBank, ReceiptText, Tags, Target, WalletCards } from "lucide-react";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";

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
  const hasCategoryBudget = data.settings.budgets.some((budget) => budget.categoryId);
  const linkedEnvelopes = data.envelopes.filter((envelope) => envelope.linkedCategoryId);
  const checks = [
    { label: "Cuenta real", detail: "Crea al menos una cuenta de débito o efectivo.", done: data.bankAccounts.length > 0, action: onAccounts, icon: WalletCards },
    { label: "Categorías", detail: "Clasifican gastos para reportes y presupuestos.", done: data.expenseForm.categories.length > 0, action: onAccounts, icon: Tags },
    { label: "Presupuesto por categoría", detail: "Define límites sin importar si pagas con tarjeta, débito o efectivo.", done: hasCategoryBudget, action: onAccounts, icon: Gauge },
    { label: "Sobres opcionales", detail: "Reserva dinero concreto cuando quieras apartarlo.", done: data.envelopes.length > 0, action: onAccounts, icon: PiggyBank },
    { label: "Tarjetas", detail: "Corte, pago y deuda viven separados de sobres.", done: data.creditCards.length > 0, action: onCards, icon: CreditCard },
    { label: "Meta y quincena", detail: "Recibe ingreso, aparta dinero y avanza ahorro.", done: data.goals.ahorro.targetAmount > 0 && data.income.amount > 0, action: data.goals.ahorro.targetAmount > 0 ? onIncome : onPlan, icon: Target },
  ];
  const progress = checks.filter((check) => check.done).length;
  const exampleSteps = [
    { label: "Pago con", value: data.creditCards[0]?.issuer ?? data.bankAccounts[0]?.name ?? "Tarjeta/cuenta", icon: CreditCard },
    { label: "Categoría", value: data.expenseForm.categories[0]?.label ?? "Comida", icon: Tags },
    { label: "Presupuesto", value: hasCategoryBudget ? "Cuenta contra el límite" : "Opcional por categoría", icon: Gauge },
    { label: "Sobre", value: linkedEnvelopes[0]?.name ?? "Opcional", icon: PiggyBank },
  ];

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Guía</div>
        <div className="font-mono text-[13px] text-[#2A5BFF]">{progress}/{checks.length}</div>
      </div>

      <Card className="p-4">
        <div className="text-[18px] font-semibold">Cómo se organiza tu dinero</div>
        <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">
          Un gasto puede tener cuenta o tarjeta, categoría y opcionalmente un sobre. Cada pieza responde una pregunta distinta.
        </p>
      </Card>

      <div>
        <SectionHeader title="Modelo mental" />
        <Card className="overflow-hidden">
          <ConceptRow icon={WalletCards} title="Cuenta real" question="¿Dónde está el dinero?" detail="BBVA, efectivo, débito. Recibe ingresos y paga gastos." />
          <ConceptRow icon={CreditCard} title="Tarjeta" question="¿Con qué pagué?" detail="Aumenta deuda y calcula corte/pago." />
          <ConceptRow icon={Tags} title="Categoría" question="¿En qué gasté?" detail="Comida, transporte, salud. Alimenta reportes." />
          <ConceptRow icon={Gauge} title="Presupuesto" question="¿Cuál es mi límite?" detail="Regla por categoría; no guarda dinero." />
          <ConceptRow icon={PiggyBank} title="Sobre" question="¿Qué dinero aparté?" detail="Reserva opcional para quincena, ahorro o gastos fijos." last />
        </Card>
      </div>

      <div>
        <SectionHeader title="Ejemplo de gasto" />
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold">Uber Eats</div>
              <div className="mt-0.5 text-[11px] text-[#6a7384]">Un solo movimiento actualiza varias lecturas</div>
            </div>
            <div className="font-mono text-[15px] font-semibold">{money(250)}</div>
          </div>
          <div className="mt-4 grid gap-2">
            {exampleSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-[#10141d] text-[#a4adbe]">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[#6a7384]">{step.label}</div>
                    <div className="truncate text-[13px] font-medium">{step.value}</div>
                  </div>
                  {index < exampleSteps.length - 1 ? <ArrowRight size={14} className="text-[#444c5b]" /> : null}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div>
        <SectionHeader title="Ahorro" />
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-[#10141d] text-[#3DD68C]">
              <Target size={17} />
            </div>
            <div>
              <div className="text-[14px] font-semibold">Meta + sobre de ahorro</div>
              <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">
                La meta dice cuánto quieres juntar. El sobre de ahorro dice cuánto dinero ya apartaste para esa meta.
              </p>
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={onPlan} variant="secondary">Configurar meta</Button>
                <Button type="button" onClick={onIncome}>Registrar quincena</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <SectionHeader title="Configuración" />
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

function ConceptRow({
  icon: Icon,
  title,
  question,
  detail,
  last = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  question: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className={`flex gap-3 px-4 py-3.5 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="grid size-9 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-[#10141d] text-[#a4adbe]">
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[14px] font-semibold">{title}</div>
          <div className="shrink-0 text-[10px] text-[#6a7384]">{question}</div>
        </div>
        <div className="mt-0.5 text-[11px] leading-[1.4] text-[#6a7384]">{detail}</div>
      </div>
    </div>
  );
}
