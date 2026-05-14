"use client";

import { ArrowLeft, CalendarDays } from "lucide-react";
import { PaymentRow } from "@/components/dashboard/payment-row";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";

export function PaymentCalendarScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const payments = data.payments
    .slice()
    .sort((a, b) => new Date(a.dateIso || 0).getTime() - new Date(b.dateIso || 0).getTime());
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const nextPayment = payments.find((payment) => !payment.muted);

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Calendario</div>
        <div className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#161b25] text-[#a4adbe]">
          <CalendarDays size={17} />
        </div>
      </div>

      <Card className="p-4">
        <div className="text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">Pagos programados</div>
        <div className="mt-1 font-mono text-[28px] font-semibold tabular-nums">{money(total)}</div>
        <div className="mt-1 text-[12px] text-[#a4adbe]">
          {nextPayment ? `${nextPayment.label} · ${nextPayment.date}` : "No hay pagos pendientes."}
        </div>
      </Card>

      <div>
        <SectionHeader title="Agenda de pagos" />
        <Card className="overflow-hidden">
          {payments.map((payment, index) => (
            <PaymentRow key={`${payment.label}-${payment.date}-${index}`} {...payment} last={index === payments.length - 1} />
          ))}
          {payments.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[#6a7384]">Sin pagos próximos registrados.</div>
          ) : null}
        </Card>
      </div>

      <Card className="border-[#2A5BFF2e] bg-[#2A5BFF0f] p-3.5">
        <div className="text-[13px] font-medium text-[#eef2f8]">Regla operativa</div>
        <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">
          Los pagos salen de MSI activos y saldos por pagar de tarjetas. Cuando cierres o pagues un ciclo, esta agenda se actualiza desde Prisma.
        </p>
      </Card>
    </div>
  );
}
