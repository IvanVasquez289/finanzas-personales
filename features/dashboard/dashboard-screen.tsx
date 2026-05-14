"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { ArrowUp, BarChart3, CalendarDays, ScanText, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { MiniCard } from "@/components/cards/mini-card";
import { PaymentRow } from "@/components/dashboard/payment-row";
import { Bars } from "@/components/finance/bars";
import { BigNum } from "@/components/finance/big-num";
import { Dot } from "@/components/finance/dot";
import { Ring } from "@/components/finance/ring";
import { SectionHeader } from "@/components/finance/section-header";
import { SegmentBar } from "@/components/finance/segment-bar";
import { Spark } from "@/components/finance/spark";
import { Tag } from "@/components/finance/tag";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";
import { signOut } from "@/lib/auth-client";

export function DashboardScreen({
  data,
  onViewCards,
  onViewTransactions,
  onViewCalendar,
  onViewReports,
  onViewImports,
  onViewOnboarding,
}: {
  data: FinanceSnapshot;
  onViewCards: () => void;
  onViewTransactions: () => void;
  onViewCalendar: () => void;
  onViewReports: () => void;
  onViewImports: () => void;
  onViewOnboarding: () => void;
}) {
  const [periodDays, setPeriodDays] = useState(30);
  const libreTotal = data.allocation.libre;
  const libreBalance = data.dashboard.libre;
  const libreUsado = Math.max(0, libreTotal - libreBalance);
  const goal = data.goals.ahorro;
  const committed = data.dashboard.committed;
  const cardCommitted = data.creditCards.reduce((sum, card) => sum + card.used, 0);
  const fixedCommitted = data.payments
    .filter((payment) => payment.chip === "Fijos")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const msiCommitted = data.payments
    .filter((payment) => payment.chip === "MSI")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const goalPct = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const filteredTransactions = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - periodDays);

    return data.transactions.filter((transaction) => new Date(transaction.dateIso) >= start);
  }, [data.transactions, periodDays]);

  return (
    <>
      <PageHeader
        eyebrow={data.income.periodLabel}
        title={`Hola, ${data.user.name}.`}
        right={
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.href = "/sign-in";
            }}
            className="grid size-9 place-items-center rounded-full border border-white/[0.06] bg-[#161b25] text-[13px] font-medium text-[#a4adbe]"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            {data.user.initials}
          </button>
        }
      />
      <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll">
        <Card className="relative overflow-hidden rounded-[22px] p-[18px]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(42,91,255,0.18)_0%,rgba(42,91,255,0)_55%)]" />
          <div className="absolute inset-0 opacity-40 [background:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)_0_0/100%_28px]" />
          <div className="relative">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] text-[#a4adbe]">Te quedan libres</span>
              <Tag color={FT.pos} bg={FT.posSoft}>
                <Dot color={FT.pos} /> En camino
              </Tag>
            </div>
            <BigNum value={libreTotal - libreUsado} size={48} />
            <p className="mt-1.5 text-[12px] text-[#6a7384]">
              de <span className="font-mono">{money(libreTotal)}</span> · te alcanza ~9 días
            </p>
            <div className="mt-[18px]">
              <SegmentBar
                height={10}
                segments={[
                  { value: data.allocation.pagoTarjetas, color: FT.accent },
                  { value: data.allocation.fijos, color: "#8B6CF0" },
                  { value: libreUsado, color: FT.warn },
                  { value: libreTotal - libreUsado, color: "rgba(255,255,255,0.10)" },
                  { value: data.allocation.ahorro, color: FT.pos },
                ]}
              />
              <div className="mt-3 grid grid-cols-5 gap-2 text-[10px]">
                {[
                  ["Tarjetas", data.allocation.pagoTarjetas, FT.accent],
                  ["Fijos", data.allocation.fijos, "#8B6CF0"],
                  ["Libre usado", libreUsado, FT.warn],
                  ["Libre", libreTotal - libreUsado, "rgba(255,255,255,0.5)"],
                  ["Ahorro", data.allocation.ahorro, FT.pos],
                ].map(([label, value, color]) => (
                  <div key={String(label)}>
                    <div className="mb-0.5 flex items-center gap-1 text-[#6a7384]">
                      <Dot color={String(color)} />
                      <span>{label}</span>
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-[#eef2f8]">{money(Number(value))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          {[
            [14, "14 días"],
            [30, "30 días"],
            [90, "90 días"],
          ].map(([days, label]) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriodDays(Number(days))}
              className="h-9 rounded-xl border text-[12px] font-medium"
              style={{
                background: periodDays === days ? FT.accentSoft : "rgba(255,255,255,0.04)",
                borderColor: periodDays === days ? "rgba(42,91,255,0.45)" : "rgba(255,255,255,0.08)",
                color: periodDays === days ? FT.accent : FT.textDim,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <QuickAction icon={CalendarDays} label="Calendario" onClick={onViewCalendar} />
          <QuickAction icon={BarChart3} label="Reportes" onClick={onViewReports} />
          <QuickAction icon={ScanText} label="Importar" onClick={onViewImports} />
          <QuickAction icon={SlidersHorizontal} label="Setup" onClick={onViewOnboarding} />
        </div>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">{goal.name}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-[26px] font-semibold tabular-nums">{money(goal.currentAmount)}</span>
                <span className="text-[13px] text-[#6a7384]">/ {money(goal.targetAmount)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#3DD68C]">
                <ArrowUp size={12} />
                <span className="font-mono tabular-nums">+{money(goal.monthlyDelta)}</span>
                <span className="text-[#6a7384]">este mes</span>
              </div>
            </div>
            <Ring size={70} stroke={7} value={goalPct} color={FT.pos}>
              <div className="font-mono text-[14px] font-semibold">{Math.round(goalPct * 100)}%</div>
            </Ring>
          </div>
          <div className="mt-3.5">
            <Spark data={goal.history} />
          </div>
          <div className="flex justify-between px-1 text-[10px] text-[#444c5b]">
            <span>jun ’25</span>
            <span>nov ’25</span>
            <span>may ’26</span>
          </div>
        </Card>

        {data.dashboard.alerts.length > 0 ? (
          <Card className="border-[#F5B5442e] bg-[#F5B5440f] p-4">
            <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Alertas</div>
            <div className="mt-3 flex flex-col gap-2">
              {data.dashboard.alerts.map((alert) => (
                <div key={`${alert.label}-${alert.detail}`} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold">{alert.label}</div>
                    <div className="mt-0.5 text-[12px] text-[#a4adbe]">{alert.detail}</div>
                  </div>
                  <Tag color={alert.tone === "danger" ? FT.danger : FT.warn} bg={alert.tone === "danger" ? "rgba(244,106,106,0.14)" : FT.warnSoft}>
                    {alert.tone === "danger" ? "revisar" : "límite"}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <div>
          <SectionHeader title="Tarjetas · ciclo actual" action="Ver todas →" onAction={onViewCards} />
          <div className="flex flex-col gap-2.5">
            {data.creditCards.map((card) => (
              <MiniCard key={card.issuer} {...card} />
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Próximos pagos" action="Calendario →" onAction={onViewCalendar} />
          <Card className="overflow-hidden">
            {data.payments.map((payment, index) => (
              <PaymentRow key={payment.label} {...payment} last={index === data.payments.length - 1} />
            ))}
          </Card>
        </div>

        <Card className="p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Dinero comprometido</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-semibold tabular-nums">{money(committed)}</span>
                <span className="text-[12px] text-[#6a7384]">hasta corte</span>
              </div>
            </div>
            <Tag color={FT.warn} bg={FT.warnSoft}>
              {data.payments.length} pagos
            </Tag>
          </div>
          <Bars
            data={[
              { label: "Tarjetas", value: cardCommitted, color: FT.accent },
              { label: "Pagos fijos", value: fixedCommitted, color: "#8B6CF0" },
              { label: "MSI activos", value: msiCommitted, color: FT.warn },
            ]}
          />
        </Card>

        <div>
          <SectionHeader title="Movimientos recientes" action="Ver todos →" onAction={onViewTransactions} />
          <Card className="overflow-hidden">
            {filteredTransactions.map((tx, index) => (
              <TransactionRow key={`${tx.merchant}-${tx.date}`} {...tx} last={index === filteredTransactions.length - 1} />
            ))}
            {filteredTransactions.length === 0 ? (
              <div className="px-4 py-5 text-center text-[13px] text-[#6a7384]">Sin movimientos en este periodo.</div>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[58px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.08] bg-[#10141d] text-[11px] font-medium text-[#a4adbe]"
    >
      <Icon size={17} />
      <span>{label}</span>
    </button>
  );
}
