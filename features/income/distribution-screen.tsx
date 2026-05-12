"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, CalendarDays, CreditCard, PiggyBank, WalletCards } from "lucide-react";
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
}: {
  data: FinanceSnapshot;
  onBack: () => void;
  onSaved: () => void;
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
  const [vals, setVals] = useState({
    pago: data.allocation.pagoTarjetas,
    ahorro: data.allocation.ahorro,
    fijos: data.allocation.fijos,
    libre: data.allocation.libre,
  });
  const [state, formAction, pending] = useActionState(confirmDistributionAction, {
    ok: false,
    message: "",
  });
  const total = vals.pago + vals.ahorro + vals.fijos + vals.libre;
  const diff = ingreso - total;
  const sobres = [
    { key: "pago" as const, name: "Pago tarjetas", sugerido: 2500, color: FT.accent, note: "Cubre BBVA + Liverpool + MSI", icon: CreditCard },
    { key: "ahorro" as const, name: "Ahorro", sugerido: 2500, color: FT.pos, note: "Meta MacBook · $48,000", icon: PiggyBank },
    { key: "fijos" as const, name: "Fijos", sugerido: 950, color: "#8B6CF0", note: "MacBook $1,400 · Internet $500", icon: CalendarDays },
    { key: "libre" as const, name: "Libre", sugerido: 3300, color: FT.warn, note: "Gastos variables · 14 días", icon: WalletCards },
  ];

  useEffect(() => {
    if (!state.ok) return;

    router.refresh();
    onSaved();
  }, [onSaved, router, state.ok]);

  return (
    <form action={formAction} className="flex flex-1 flex-col overflow-hidden app-top">
      <input type="hidden" name="pago" value={vals.pago} />
      <input type="hidden" name="ahorro" value={vals.ahorro} />
      <input type="hidden" name="fijos" value={vals.fijos} />
      <input type="hidden" name="libre" value={vals.libre} />
      <div className="flex items-center justify-between px-4 pb-4">
        <Button type="button" variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}><ArrowLeft size={16} /></Button>
        <div className="text-[14px] text-[#a4adbe]">Paso 2 de 3</div>
        <button type="button" className="text-[13px] font-medium text-[#2A5BFF]">Sugerencia</button>
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
        <div className="mt-1.5 text-[13px] text-[#a4adbe]">¿Cómo lo repartimos hoy?</div>
        {data.income.templates.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {data.income.templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setVals({
                  pago: template.pago,
                  ahorro: template.ahorro,
                  fijos: template.fijos,
                  libre: template.libre,
                })}
                className="shrink-0 rounded-full border border-white/[0.08] bg-[#10141d] px-3 py-2 text-[12px] font-medium text-[#a4adbe]"
              >
                {template.name}
              </button>
            ))}
          </div>
        ) : null}
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
              { value: vals.pago, color: FT.accent },
              { value: vals.ahorro, color: FT.pos },
              { value: vals.fijos, color: "#8B6CF0" },
              { value: vals.libre, color: FT.warn },
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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06080c] from-60% to-transparent px-4 app-bottom-fixed pt-3">
        <Button className="w-full" disabled={diff !== 0 || pending}>
          {pending ? "Confirmando" : "Confirmar distribución"}
        </Button>
      </div>
    </form>
  );
}
