"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { Dot } from "@/components/finance/dot";
import { SectionHeader } from "@/components/finance/section-header";
import { Tag } from "@/components/finance/tag";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { createExpenseAction } from "./actions";

export function ExpenseFormScreen({
  data,
  onCancel,
  onSaved,
}: {
  data: FinanceSnapshot;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("128.40");
  const [merchant, setMerchant] = useState("Uber");
  const [note, setNote] = useState("Didi al aeropuerto, viernes");
  const [cat, setCat] = useState(data.expenseForm.categories[0]?.id ?? "");
  const [method, setMethod] = useState(data.expenseForm.accounts[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(createExpenseAction, {
    ok: false,
    message: "",
  });

  const cats = data.expenseForm.categories;
  const methods = data.expenseForm.accounts;
  const selectedMethod = methods.find((item) => item.id === method);

  useEffect(() => {
    if (!state.ok) return;

    router.refresh();
    onSaved();
  }, [onSaved, router, state.ok]);

  return (
    <form action={formAction} className="flex flex-1 flex-col overflow-hidden pt-[calc(env(safe-area-inset-top)+56px)]">
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="categoryId" value={cat} />
      <input type="hidden" name="accountId" value={method} />
      <div className="flex items-center justify-between px-4 pb-3">
        <button type="button" className="text-[14px] text-[#a4adbe]" onClick={onCancel}>Cancelar</button>
        <div className="text-[15px] font-semibold">Nuevo gasto</div>
        <button className="text-[14px] font-semibold text-[#2A5BFF] disabled:text-[#6a7384]" disabled={pending || !cat || !method}>
          {pending ? "Guardando" : "Guardar"}
        </button>
      </div>
      <div className="px-5 pb-2 pt-6 text-center">
        <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">Monto</div>
        <div className="inline-flex items-baseline justify-center font-mono tabular-nums">
          <span className="mr-1 text-[28px] text-[#6a7384]">−$</span>
          <span className="text-[64px] font-semibold leading-none">{amount.split(".")[0]}</span>
          <span className="text-[32px] font-semibold text-[#a4adbe]">.{amount.split(".")[1] || "00"}</span>
          <span className="ml-1 inline-block h-9 w-0.5 animate-[blink_1s_steps(2)_infinite] bg-[#2A5BFF]" />
        </div>
        <div className="mt-2 text-[12px] text-[#6a7384]">Hoy · {merchant || "Sin comercio"}</div>
      </div>
      <div className="no-scrollbar flex-1 overflow-auto px-4 pb-4">
        <div className="mt-2">
          <SectionHeader title="Comercio" />
          <input
            name="merchant"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#10141d] px-4 text-[15px] text-[#eef2f8] outline-none placeholder:text-[#6a7384] focus:border-[#2A5BFF]/60"
            placeholder="Uber, Bama, Amazon..."
          />
        </div>
        <div className="mt-2">
          <SectionHeader title="Categoría" />
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                type="button"
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
              <button type="button" key={m.id} onClick={() => setMethod(m.id)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${index === methods.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <span className="grid size-[22px] shrink-0 place-items-center rounded-full border" style={{ borderColor: method === m.id ? FT.accent : "rgba(255,255,255,0.10)" }}>
                  {method === m.id ? <span className="size-2.5 rounded-full bg-[#2A5BFF]" /> : null}
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[#6a7384]">{m.sub}</span>
                </span>
                {method === m.id && m.cycleLabel ? <Tag color={FT.accent} bg={FT.accentSoft}>{m.cycleLabel}</Tag> : null}
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
          <input
            name="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1.5 w-full bg-transparent text-[14px] text-[#a4adbe] outline-none placeholder:text-[#6a7384]"
            placeholder="Detalle opcional"
          />
        </Card>
        {state.message ? (
          <div className="mt-3.5 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3 text-[13px]" style={{ color: state.ok ? FT.pos : FT.danger }}>
            {state.message}
          </div>
        ) : null}
        {!selectedMethod ? (
          <div className="mt-3.5 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3 text-[13px] text-[#a4adbe]">
            No hay cuentas disponibles para guardar gastos.
          </div>
        ) : null}
      </div>
      <Keypad value={amount} setValue={setAmount} />
    </form>
  );
}

function Keypad({ value, setValue }: { value: string; setValue: (value: string) => void }) {
  const keys = useMemo(() => [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], [".", "0", "del"]], []);
  const press = (key: string) => {
    if (key === "del") return setValue(value.length > 1 ? value.slice(0, -1) : "0");
    if (key === ".") return setValue(value.includes(".") ? value : `${value}.`);
    if (value.includes(".") && value.split(".")[1]?.length >= 2) return;
    if (value.replace(".", "").length >= 8) return;
    setValue(value === "0" ? key : `${value}${key}`);
  };

  return (
    <div className="border-t border-white/[0.06] bg-gradient-to-t from-[#0b0e14] to-[#0b0e14d9] px-3 pb-[calc(env(safe-area-inset-bottom)+86px)] pt-2">
      <div className="flex flex-col gap-1.5">
        {keys.map((row) => (
          <div key={row.join("")} className="flex gap-1.5">
            {row.map((key) => (
              <button type="button" key={key} onClick={() => press(key)} className="flex h-[46px] flex-1 items-center justify-center rounded-xl border border-white/[0.06] bg-[#161b25] font-mono text-[22px] font-medium">
                {key === "del" ? <ReceiptText size={20} className="text-[#a4adbe]" /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
