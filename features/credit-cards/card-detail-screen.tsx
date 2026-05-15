"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Bars } from "@/components/finance/bars";
import { BigNum } from "@/components/finance/big-num";
import { ProgressBar } from "@/components/finance/progress-bar";
import { Ring } from "@/components/finance/ring";
import { SectionHeader } from "@/components/finance/section-header";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";
import { closeCreditCycleAction, registerCardPaymentAction } from "./actions";

export function CardDetailScreen({
  data,
  onBack,
  onManage,
}: {
  data: FinanceSnapshot;
  onBack: () => void;
  onManage: () => void;
}) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState(0);
  const [showCloseSection, setShowCloseSection] = useState(false);
  const [paymentState, paymentAction, paymentPending] = useActionState(registerCardPaymentAction, {
    ok: false,
    message: "",
  });
  const [closeState, closeAction, closePending] = useActionState(closeCreditCycleAction, {
    ok: false,
    message: "",
  });
  const card = data.creditCards[selectedCard] ?? data.creditCards[0] ?? {
    accountId: "",
    issuer: "Sin tarjeta",
    dot: FT.accent,
    daysToClose: 0,
    used: 0,
    paid: 0,
    due: 0,
    budget: 1,
    limit: 0,
    cycleLabel: "Sin ciclo abierto",
    paymentDue: "Sin fecha",
    paymentDueIso: "",
    categorySpend: [],
    transactions: [],
  };
  const pct = card.budget > 0 ? card.used / card.budget : 0;
  const categories = card.categorySpend;
  const today = new Date();
  const cycleStart = card.cycleStartDate ? new Date(card.cycleStartDate) : null;
  const cycleEnd = new Date(today.getTime() + card.daysToClose * 86_400_000);
  const cycleTotalDays = cycleStart ? (cycleEnd.getTime() - cycleStart.getTime()) / 86_400_000 : 30;
  const cycleElapsedDays = cycleStart ? (today.getTime() - cycleStart.getTime()) / 86_400_000 : 0;
  const cyclePct = cycleTotalDays > 0 ? Math.round((cycleElapsedDays / cycleTotalDays) * 100) : 0;
  const installmentRows = data.payments.filter(
    (payment) => (payment.chip === "MSI" || payment.chip === "Sobre") && payment.accountId === card.accountId,
  );
  const paymentSources = data.expenseForm.accounts.filter((account) => account.paymentMethod !== "credit_card");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const cardGradient = `linear-gradient(135deg, ${shade(card.dot, -34)} 0%, ${card.dot} 56%, ${shade(card.dot, 28)} 100%)`;

  useEffect(() => {
    if (!paymentState.ok) return;

    router.refresh();
  }, [paymentState.ok, router]);

  useEffect(() => {
    setPaymentAmount(0);
  }, [selectedCard]);

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Tarjeta</div>
        <button
          type="button"
          onClick={onManage}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161b25] px-3 py-2 text-[12px] text-[#a4adbe]"
        >
          <Settings2 size={13} />
          Configurar
        </button>
      </div>
      {data.creditCards.length > 1 ? (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-[11px] uppercase tracking-[0.08em] text-[#6a7384]">Tarjetas</div>
            <div className="font-mono text-[11px] text-[#6a7384]">{selectedCard + 1}/{data.creditCards.length} · desliza</div>
          </div>
          <div className="relative -mx-4 overflow-hidden">
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
              {data.creditCards.map((item, index) => {
                const selected = index === selectedCard;
                const usagePct = item.budget > 0 ? Math.min(100, Math.round((item.used / item.budget) * 100)) : 0;

                return (
                  <button
                    key={item.accountId}
                    type="button"
                    className="min-w-[238px] snap-start rounded-[20px] border p-3.5 text-left transition-colors"
                    style={{
                      background: selected
                        ? `linear-gradient(135deg, ${item.dot}24, rgba(255,255,255,0.045))`
                        : "rgba(255,255,255,0.04)",
                      borderColor: selected ? `${item.dot}80` : "rgba(255,255,255,0.08)",
                      boxShadow: selected ? `0 0 0 1px ${item.dot}24 inset` : "none",
                    }}
                    onClick={() => setSelectedCard(index)}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: item.dot }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-[#eef2f8]">{item.issuer}</span>
                        <span className="mt-1 block text-[11px] text-[#6a7384]">
                          {item.cycleLabel === "Sin ciclo abierto" ? "Sin ciclo abierto" : item.paymentDue ? `Pago ${item.paymentDue}` : item.cycleLabel}
                        </span>
                      </span>
                      <span className="rounded-full px-2 py-1 font-mono text-[10px]" style={{ background: `${item.dot}1f`, color: item.dot }}>
                        {usagePct}%
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[15px] font-semibold text-[#eef2f8]">{money(item.used)}</span>
                      <span className="truncate text-[11px] text-[#6a7384]">de {money(item.budget)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full" style={{ width: `${usagePct}%`, background: item.dot }} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#06080c] to-transparent" />
          </div>
        </div>
      ) : null}
      <div className="relative h-[196px] overflow-hidden rounded-[20px] p-5 text-white shadow-[0_12px_40px_rgba(42,91,255,0.32)]" style={{ background: cardGradient }}>
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(255,255,255,0.25)_0%,transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.06em] opacity-80">Crédito</div>
              <div className="mt-1 text-[22px] font-semibold">{card.issuer}</div>
            </div>
            <div className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium tracking-[0.04em]">VISA</div>
          </div>
          <div>
            <div className="font-mono text-[16px] tracking-[0.25em] opacity-90">•••• 4821</div>
            <div className="mt-3 flex items-end justify-between">
              {[
                ["Ciclo", card.cycleLabel],
                ["Pago", card.paymentDue],
                ["Límite", money(card.limit)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[9px] uppercase tracking-[0.06em] opacity-70">{label}</div>
                  <div className="font-mono text-[12px] font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Card className="p-[18px]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Presupuesto personal</div>
            <div className="mt-1.5">
              <BigNum value={card.used} size={36} />
            </div>
            <div className="mt-1 text-[12px] text-[#6a7384]">
              de <span className="font-mono">{money(card.budget)}</span> · te quedan{" "}
              <span className="font-mono text-[#eef2f8]">{money(card.budget - card.used, 2)}</span>
            </div>
            <div className="mt-1 text-[12px] text-[#6a7384]">
              pagado <span className="font-mono text-[#eef2f8]">{money(card.paid)}</span> · por pagar{" "}
              <span className="font-mono text-[#eef2f8]">{money(card.due)}</span>
            </div>
          </div>
          <Ring size={68} stroke={7} value={pct} color={pct > 0.85 ? FT.danger : pct > 0.7 ? FT.warn : FT.accent}>
            <div className="font-mono text-[13px] font-semibold">{Math.round(pct * 100)}%</div>
          </Ring>
        </div>
        <div className="mt-[18px]">
          <ProgressBar pct={cyclePct} color={FT.accent} height={2} />
          <div className="mt-2 flex justify-between text-[10px] text-[#6a7384]">
            <span>{card.cycleLabel.split(" → ")[0]}<br /><span className="text-[#444c5b]">inicio</span></span>
            <span className="text-center text-[#2A5BFF]">Hoy<br /><span className="opacity-70">actual</span></span>
            <span className="text-right">{card.cycleLabel.split(" → ")[1] ?? "corte"}<br /><span className="text-[#444c5b]">corte · {card.daysToClose} d</span></span>
            <span className="text-right">{card.paymentDue}<br /><span className="text-[#444c5b]">pago</span></span>
          </div>
        </div>
        {card.cycleId ? (
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <div className="mb-3">
              <div className="text-[13px] font-semibold">Registrar pago de tarjeta</div>
              <p className="mt-0.5 text-[11px] leading-[1.45] text-[#6a7384]">
                ¿Ya pagaste tu tarjeta? Selecciona la cuenta bancaria desde donde hiciste el abono y el monto que pagaste.
              </p>
            </div>
            <form action={paymentAction} className="grid gap-2">
              <input type="hidden" name="cycleId" value={card.cycleId} />
              <label className="block text-[12px] text-[#6a7384]">
                Desde cuenta bancaria
                <select
                  name="paymentAccountId"
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
                  defaultValue={paymentSources[0]?.id ?? ""}
                >
                  {paymentSources.map((source) => (
                    <option key={source.id} value={source.id}>{source.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-[12px] text-[#6a7384]">
                <div className="flex items-baseline justify-between">
                  <span>Monto del abono</span>
                  {card.due > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(card.due)}
                      className="text-[11px] text-[#2A5BFF]"
                    >
                      Usar saldo {money(card.due)}
                    </button>
                  )}
                </div>
                <input
                  name="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(Number(event.target.value))}
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-right font-mono text-[14px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
                />
              </label>
              <Button className="w-full" disabled={paymentPending || card.due <= 0 || paymentSources.length === 0}>
                {paymentSources.length === 0
                  ? "Crea una cuenta bancaria primero"
                  : card.due > 0
                    ? `Confirmar pago de ${money(paymentAmount)}`
                    : "Tarjeta pagada ✓"}
              </Button>
              {paymentState.message ? (
                <div className="text-center text-[12px]" style={{ color: paymentState.ok ? FT.pos : FT.danger }}>
                  {paymentState.message}
                </div>
              ) : null}
            </form>
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              {!showCloseSection ? (
                <button
                  type="button"
                  onClick={() => setShowCloseSection(true)}
                  className="text-[11px] text-[#6a7384] underline-offset-2 hover:text-[#a4adbe]"
                >
                  Cerrar y archivar ciclo…
                </button>
              ) : (
                <>
                  <p className="mb-1 text-[11px] font-medium text-[#eef2f8]">¿Qué es cerrar un ciclo?</p>
                  <p className="mb-3 text-[11px] leading-[1.5] text-[#6a7384]">
                    Cada mes tu tarjeta genera un <em>ciclo</em> de facturación que agrupa tus compras. Al cerrarlo, marcas ese período como pagado y archivado. Solo hazlo cuando ya liquidaste el total — no se puede deshacer.
                  </p>
                  <form
                    action={closeAction}
                    onSubmit={(e) => {
                      if (!window.confirm("¿Confirmas cerrar y archivar este ciclo? Esta acción no se puede deshacer.")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="cycleId" value={card.cycleId} />
                    <Button type="submit" variant="secondary" className="w-full text-[#E94B6A]" disabled={closePending}>
                      {closePending ? "Cerrando…" : "Confirmar cierre de ciclo"}
                    </Button>
                    {closeState.message ? (
                      <div className="mt-2 text-center text-[12px]" style={{ color: closeState.ok ? FT.pos : FT.danger }}>
                        {closeState.message}
                      </div>
                    ) : null}
                  </form>
                  <button
                    type="button"
                    onClick={() => setShowCloseSection(false)}
                    className="mt-2 w-full text-center text-[11px] text-[#6a7384]"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Card>
      <div>
        <SectionHeader title="Por categoría · este ciclo" />
        <Card className="p-4">
          {categories.length > 0 ? (
            <Bars data={categories} />
          ) : (
            <div className="py-5 text-center text-[13px] text-[#6a7384]">Sin gastos registrados en este ciclo.</div>
          )}
        </Card>
      </div>
      <div>
        <SectionHeader title="MSI activos" action={`${installmentRows.length} planes →`} />
        <Card className="overflow-hidden">
          {installmentRows.map((payment, index) => (
            <MsiRow
              key={payment.label}
              merchant={payment.label}
              monthly={payment.amount}
              sub={payment.sub}
              current={payment.currentInstallment ?? 0}
              total={payment.totalInstallments ?? 1}
              last={index === installmentRows.length - 1}
            />
          ))}
        </Card>
      </div>
      <div>
        <SectionHeader title="Movimientos del ciclo" />
        <Card className="overflow-hidden">
          {card.transactions.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              {...transaction}
              last={index === card.transactions.length - 1}
            />
          ))}
          {card.transactions.length === 0 ? (
            <div className="px-4 py-5 text-center text-[13px] text-[#6a7384]">Sin movimientos registrados en este ciclo.</div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function shade(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  const num = Number.parseInt(normalized, 16);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 255) + amount);
  const b = clamp((num & 255) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function MsiRow({ merchant, monthly, sub, current, total, last }: { merchant: string; monthly: number; sub: string; current: number; total: number; last?: boolean }) {
  const msiPct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className={`px-4 py-3.5 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[14px] font-medium">{merchant}</div>
        <div className="font-mono text-[14px] font-semibold">{money(monthly)}/mes</div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar pct={msiPct} color={FT.warn} height={4} />
        </div>
        <div className="text-[11px] text-[#6a7384]">{sub}</div>
      </div>
    </div>
  );
}
