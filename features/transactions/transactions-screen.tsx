"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CreditCard, Search } from "lucide-react";
import { SectionHeader } from "@/components/finance/section-header";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";

type MovementMode = "all" | "expense" | "income" | "cards";
type PeriodMode = "30" | "90" | "all";

const modeOptions: { id: MovementMode; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "expense", label: "Gastos" },
  { id: "income", label: "Ingresos" },
  { id: "cards", label: "Tarjetas" },
];

const periodOptions: { id: PeriodMode; label: string }[] = [
  { id: "30", label: "30 d" },
  { id: "90", label: "90 d" },
  { id: "all", label: "Todo" },
];

export function TransactionsScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const [mode, setMode] = useState<MovementMode>("all");
  const [period, setPeriod] = useState<PeriodMode>("90");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const start = new Date();
    if (period !== "all") {
      start.setDate(start.getDate() - Number(period));
    }

    return data.movementDetail.filter((transaction) => {
      const inPeriod = period === "all" || new Date(transaction.dateIso) >= start;
      const inMode =
        mode === "all" ||
        transaction.direction === mode ||
        (mode === "cards" && ["credit_card", "store_card"].includes(transaction.accountType));
      const inQuery =
        normalizedQuery.length === 0 ||
        [transaction.merchant, transaction.cat, transaction.account, transaction.cycleLabel]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery));

      return inPeriod && inMode && inQuery;
    });
  }, [data.movementDetail, mode, period, query]);

  const expenseTotal = filtered
    .filter((transaction) => transaction.direction === "expense")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const incomeTotal = filtered
    .filter((transaction) => transaction.direction === "income")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const cardTotal = filtered
    .filter((transaction) => ["credit_card", "store_card"].includes(transaction.accountType))
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Movimientos</div>
        <div className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#161b25] text-[#a4adbe]">
          <CreditCard size={17} />
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <SummaryStat label="Gastos" value={expenseTotal} color={FT.warn} />
          <SummaryStat label="Ingresos" value={incomeTotal} color={FT.pos} />
          <SummaryStat label="Tarjetas" value={cardTotal} color={FT.accent} />
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {modeOptions.map((option) => (
          <FilterButton
            key={option.id}
            active={mode === option.id}
            label={option.label}
            onClick={() => setMode(option.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {periodOptions.map((option) => (
          <FilterButton
            key={option.id}
            active={period === option.id}
            label={option.label}
            onClick={() => setPeriod(option.id)}
          />
        ))}
      </div>

      <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3 text-[#a4adbe]">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar comercio, categoría o cuenta"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#eef2f8] outline-none placeholder:text-[#6a7384]"
        />
      </label>

      <div>
        <SectionHeader title={`${filtered.length} movimientos`} />
        <Card className="overflow-hidden">
          {filtered.map((transaction, index) => (
            <div key={transaction.id}>
              <TransactionRow {...transaction} last />
              <div className={`px-4 pb-3 pl-[60px] ${index === filtered.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <div className="flex flex-wrap gap-1.5">
                  <DetailChip label={transaction.paymentMethod.replace("_", " ")} />
                  <DetailChip label={transaction.source} />
                  {transaction.cycleLabel ? <DetailChip label={transaction.cycleLabel} /> : null}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[#6a7384]">Sin movimientos con esos filtros.</div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
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

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.06em] text-[#6a7384]">{label}</div>
      <div className="mt-1 font-mono text-[14px] font-semibold tabular-nums" style={{ color }}>
        {money(value)}
      </div>
    </div>
  );
}

function DetailChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] capitalize text-[#6a7384]">
      {label}
    </span>
  );
}
