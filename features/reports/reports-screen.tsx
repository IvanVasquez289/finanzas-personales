"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Bars } from "@/components/finance/bars";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot, FinanceTransaction } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";

type ReportMode = "monthly" | "cycles";

export function ReportsScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const [mode, setMode] = useState<ReportMode>("monthly");
  const monthly = useMemo(() => buildMonthlyReport(data.movementDetail), [data.movementDetail]);

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Reportes</div>
        <div className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#161b25] text-[#a4adbe]">
          <BarChart3 size={17} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={mode === "monthly"} label="Mensual" onClick={() => setMode("monthly")} />
        <ModeButton active={mode === "cycles"} label="Ciclos" onClick={() => setMode("cycles")} />
      </div>

      {mode === "monthly" ? (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Ingresos" value={monthly.income} color={FT.pos} />
              <Stat label="Gastos" value={monthly.expense} color={FT.warn} />
              <Stat label="Neto" value={monthly.income - monthly.expense} color={monthly.income >= monthly.expense ? FT.pos : FT.danger} />
            </div>
          </Card>
          <div>
            <SectionHeader title="Gasto por categoría" />
            <Card className="p-4">
              {monthly.categories.length > 0 ? (
                <Bars data={monthly.categories} />
              ) : (
                <div className="py-6 text-center text-[13px] text-[#6a7384]">Sin gastos confirmados este mes.</div>
              )}
            </Card>
          </div>
          <div>
            <SectionHeader title="Meses recientes" />
            <Card className="overflow-hidden">
              {monthly.months.map((month, index) => (
                <div key={month.label} className={`flex items-center justify-between px-4 py-3 ${index === monthly.months.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                  <div>
                    <div className="text-[14px] font-medium">{month.label}</div>
                    <div className="mt-0.5 text-[11px] text-[#6a7384]">{month.count} movimientos</div>
                  </div>
                  <div className="font-mono text-[14px] font-semibold">{money(month.expense)}</div>
                </div>
              ))}
            </Card>
          </div>
        </>
      ) : (
        <div>
          <SectionHeader title="Tarjetas por ciclo" />
          <div className="flex flex-col gap-2.5">
            {data.creditCards.map((card) => {
              const pct = card.budget > 0 ? card.used / card.budget : 0;
              return (
                <Card key={card.accountId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{card.issuer}</div>
                      <div className="mt-0.5 text-[11px] text-[#6a7384]">{card.cycleLabel}</div>
                    </div>
                    <div className="font-mono text-[15px] font-semibold">{money(card.used)}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                    <Stat label="Presupuesto" value={card.budget} color={FT.textDim} />
                    <Stat label="Pagado" value={card.paid} color={FT.pos} />
                    <Stat label="Por pagar" value={card.due} color={pct > 0.85 ? FT.danger : FT.warn} />
                  </div>
                  <div className="mt-3">
                    {card.categorySpend.length > 0 ? <Bars data={card.categorySpend} /> : <div className="py-4 text-center text-[13px] text-[#6a7384]">Sin gasto categorizado.</div>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function buildMonthlyReport(transactions: FinanceTransaction[]) {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const current = transactions.filter((transaction) => transaction.dateIso.slice(0, 7) === currentMonth);
  const income = current.filter((transaction) => transaction.direction === "income").reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const expense = current.filter((transaction) => transaction.direction === "expense").reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const byCategory = new Map<string, number>();

  for (const transaction of current) {
    if (transaction.direction !== "expense") continue;
    byCategory.set(transaction.cat, (byCategory.get(transaction.cat) ?? 0) + Math.abs(transaction.amount));
  }

  const months = Array.from(
    transactions.reduce<Map<string, { label: string; expense: number; count: number }>>((acc, transaction) => {
      const key = transaction.dateIso.slice(0, 7);
      const item = acc.get(key) ?? { label: key, expense: 0, count: 0 };
      item.count += 1;
      if (transaction.direction === "expense") item.expense += Math.abs(transaction.amount);
      acc.set(key, item);
      return acc;
    }, new Map()).values(),
  )
    .sort((a, b) => b.label.localeCompare(a.label))
    .slice(0, 6);

  return {
    income,
    expense,
    categories: Array.from(byCategory.entries()).map(([label, value], index) => ({
      label,
      value,
      color: [FT.accent, FT.warn, FT.pos, "#8B6CF0", "#E94B6A"][index % 5],
    })),
    months,
  };
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-xl border text-[12px] font-medium"
      style={{
        background: active ? FT.accentSoft : "rgba(255,255,255,0.04)",
        borderColor: active ? "rgba(42,91,255,0.45)" : "rgba(255,255,255,0.08)",
        color: active ? FT.accent : FT.textDim,
      }}
    >
      {label}
    </button>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.06em] text-[#6a7384]">{label}</div>
      <div className="mt-1 font-mono text-[14px] font-semibold tabular-nums" style={{ color }}>
        {money(value)}
      </div>
    </div>
  );
}
