"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  CreditCard,
  Home,
  Landmark,
  Lock,
  MoreHorizontal,
  PiggyBank,
  Plus,
  ReceiptText,
  Target,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";

const FT = {
  bg: "#06080c",
  surface: "#10141c",
  surface2: "#161b25",
  surface3: "#1d2330",
  hairline: "rgba(255,255,255,0.06)",
  text: "#eef2f8",
  textDim: "#a4adbe",
  textMute: "#6a7384",
  textFade: "#444c5b",
  accent: "#2A5BFF",
  accentSoft: "rgba(42,91,255,0.16)",
  pos: "#3DD68C",
  posSoft: "rgba(61,214,140,0.14)",
  warn: "#F5B544",
  warnSoft: "rgba(245,181,68,0.14)",
  danger: "#F46A6A",
};

type Screen = "home" | "cards" | "add" | "env" | "goal";

function money(n: number, decimals = 0) {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function BigNum({ value, size = 44 }: { value: number; size?: number }) {
  const [intPart, decPart] = Math.abs(value).toFixed(2).split(".");

  return (
    <div className="inline-flex items-baseline font-mono font-semibold leading-none tabular-nums text-[#eef2f8]">
      <span className="mr-0.5 text-[#6a7384]" style={{ fontSize: size * 0.55 }}>
        $
      </span>
      <span style={{ fontSize: size }}>{Number(intPart).toLocaleString("en-US")}</span>
      <span className="ml-0.5 text-[#6a7384]" style={{ fontSize: size * 0.5 }}>
        .{decPart}
      </span>
    </div>
  );
}

function Tag({
  children,
  color = FT.textDim,
  bg = "rgba(255,255,255,0.06)",
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block size-1.5 rounded-full" style={{ background: color }} />;
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between px-1 pb-2.5">
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6a7384]">{title}</div>
      {action ? <div className="text-[13px] text-[#2A5BFF]">{action}</div> : null}
    </div>
  );
}

function ProgressBar({ pct, color = FT.accent, height = 6 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/[0.06]" style={{ height }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

function SegmentBar({ segments, height = 8 }: { segments: { value: number; color: string }[]; height?: number }) {
  return (
    <div className="flex w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.04]" style={{ height }}>
      {segments.map((segment, index) => (
        <div key={index} className="h-full" style={{ flex: segment.value, background: segment.color }} />
      ))}
    </div>
  );
}

function Ring({
  size = 70,
  stroke = 7,
  value,
  color,
  children,
}: {
  size?: number;
  stroke?: number;
  value: number;
  color: string;
  children: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, value));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function Spark({ data, color = FT.pos }: { data: number[]; color?: string }) {
  const width = 328;
  const height = 48;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 6) - 3]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id="spark-goal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-goal)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function AppShell({ active, onNavigate, children }: { active: Screen; onNavigate: (screen: Screen) => void; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#04060a] text-[#eef2f8]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#06080c] shadow-2xl md:my-8 md:min-h-[844px] md:overflow-hidden md:rounded-[42px] md:border md:border-white/10">
        <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden md:min-h-[844px]">{children}</div>
        <TabBar active={active} onNavigate={onNavigate} />
      </div>
    </main>
  );
}

function PageHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between px-5 pb-4 pt-[calc(env(safe-area-inset-top)+56px)]">
      <div>
        {eyebrow ? <div className="mb-1 text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">{eyebrow}</div> : null}
        <h1 className="text-[28px] font-semibold leading-[1.1] text-[#eef2f8]">{title}</h1>
      </div>
      {right}
    </header>
  );
}

