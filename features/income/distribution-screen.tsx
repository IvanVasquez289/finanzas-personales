"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, BadgeDollarSign, CalendarDays, PiggyBank, ShieldCheck, WalletCards } from "lucide-react";
import { AllocationSlider } from "@/components/income/allocation-slider";
import { BigNum } from "@/components/finance/big-num";
import { SegmentBar } from "@/components/finance/segment-bar";
import { Tag } from "@/components/finance/tag";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";
import { buildPaycheckPlan } from "@/lib/paycheck-plan";
import { confirmDistributionAction } from "./actions";

export function DistributionScreen({
  data,
  onBack,
  onSaved,
  onManageGoal,
}: {
  data: FinanceSnapshot;
  onBack: () => void;
  onSaved: () => void;
  onManageGoal: () => void;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm({
    defaultValues: {
      amount: data.income.amount || 0,
      receivedAt: data.income.receivedAt ? data.income.receivedAt.slice(0, 10) : today,
      depositAccountId: data.income.depositAccountId ?? data.bankAccounts[0]?.id ?? "",
    },
  });
  const ingreso = form.watch("amount") || 0;
  const receivedAt = form.watch("receivedAt") || today;
  const depositAccountId = form.watch("depositAccountId") || "";
  const distributableAccounts = useMemo(
    () => [
      ...data.envelopes.map((account) => ({
        id: account.id,
        name: account.name,
        balance: account.balance,
        color: account.color,
        note: account.note,
        kind: account.goal ? "savings" as const : "envelope" as const,
      })),
    ],
    [data.envelopes],
  );
  const [vals, setVals] = useState<Record<string, number>>(() => {
    const current = new Map(data.allocation.items.map((item) => [item.accountId, item.amount]));
    return Object.fromEntries(distributableAccounts.map((account) => [account.id, current.get(account.id) ?? 0]));
  });
  const [state, formAction, pending] = useActionState(confirmDistributionAction, {
    ok: false,
    message: "",
  });
  const total = distributableAccounts.reduce((sum, account) => sum + (vals[account.id] ?? 0), 0);
  const diff = ingreso - total;
  const plan = useMemo(
    () =>
      buildPaycheckPlan({
        amount: ingreso,
        receivedAt,
        previousReceivedAt: data.previousIncome?.receivedAt,
        destinations: distributableAccounts,
        payments: data.payments,
        budgets: data.settings.budgets,
        goal: data.goals.ahorro,
      }),
    [data.goals.ahorro, data.payments, data.previousIncome?.receivedAt, data.settings.budgets, distributableAccounts, ingreso, receivedAt],
  );
  const applySuggestion = () => {
    if (distributableAccounts.length === 0) return;
    setVals(plan.suggestions);
  };

  useEffect(() => {
    if (!state.ok) return;

    router.refresh();
    onSaved();
  }, [onSaved, router, state.ok]);

  return (
    <form action={formAction} className="flex flex-1 flex-col overflow-hidden app-top">
      {distributableAccounts.map((account) => (
        <input key={account.id} type="hidden" name="allocation" value={`${account.id}:${vals[account.id] ?? 0}`} />
      ))}
      <input type="hidden" name="depositAccountId" value={depositAccountId} readOnly />
      <div className="flex items-center justify-between px-4 pb-4">
        <Button type="button" variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}><ArrowLeft size={16} /></Button>
        <div className="text-[14px] text-[#a4adbe]">Plan de quincena</div>
        <button type="button" className="text-[13px] font-medium text-[#2A5BFF]" onClick={onManageGoal}>Meta</button>
      </div>
      <div className="px-5 pb-2">
        <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Quincena recibida</div>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <BigNum value={ingreso} size={36} />
          <Tag color={FT.pos} bg={FT.posSoft}>+ ingreso</Tag>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 min-[390px]:grid-cols-[1fr_150px]">
          <label className="text-[12px] text-[#6a7384]">
            Monto recibido
            <input
              type="number"
              min={0}
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
              className="mt-1.5 h-11 w-full rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 font-mono text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
            />
          </label>
          <label className="text-[12px] text-[#6a7384]">
            Fecha
            <input
              type="date"
              {...form.register("receivedAt")}
              className="mt-1.5 h-11 w-full rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
            />
          </label>
        </div>
        <label className="mt-3 block text-[12px] text-[#6a7384]">
          Cuenta donde cayó el dinero
          <select
            {...form.register("depositAccountId")}
            className="mt-1.5 h-11 w-full rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
          >
            <option value="">Selecciona cuenta real...</option>
            {data.bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        {data.previousIncome ? (
          <div className="mt-1.5 text-[11px] text-[#6a7384]">
            Quincena anterior:{" "}
            <span className="font-mono text-[#a4adbe]">{money(data.previousIncome.amount)}</span>
            {" · "}
            {new Date(data.previousIncome.receivedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", timeZone: "America/Mexico_City" }).replace(".", "")}
          </div>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <PlanStat icon={ShieldCheck} label="Obligatorio" value={plan.obligationAmount} tone={plan.obligationAmount > 0 ? FT.warn : FT.textDim} />
          <PlanStat icon={PiggyBank} label="Ahorro" value={plan.savingsAmount} tone={plan.savingsAmount > 0 ? FT.pos : FT.textDim} />
          <PlanStat icon={BadgeDollarSign} label="Libre" value={plan.freeAmount} tone={FT.accent} />
          <PlanStat icon={CalendarDays} label="Diario" value={plan.dailyFreeAmount} tone={FT.text} suffix={`${plan.daysUntilNextIncome} d`} />
        </div>
        <div className="mt-3 text-[13px] text-[#a4adbe]">La cuenta real dice dónde está el dinero; los sobres dicen para qué queda reservado.</div>
        <button
          type="button"
          className="mt-3 h-9 rounded-xl border border-[#2A5BFF55] bg-[#2A5BFF1f] px-3 text-[13px] font-semibold text-[#2A5BFF]"
          onClick={applySuggestion}
        >
          Aplicar plan sugerido
        </button>
      </div>
      <div className="px-4 py-2">
        <Card className="overflow-hidden">
          {plan.priorityItems.map((item, index) => (
            <div key={item.label} className={`flex items-center justify-between gap-3 px-3.5 py-3 ${index === plan.priorityItems.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{item.label}</div>
                <div className="mt-0.5 truncate text-[11px] text-[#6a7384]">{item.detail}</div>
              </div>
              <div
                className="shrink-0 font-mono text-[13px] font-semibold"
                style={{ color: item.tone === "danger" ? FT.danger : item.tone === "warn" ? FT.warn : item.tone === "pos" ? FT.pos : FT.textDim }}
              >
                {money(item.amount)}
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="px-4 py-3">
        <Card className="p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] text-[#a4adbe]">
              Asignado · <span className="font-mono text-[#eef2f8]">{money(total)}</span>
            </div>
            <div className="text-[12px] font-semibold" style={{ color: diff === 0 ? FT.pos : diff > 0 ? FT.warn : FT.danger }}>
              {diff === 0 ? "✓ Cuadrado" : diff > 0 ? `Faltan ${money(diff)}` : `Te pasaste ${money(Math.abs(diff))}`}
            </div>
          </div>
          <SegmentBar
            segments={[
              ...distributableAccounts.map((account) => ({ value: vals[account.id] ?? 0, color: account.color })),
              ...(diff > 0 ? [{ value: diff, color: "rgba(255,255,255,0.06)" }] : []),
            ]}
          />
        </Card>
        {state.message ? (
          <div className="mt-3 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3 text-[13px]" style={{ color: state.ok ? FT.pos : FT.danger }}>
            {state.message}
          </div>
        ) : null}
      </div>
      <div className="no-scrollbar flex-1 overflow-auto px-4 app-bottom-scroll">
        <div className="flex flex-col gap-2.5">
          {distributableAccounts.map((account) => (
            <AllocationSlider
              key={account.id}
              name={account.name}
              note={account.note}
              color={account.color}
              icon={WalletCards}
              sugerido={plan.suggestions[account.id] ?? 0}
              value={vals[account.id] ?? 0}
              ingreso={ingreso}
              onChange={(value) => setVals((current) => ({ ...current, [account.id]: value }))}
            />
          ))}
          {distributableAccounts.length === 0 ? (
            <Card className="p-4 text-center text-[13px] text-[#a4adbe]">
              Crea primero tus sobres desde configuración inicial.
            </Card>
          ) : null}
          {data.bankAccounts.length === 0 ? (
            <Card className="p-4 text-center text-[13px] text-[#a4adbe]">
              Crea una cuenta real de débito o efectivo para registrar dónde cayó la quincena.
            </Card>
          ) : null}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06080c] from-60% to-transparent px-4 app-bottom-fixed pt-3">
        <Button className="w-full" disabled={diff !== 0 || pending || distributableAccounts.length === 0 || !depositAccountId}>
          {pending ? "Confirmando" : "Confirmar distribución"}
        </Button>
      </div>
    </form>
  );
}

function PlanStat({
  icon: Icon,
  label,
  value,
  tone,
  suffix,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: string;
  suffix?: string;
}) {
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <Icon size={14} color={tone} />
        {suffix ? <span className="text-[10px] text-[#6a7384]">{suffix}</span> : null}
      </div>
      <div className="text-[10px] uppercase tracking-[0.06em] text-[#6a7384]">{label}</div>
      <div className="mt-1 font-mono text-[15px] font-semibold" style={{ color: tone }}>
        {money(value)}
      </div>
    </Card>
  );
}
