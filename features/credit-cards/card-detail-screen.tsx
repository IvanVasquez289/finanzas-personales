"use client";

import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Bars } from "@/components/finance/bars";
import { BigNum } from "@/components/finance/big-num";
import { ProgressBar } from "@/components/finance/progress-bar";
import { Ring } from "@/components/finance/ring";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";

export function CardDetailScreen({ data }: { data: FinanceSnapshot }) {
  const card = data.creditCards[0] ?? {
    issuer: "Sin tarjeta",
    dot: FT.accent,
    daysToClose: 0,
    used: 0,
    budget: 1,
    limit: 0,
    cycleLabel: "Sin ciclo abierto",
    paymentDue: "Sin fecha",
  };
  const pct = card.budget > 0 ? card.used / card.budget : 0;
  const categories = buildCategoryBars(data);
  const installmentRows = data.payments.filter((payment) => payment.chip === "MSI" || payment.chip === "Fijos");

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 pb-32 pt-[calc(env(safe-area-inset-top)+56px)]">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar">
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Tarjeta</div>
        <Button variant="secondary" size="icon" aria-label="Más opciones">
          <MoreHorizontal size={18} />
        </Button>
      </div>
      <div className="relative h-[196px] overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#1E3DB0_0%,#2A5BFF_55%,#5C84FF_100%)] p-5 text-white shadow-[0_12px_40px_rgba(42,91,255,0.32)]">
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
          </div>
          <Ring size={68} stroke={7} value={pct} color={pct > 0.85 ? FT.danger : pct > 0.7 ? FT.warn : FT.accent}>
            <div className="font-mono text-[13px] font-semibold">{Math.round(pct * 100)}%</div>
          </Ring>
        </div>
        <div className="mt-[18px]">
          <ProgressBar pct={(4 / 30) * 100} color={FT.accent} height={2} />
          <div className="mt-2 flex justify-between text-[10px] text-[#6a7384]">
            <span>{card.cycleLabel.split(" → ")[0]}<br /><span className="text-[#444c5b]">inicio</span></span>
            <span className="text-center text-[#2A5BFF]">Hoy<br /><span className="opacity-70">actual</span></span>
            <span className="text-right">{card.cycleLabel.split(" → ")[1] ?? "corte"}<br /><span className="text-[#444c5b]">corte · {card.daysToClose} d</span></span>
            <span className="text-right">{card.paymentDue}<br /><span className="text-[#444c5b]">pago</span></span>
          </div>
        </div>
      </Card>
      <div>
        <SectionHeader title="Por categoría · este ciclo" />
        <Card className="p-4">
          <Bars data={categories} />
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
              last={index === installmentRows.length - 1}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}

function buildCategoryBars(data: FinanceSnapshot) {
  const categoryColor: Record<string, string> = {
    Transporte: FT.accent,
    "Comida/salidas": "#8B6CF0",
    "Tools/subs": "#3DD6C9",
    MSI: FT.warn,
    Libre: FT.danger,
  };

  return Object.values(
    data.transactions
      .filter((transaction) => !transaction.income && transaction.amount < 0)
      .reduce<Record<string, { label: string; value: number; color: string }>>((acc, transaction) => {
        acc[transaction.cat] ??= {
          label: transaction.cat,
          value: 0,
          color: categoryColor[transaction.cat] ?? FT.textDim,
        };
        acc[transaction.cat].value += Math.abs(transaction.amount);
        return acc;
      }, {}),
  );
}

function MsiRow({ merchant, monthly, sub, last }: { merchant: string; monthly: number; sub: string; last?: boolean }) {
  return (
    <div className={`px-4 py-3.5 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[14px] font-medium">{merchant}</div>
        <div className="font-mono text-[14px] font-semibold">{money(monthly)}/mes</div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar pct={60} color={FT.warn} height={4} />
        </div>
        <div className="text-[11px] text-[#6a7384]">{sub}</div>
      </div>
    </div>
  );
}