function TabBar({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const items = [
    { id: "home" as const, label: "Inicio", icon: Home },
    { id: "cards" as const, label: "Tarjetas", icon: CreditCard },
    { id: "add" as const, label: "", icon: Plus, isAdd: true },
    { id: "env" as const, label: "Sobres", icon: WalletCards },
    { id: "goal" as const, label: "Meta", icon: Target },
  ];

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] bg-gradient-to-t from-[#06080c] from-60% to-transparent px-3 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-2 md:absolute">
      <div className="pointer-events-auto flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.isAdd) {
            return (
              <button
                key={item.id}
                aria-label="Nuevo gasto"
                className="-mt-5 flex size-[52px] items-center justify-center rounded-full bg-[#2A5BFF] text-white shadow-[0_8px_24px_rgba(42,91,255,0.45)]"
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={22} />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              className="flex min-w-14 flex-col items-center gap-1 text-[10px]"
              style={{ color: active === item.id ? FT.text : FT.textFade }}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={22} strokeWidth={1.7} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function FinanceApp({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <AppShell active={screen} onNavigate={setScreen}>
      {screen === "home" ? <Dashboard data={snapshot} /> : null}
      {screen === "cards" ? <CardDetail data={snapshot} /> : null}
      {screen === "env" ? <Envelopes data={snapshot} /> : null}
      {screen === "add" ? <ExpenseForm /> : null}
      {screen === "goal" ? <Distribution data={snapshot} /> : null}
    </AppShell>
  );
}

function Dashboard({ data }: { data: FinanceSnapshot }) {
  const libreTotal = data.allocation.libre;
  const libreBalance = data.envelopes.find((envelope) => envelope.name === "Libre")?.balance ?? 0;
  const libreUsado = Math.max(0, libreTotal - libreBalance);
  const goal = data.goals.ahorro;
  const committed = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const cardCommitted = data.creditCards.reduce((sum, card) => sum + card.used, 0);
  const fixedCommitted = data.payments
    .filter((payment) => payment.chip === "Fijos")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const msiCommitted = data.payments
    .filter((payment) => payment.chip === "MSI")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <>
      <PageHeader
        eyebrow={data.income.periodLabel}
        title={`Hola, ${data.user.name}.`}
        right={<div className="grid size-9 place-items-center rounded-full border border-white/[0.06] bg-[#161b25] text-[13px] font-medium text-[#a4adbe]">{data.user.initials}</div>}
      />
      <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 pb-32">
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
            <Ring size={70} stroke={7} value={goal.currentAmount / goal.targetAmount} color={FT.pos}>
              <div className="font-mono text-[14px] font-semibold">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</div>
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

        <div>
          <SectionHeader title="Tarjetas · ciclo actual" action="Ver todas →" />
          <div className="flex flex-col gap-2.5">
            {data.creditCards.map((card) => (
              <MiniCard key={card.issuer} {...card} />
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Próximos pagos" action="Calendario →" />
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
          <SectionHeader title="Movimientos recientes" action="Ver todos →" />
          <Card className="overflow-hidden">
            {data.transactions.map((tx, index) => (
              <TxRow key={`${tx.merchant}-${tx.date}`} {...tx} last={index === data.transactions.length - 1} />
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

function MiniCard({
  issuer,
  dot,
  daysToClose,
  used,
  budget,
  cycleLabel,
}: {
  issuer: string;
  dot: string;
  daysToClose: number;
  used: number;
  budget: number;
  cycleLabel: string;
}) {
  const pct = used / budget;
  const color = pct > 0.85 ? FT.danger : pct > 0.7 ? FT.warn : FT.accent;

  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-sm" style={{ background: dot }} />
            <span className="text-[15px] font-semibold">{issuer}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[#6a7384]">{cycleLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[#6a7384]">
            Corte en <span className="font-mono font-semibold text-[#eef2f8]">{daysToClose} días</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[#6a7384]">Presupuesto {money(budget)}</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-mono text-[18px] font-semibold tabular-nums">{money(used)}</span>
          <span className="text-[12px] text-[#6a7384]">{Math.round(pct * 100)}% usado</span>
        </div>
        <ProgressBar pct={pct * 100} color={color} height={5} />
      </div>
    </Card>
  );
}

function PaymentRow({
  label,
  sub,
  date,
  amount,
  chip,
  chipColor,
  muted,
  last,
}: {
  label: string;
  sub: string;
  date: string;
  amount: number;
  chip: string;
  chipColor?: string;
  muted?: boolean;
  last?: boolean;
}) {
  const [day, month] = date.split(" ");

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="grid size-[38px] shrink-0 place-items-center rounded-[10px] border border-white/[0.06] bg-[#161b25]">
        <div className="text-center font-mono text-[11px] leading-none text-[#a4adbe]">
          <div className="mb-0.5 text-[9px] uppercase text-[#6a7384]">{month}</div>
          <div className="font-semibold text-[#eef2f8]">{day}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-[14px] font-medium ${muted ? "text-[#a4adbe]" : "text-[#eef2f8]"}`}>{label}</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Tag color={chipColor || FT.textDim} bg={chipColor ? `${chipColor}22` : "rgba(255,255,255,0.05)"}>
            {chip}
          </Tag>
          <span className="truncate text-[11px] text-[#6a7384]">{sub}</span>
        </div>
      </div>
      <div className={`font-mono text-[15px] font-semibold tabular-nums ${muted ? "text-[#a4adbe]" : "text-[#eef2f8]"}`}>{money(amount)}</div>
    </div>
  );
}

function TxRow({
  merchant,
  cat,
  account,
  amount,
  date,
  income,
  last,
}: {
  merchant: string;
  cat: string;
  account: string;
  amount: number;
  date: string;
  income?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="grid size-8 rounded-full place-items-center text-[13px] font-semibold" style={{ background: income ? FT.posSoft : "rgba(255,255,255,0.05)", color: income ? FT.pos : FT.textDim }}>
        {merchant[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium">{merchant}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6a7384]">
          {cat} · {account} · {date}
        </div>
      </div>
      <div className="font-mono text-[14px] font-semibold tabular-nums" style={{ color: income ? FT.pos : FT.text }}>
        {income ? "+" : "−"}
        {money(Math.abs(amount), amount % 1 ? 2 : 0)}
      </div>
    </div>
  );
}

function Bars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((item) => item.value));

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[13px]">{item.label}</span>
            <span className="font-mono text-[12px] tabular-nums text-[#a4adbe]">{money(item.value)}</span>
          </div>
          <ProgressBar pct={(item.value / max) * 100} color={item.color} height={5} />
        </div>
      ))}
    </div>
  );
}

function CardDetail({ data }: { data: FinanceSnapshot }) {
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
  const pct = card.used / card.budget;
  const categoryColor: Record<string, string> = {
    Transporte: FT.accent,
    "Comida/salidas": "#8B6CF0",
    "Tools/subs": "#3DD6C9",
    MSI: FT.warn,
    Libre: FT.danger,
  };
  const categories = Object.values(
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
              <div className="text-[11px] uppercase tracking-[0.06em] opacity-80">BBVA · Crédito</div>
              <div className="mt-1 text-[22px] font-semibold">Azul</div>
            </div>
            <div className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium tracking-[0.04em]">VISA</div>
          </div>
          <div>
            <div className="font-mono text-[16px] tracking-[0.25em] opacity-90">•••• 4821</div>
            <div className="mt-3 flex items-end justify-between">
              {[
                ["Corte", "05 jun"],
                ["Pago", card.paymentDue],
                ["Límite", money(card.limit)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[9px] uppercase tracking-[0.06em] opacity-70">{label}</div>
                  <div className="font-mono text-[14px] font-medium">{value}</div>
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
            <span>06 may<br /><span className="text-[#444c5b]">inicio</span></span>
            <span className="text-center text-[#2A5BFF]">Hoy<br /><span className="opacity-70">09 may</span></span>
            <span className="text-right">05 jun<br /><span className="text-[#444c5b]">corte · 26 d</span></span>
            <span className="text-right">25 jun<br /><span className="text-[#444c5b]">pago</span></span>
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

function Envelopes({ data }: { data: FinanceSnapshot }) {
  const total = data.envelopes.reduce((a, s) => a + s.balance, 0) + data.bankAccounts.reduce((a, c) => a + c.balance, 0);
  const savingsTotal = data.envelopes.find((envelope) => envelope.name === "Ahorro")?.balance ?? 0;
  const committedTotal = data.envelopes
    .filter((envelope) => envelope.name === "Pago tarjetas" || envelope.name === "Fijos")
    .reduce((sum, envelope) => sum + envelope.balance, 0);
  const libreTotal = data.envelopes.find((envelope) => envelope.name === "Libre")?.balance ?? 0;
  const bankTotal = data.bankAccounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <>
      <PageHeader
        eyebrow="Patrimonio · 9 may"
        title="Tus sobres"
        right={<Button variant="secondary" size="icon" aria-label="Agregar sobre"><Plus size={18} /></Button>}
      />
      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto px-4 pb-32">
        <Card className="p-[18px]">
          <div className="flex items-center gap-4">
            <DonutSobres data={data} />
            <div className="flex-1">
              <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Total disponible</div>
              <div className="mt-1">
                <BigNum value={total} size={28} />
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <Legend color={FT.pos} label="Intocable" value={savingsTotal} />
                <Legend color={FT.accent} label="Comprometido" value={committedTotal} />
                <Legend color={FT.warn} label="Libre" value={libreTotal} />
                <Legend color={FT.textDim} label="Cuentas" value={bankTotal} />
              </div>
            </div>
          </div>
        </Card>
        <div>
          <SectionHeader title="Sobres" action="Reordenar →" />
          <div className="flex flex-col gap-2.5">
            {data.envelopes.map((envelope) => (
              <EnvelopeCard key={envelope.name} {...envelope} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Cuentas bancarias" action="+ Agregar" />
          <Card className="overflow-hidden">
            {data.bankAccounts.map((account, index) => (
              <div key={account.name} className={`flex items-center gap-3 px-4 py-3.5 ${index === data.bankAccounts.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <div className="grid size-[38px] place-items-center rounded-[10px] border border-white/[0.06] bg-[#161b25] text-[13px] font-semibold text-[#a4adbe]">
                  <Landmark size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium">{account.name}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-[#6a7384]">{account.sub}</div>
                </div>
                <div className="font-mono text-[16px] font-semibold">{money(account.balance)}</div>
              </div>
            ))}
          </Card>
        </div>
        <Card className="border-[#F5B5442e] bg-[#F5B5440f] p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F5B54424] text-[13px] font-semibold text-[#F5B544]">!</div>
            <div>
              <div className="text-[13px] font-medium">Si Libre se acaba, no se repone con tarjeta.</div>
              <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">
                Antojos, Bama, Amazon y compras random salen de Libre. El sistema te avisa antes de tocar Ahorro.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <div className="flex items-center gap-1.5 text-[#a4adbe]">
        <Dot color={color} />
        <span>{label}</span>
      </div>
      <span className="font-mono tabular-nums">{money(value)}</span>
    </div>
  );
}

function DonutSobres({ data }: { data: FinanceSnapshot }) {
  const items = [...data.envelopes, ...data.bankAccounts.map((account) => ({ ...account, color: FT.textDim }))];
  const total = items.reduce((a, s) => a + s.balance, 0);
  const size = 116;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative size-[116px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {items.map((item) => {
          const len = (item.balance / total) * C;
          const element = (
            <circle key={item.name} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={item.color} strokeWidth={stroke} strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[9px] uppercase tracking-[0.06em] text-[#6a7384]">Patrimonio</div>
    </div>
  );
}

function EnvelopeCard({ name, balance, color, note, goal, locked }: { name: string; balance: number; color: string; note: string; goal?: number; locked?: boolean }) {
  const pct = goal ? balance / goal : 1;

  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="min-h-9 w-1 self-stretch rounded-full" style={{ background: color }} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold">{name}</span>
              {locked ? <Lock size={11} className="text-[#444c5b]" /> : null}
            </div>
            <div className="mt-1 text-[11px] text-[#6a7384]">{note}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[18px] font-semibold tabular-nums">{money(balance)}</div>
          {goal ? <div className="mt-0.5 text-[11px] text-[#6a7384]">{Math.round(pct * 100)}% de {money(goal)}</div> : null}
        </div>
      </div>
      {goal ? <div className="mt-2.5"><ProgressBar pct={pct * 100} color={color} height={4} /></div> : null}
    </Card>
  );
}

function Distribution({ data }: { data: FinanceSnapshot }) {
  const ingreso = data.income.amount || 1;
  const [vals, setVals] = useState({ pago: 2500, ahorro: 2500, fijos: 1000, libre: 3250 });
  const total = vals.pago + vals.ahorro + vals.fijos + vals.libre;
  const diff = ingreso - total;
  const sobres = [
    { key: "pago" as const, name: "Pago tarjetas", sugerido: 2500, color: FT.accent, note: "Cubre BBVA + Liverpool + MSI", icon: CreditCard },
    { key: "ahorro" as const, name: "Ahorro", sugerido: 2500, color: FT.pos, note: "Meta MacBook · $48,000", icon: PiggyBank },
    { key: "fijos" as const, name: "Fijos", sugerido: 950, color: "#8B6CF0", note: "MacBook $1,400 · Internet $500", icon: CalendarDays },
    { key: "libre" as const, name: "Libre", sugerido: 3300, color: FT.warn, note: "Gastos variables · 14 días", icon: WalletCards },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden pt-[calc(env(safe-area-inset-top)+56px)]">
      <div className="flex items-center justify-between px-4 pb-4">
        <Button variant="secondary" size="icon" aria-label="Regresar"><ArrowLeft size={16} /></Button>
        <div className="text-[14px] text-[#a4adbe]">Paso 2 de 3</div>
        <button className="text-[13px] font-medium text-[#2A5BFF]">Sugerencia</button>
      </div>
      <div className="px-5 pb-2">
        <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Quincena recibida · 1 may</div>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <BigNum value={ingreso} size={36} />
          <Tag color={FT.pos} bg={FT.posSoft}>+ ingreso</Tag>
        </div>
        <div className="mt-1.5 text-[13px] text-[#a4adbe]">¿Cómo lo repartimos hoy?</div>
      </div>
      <div className="px-4 py-3">
        <Card className="p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] text-[#a4adbe]">Asignado · <span className="font-mono text-[#eef2f8]">{money(total)}</span></div>
            <div className="text-[12px] font-semibold" style={{ color: diff === 0 ? FT.pos : diff > 0 ? FT.warn : FT.danger }}>
              {diff === 0 ? "✓ Cuadrado" : diff > 0 ? `Faltan ${money(diff)}` : `Te pasaste ${money(Math.abs(diff))}`}
            </div>
          </div>
          <SegmentBar
            segments={[
              { value: vals.pago, color: FT.accent },
              { value: vals.ahorro, color: FT.pos },
              { value: vals.fijos, color: "#8B6CF0" },
              { value: vals.libre, color: FT.warn },
              ...(diff > 0 ? [{ value: diff, color: "rgba(255,255,255,0.06)" }] : []),
            ]}
          />
        </Card>
      </div>
      <div className="no-scrollbar flex-1 overflow-auto px-4 pb-32">
        <div className="flex flex-col gap-2.5">
          {sobres.map(({ key, ...sobre }) => (
            <AllocationSlider
              key={key}
              {...sobre}
              value={vals[key]}
              ingreso={ingreso}
              onChange={(value) => setVals((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06080c] from-60% to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+86px)] pt-3">
        <Button className="w-full" disabled={diff !== 0}>
          Confirmar distribución
        </Button>
      </div>
    </div>
  );
}

function AllocationSlider({
  name,
  note,
  color,
  icon: Icon,
  value,
  sugerido,
  ingreso,
  onChange,
}: {
  name: string;
  note: string;
  color: string;
  icon: React.ElementType;
  value: number;
  sugerido: number;
  ingreso: number;
  onChange: (value: number) => void;
}) {
  const pct = (value / ingreso) * 100;
  const isSuggested = Math.abs(value - sugerido) < 50;

  return (
    <Card className="p-3.5">
      <div className="mb-2.5 flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-[10px] border" style={{ background: `${color}1f`, borderColor: `${color}40`, color }}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{name}</div>
          <div className="mt-0.5 truncate text-[11px] text-[#6a7384]">{note}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[18px] font-semibold">{money(value)}</div>
          <div className="mt-0.5 text-[10px]" style={{ color: isSuggested ? FT.pos : FT.textMute }}>
            {isSuggested ? "✓ sugerido" : `sugerido ${money(sugerido)}`}
          </div>
        </div>
      </div>
      <input
        aria-label={`Asignación para ${name}`}
        type="range"
        min={0}
        max={ingreso}
        step={50}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#2A5BFF]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-[#444c5b]">
        <span>$0</span>
        <span className="font-mono text-[#6a7384]">{pct.toFixed(0)}% de la quincena</span>
        <span>{money(ingreso)}</span>
      </div>
    </Card>
  );
}

function ExpenseForm() {
  const [amount, setAmount] = useState("128.40");
  const [cat, setCat] = useState("transporte");
  const [method, setMethod] = useState("bbva");
  const cats = [
    { id: "transporte", label: "Transporte", color: FT.accent },
    { id: "comida", label: "Comida/salidas", color: "#8B6CF0" },
    { id: "tools", label: "Tools/subs", color: "#3DD6C9" },
    { id: "libre", label: "Libre", color: FT.warn },
    { id: "msi", label: "MSI", color: FT.danger },
    { id: "fijos", label: "Fijos", color: FT.pos },
  ];
  const methods = [
    { id: "bbva", label: "BBVA Azul", sub: "Crédito · 4821" },
    { id: "liverpool", label: "Liverpool", sub: "Crédito · 9942" },
    { id: "debito", label: "BBVA Débito", sub: "Libre · $1,820" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden pt-[calc(env(safe-area-inset-top)+56px)]">
      <div className="flex items-center justify-between px-4 pb-3">
        <button className="text-[14px] text-[#a4adbe]">Cancelar</button>
        <div className="text-[15px] font-semibold">Nuevo gasto</div>
        <button className="text-[14px] font-semibold text-[#2A5BFF]">Guardar</button>
      </div>
      <div className="px-5 pb-2 pt-6 text-center">
        <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">Monto</div>
        <div className="inline-flex items-baseline justify-center font-mono tabular-nums">
          <span className="mr-1 text-[28px] text-[#6a7384]">−$</span>
          <span className="text-[64px] font-semibold leading-none">{amount.split(".")[0]}</span>
          <span className="text-[32px] font-semibold text-[#a4adbe]">.{amount.split(".")[1] || "00"}</span>
          <span className="ml-1 inline-block h-9 w-0.5 animate-[blink_1s_steps(2)_infinite] bg-[#2A5BFF]" />
        </div>
        <div className="mt-2 text-[12px] text-[#6a7384]">9 may · 14:22 · Uber</div>
      </div>
      <div className="no-scrollbar flex-1 overflow-auto px-4 pb-4">
        <div className="mt-2">
          <SectionHeader title="Categoría" />
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium"
                style={{ background: cat === c.id ? `${c.color}22` : FT.surface, borderColor: cat === c.id ? `${c.color}55` : FT.hairline, color: cat === c.id ? c.color : FT.textDim }}
              >
                <Dot color={c.color} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-[18px]">
          <SectionHeader title="Cargar a" />
          <Card className="overflow-hidden">
            {methods.map((m, index) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${index === methods.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <span className="grid size-[22px] shrink-0 place-items-center rounded-full border" style={{ borderColor: method === m.id ? FT.accent : "rgba(255,255,255,0.10)" }}>
                  {method === m.id ? <span className="size-2.5 rounded-full bg-[#2A5BFF]" /> : null}
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[#6a7384]">{m.sub}</span>
                </span>
                {method === m.id ? <Tag color={FT.accent} bg={FT.accentSoft}>Ciclo 06 may → 05 jun</Tag> : null}
              </button>
            ))}
          </Card>
        </div>
        <Card className="mt-3.5 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium">¿Meses sin intereses?</div>
              <div className="mt-0.5 text-[11px] text-[#6a7384]">Divide el monto en parcialidades del ciclo</div>
            </div>
            <div className="flex h-6 w-[42px] items-center rounded-full bg-[#1d2330] p-0.5">
              <div className="size-5 rounded-full bg-[#6a7384]" />
            </div>
          </div>
        </Card>
        <Card className="mt-3.5 p-3.5">
          <div className="text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">Nota</div>
          <div className="mt-1.5 text-[14px] text-[#a4adbe]">Didi al aeropuerto, viernes</div>
        </Card>
      </div>
      <Keypad value={amount} setValue={setAmount} />
    </div>
  );
}

function Keypad({ value, setValue }: { value: string; setValue: (value: string) => void }) {
  const keys = useMemo(() => [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], [".", "0", "del"]], []);
  const press = (key: string) => {
    if (key === "del") return setValue(value.length > 1 ? value.slice(0, -1) : "0");
    if (key === ".") return setValue(value.includes(".") ? value : `${value}.`);
    setValue(value === "0" ? key : `${value}${key}`);
  };

  return (
    <div className="border-t border-white/[0.06] bg-gradient-to-t from-[#0b0e14] to-[#0b0e14d9] px-3 pb-[calc(env(safe-area-inset-bottom)+86px)] pt-2">
      <div className="flex flex-col gap-1.5">
        {keys.map((row) => (
          <div key={row.join("")} className="flex gap-1.5">
            {row.map((key) => (
              <button key={key} onClick={() => press(key)} className="flex h-[46px] flex-1 items-center justify-center rounded-xl border border-white/[0.06] bg-[#161b25] font-mono text-[22px] font-medium">
                {key === "del" ? <ReceiptText size={20} className="text-[#a4adbe]" /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
