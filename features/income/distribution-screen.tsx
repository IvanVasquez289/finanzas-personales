"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, WalletCards } from "lucide-react";
import { AllocationSlider } from "@/components/income/allocation-slider";
import { BigNum } from "@/components/finance/big-num";
import { SegmentBar } from "@/components/finance/segment-bar";
import { Tag } from "@/components/finance/tag";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";
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
    },
  });
  const ingreso = form.watch("amount") || 0;
  const distributableAccounts = [
    ...data.envelopes.map((account) => ({
      id: account.id,
      name: account.name,
      balance: account.balance,
      color: account.color,
      note: account.note,
    })),
    ...data.bankAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      balance: account.balance,
      color: FT.textDim,
      note: account.sub,
    })),
  ];
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
  const applySuggestion = () => {
    if (distributableAccounts.length === 0) return;
    const base = Math.floor((ingreso / distributableAccounts.length) / 50) * 50;
    let remaining = ingreso;
    const next: Record<string, number> = {};

    distributableAccounts.forEach((account, index) => {
      const value = index === distributableAccounts.length - 1 ? remaining : Math.min(base, remaining);
      next[account.id] = value;
      remaining -= value;
    });

    setVals(next);
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
      <div className="flex items-center justify-between px-4 pb-4">
        <Button type="button" variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}><ArrowLeft size={16} /></Button>
        <div className="text-[14px] text-[#a4adbe]">Paso 2 de 3</div>
        <button type="button" className="text-[13px] font-medium text-[#2A5BFF]" onClick={onManageGoal}>Meta</button>
      </div>
      <div className="px-5 pb-2">
        <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Quincena recibida</div>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <BigNum value={ingreso} size={36} />
          <Tag color={FT.pos} bg={FT.posSoft}>+ ingreso</Tag>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_150px] gap-3">
          <label className="text-[12px] text-[#6a7384]">
            Monto recibido
            <input
              type="number"
              min={0}
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#10141d] px-3 font-mono text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
            />
          </label>
          <label className="text-[12px] text-[#6a7384]">
            Fecha
            <input
              type="date"
              {...form.register("receivedAt")}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#10141d] px-3 text-[13px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
            />
          </label>
        </div>
        {data.previousIncome ? (
          <div className="mt-1.5 text-[11px] text-[#6a7384]">
            Quincena anterior:{" "}
            <span className="font-mono text-[#a4adbe]">{money(data.previousIncome.amount)}</span>
            {" · "}
            {new Date(data.previousIncome.receivedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", timeZone: "America/Mexico_City" }).replace(".", "")}
          </div>
        ) : null}
        <div className="mt-1.5 text-[13px] text-[#a4adbe]">¿Cómo lo repartimos hoy?</div>
        <button
          type="button"
          className="mt-3 h-9 rounded-xl border border-[#2A5BFF55] bg-[#2A5BFF1f] px-3 text-[13px] font-semibold text-[#2A5BFF]"
          onClick={applySuggestion}
        >
          Usar sugerencia
        </button>
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
              sugerido={distributableAccounts.length > 0 ? ingreso / distributableAccounts.length : 0}
              value={vals[account.id] ?? 0}
              ingreso={ingreso}
              onChange={(value) => setVals((current) => ({ ...current, [account.id]: value }))}
            />
          ))}
          {distributableAccounts.length === 0 ? (
            <Card className="p-4 text-center text-[13px] text-[#a4adbe]">
              Crea primero tus cuentas o sobres desde configuración inicial.
            </Card>
          ) : null}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06080c] from-60% to-transparent px-4 app-bottom-fixed pt-3">
        <Button className="w-full" disabled={diff !== 0 || pending || distributableAccounts.length === 0}>
          {pending ? "Confirmando" : "Confirmar distribución"}
        </Button>
      </div>
    </form>
  );
}
