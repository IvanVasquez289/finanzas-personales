"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, LayoutList, Pencil, PieChart, Search, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/finance/progress-bar";
import { SectionHeader } from "@/components/finance/section-header";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot, FinanceTransaction } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";
import { updateTransactionAction, deleteTransactionAction } from "./actions";

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
  const [view, setView] = useState<"list" | "categories">("list");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const start = new Date();
    if (period !== "all") start.setDate(start.getDate() - Number(period));

    return data.movementDetail.filter((transaction) => {
      const inPeriod = period === "all" || new Date(transaction.dateIso) >= start;
      const inMode =
        mode === "all" ||
        transaction.direction === mode ||
        (mode === "cards" && ["credit_card", "store_card"].includes(transaction.accountType));
      const inQuery =
        normalizedQuery.length === 0 ||
        [transaction.merchant, transaction.cat, transaction.account, transaction.budgetAccount, transaction.cycleLabel]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      return inPeriod && inMode && inQuery;
    });
  }, [data.movementDetail, mode, period, query]);

  const expenseTotal = filtered
    .filter((t) => t.direction === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const incomeTotal = filtered
    .filter((t) => t.direction === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const cardTotal = filtered
    .filter((t) => ["credit_card", "store_card"].includes(t.accountType))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const categoryBreakdown = useMemo(() => {
    const expenseOnly = filtered.filter((t) => t.direction === "expense");
    const grouped = new Map<string, { name: string; color: string; total: number; count: number }>();
    for (const tx of expenseOnly) {
      const key = tx.categoryId ?? tx.cat;
      if (!grouped.has(key)) {
        const cat = data.expenseForm.categories.find((c) => c.id === tx.categoryId);
        grouped.set(key, { name: cat?.label ?? tx.cat, color: cat?.color ?? "#a4adbe", total: 0, count: 0 });
      }
      const entry = grouped.get(key)!;
      entry.total += Math.abs(tx.amount);
      entry.count += 1;
    }
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [filtered, data.expenseForm.categories]);

  const categoryTotal = categoryBreakdown.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Movimientos</div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#161b25] p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className="grid size-8 place-items-center rounded-lg transition-colors"
            style={{ background: view === "list" ? FT.accentSoft : "transparent", color: view === "list" ? FT.accent : FT.textFade }}
          >
            <LayoutList size={15} />
          </button>
          <button
            type="button"
            onClick={() => setView("categories")}
            className="grid size-8 place-items-center rounded-lg transition-colors"
            style={{ background: view === "categories" ? FT.accentSoft : "transparent", color: view === "categories" ? FT.accent : FT.textFade }}
          >
            <PieChart size={15} />
          </button>
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
          <FilterButton key={option.id} active={mode === option.id} label={option.label} onClick={() => setMode(option.id)} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {periodOptions.map((option) => (
          <FilterButton key={option.id} active={period === option.id} label={option.label} onClick={() => setPeriod(option.id)} />
        ))}
      </div>

      {view === "list" && (
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3 text-[#a4adbe]">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar comercio, categoría o cuenta"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#eef2f8] outline-none placeholder:text-[#6a7384]"
          />
        </label>
      )}

      {view === "list" ? (
        <div>
          <SectionHeader title={`${filtered.length} movimientos`} />
          <Card className="overflow-hidden">
            {filtered.map((transaction, index) => (
              <TransactionEditRow
                key={transaction.id}
                transaction={transaction}
                categories={data.expenseForm.categories}
                last={index === filtered.length - 1}
              />
            ))}
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-[#6a7384]">Sin movimientos con esos filtros.</div>
            ) : null}
          </Card>
        </div>
      ) : (
        <div>
          <SectionHeader title={`Por categoría · ${money(categoryTotal)} en gastos`} />
          {categoryBreakdown.length === 0 ? (
            <Card className="p-4 text-center text-[13px] text-[#6a7384]">Sin gastos en este período.</Card>
          ) : (
            <Card className="overflow-hidden">
              {categoryBreakdown.map((cat, index) => {
                const pct = categoryTotal > 0 ? cat.total / categoryTotal : 0;
                return (
                  <div
                    key={cat.name}
                    className={`px-4 py-3.5 ${index === categoryBreakdown.length - 1 ? "" : "border-b border-white/[0.06]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: cat.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[14px] font-medium">{cat.name}</span>
                          <span className="shrink-0 font-mono text-[13px]">{money(cat.total)}</span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar pct={pct * 100} color={cat.color} height={3} />
                        </div>
                        <div className="mt-1 text-[10px] text-[#6a7384]">
                          {Math.round(pct * 100)}% del total · {cat.count} movimiento{cat.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function TransactionEditRow({
  transaction,
  categories,
  last,
}: {
  transaction: FinanceTransaction;
  categories: { id: string; label: string; color: string }[];
  last: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updating] = useActionState(updateTransactionAction, { ok: false, message: "" });
  const [deleteState, deleteAction, deleting] = useActionState(deleteTransactionAction, { ok: false, message: "" });

  useEffect(() => {
    if (updateState.ok) setEditing(false);
  }, [updateState.ok]);

  return (
    <div>
      <TransactionRow {...transaction} last />
      <div className={`px-4 pb-3 pl-[60px] ${last ? "" : editing ? "" : "border-b border-white/[0.06]"}`}>
        {editing ? (
          <form action={updateAction} className="grid gap-3 pt-1">
            <input type="hidden" name="transactionId" value={transaction.id} />
            <input
              name="merchant"
              defaultValue={transaction.merchant}
              required
              className="h-11 w-full rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
              placeholder="Comercio"
            />
            <select
              name="categoryId"
              defaultValue={transaction.categoryId ?? ""}
              className="h-11 w-full rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={Math.abs(transaction.amount)}
                required
                className="h-11 rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-right font-mono text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
              />
              <input
                name="date"
                type="date"
                defaultValue={transaction.dateIso.slice(0, 10)}
                required
                className="h-11 rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
              />
            </div>
            {updateState.message ? (
              <p className="text-[11px]" style={{ color: updateState.ok ? FT.pos : FT.danger }}>
                {updateState.message}
              </p>
            ) : null}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={updating} className="h-10 flex-1 text-[12px]">
                {updating ? "Guardando…" : "Guardar"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)} className="h-10 flex-1 text-[12px]">
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <DetailChip label={transaction.paymentMethod.replace("_", " ")} />
            <DetailChip label={transaction.source} />
            {transaction.cycleLabel ? <DetailChip label={transaction.cycleLabel} /> : null}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-[#a4adbe] transition-colors hover:bg-white/[0.09]"
            >
              <Pencil size={9} />
              Editar
            </button>
            <form action={deleteAction}>
              <input type="hidden" name="transactionId" value={transaction.id} />
              <button
                type="submit"
                disabled={deleting}
                className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-[#E94B6A] transition-colors hover:bg-[#E94B6A]/10"
              >
                <Trash2 size={9} />
                {deleting ? "…" : "Eliminar"}
              </button>
            </form>
            {deleteState.message && !deleteState.ok ? (
              <span className="text-[10px] text-red-400">{deleteState.message}</span>
            ) : null}
          </div>
        )}
      </div>
      {!last && editing ? <div className="border-b border-white/[0.06]" /> : null}
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
