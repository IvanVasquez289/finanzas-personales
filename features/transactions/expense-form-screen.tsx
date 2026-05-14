"use client";

import type React from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Banknote, CreditCard, Delete, ReceiptText, Search, Wallet } from "lucide-react";
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
  const today = new Date();
  const currentDate = today.toISOString().slice(0, 10);
  const currentTime = today.toTimeString().slice(0, 5);
  const form = useForm({
    defaultValues: {
      amount: "0",
      merchant: "",
      note: "",
      categoryId: data.expenseForm.categories[0]?.id ?? "",
      accountId: data.expenseForm.accounts[0]?.id ?? "",
      date: currentDate,
      time: currentTime,
      isInstallment: false,
      installments: 3,
    },
  });
  const [state, formAction, pending] = useActionState(createExpenseAction, {
    ok: false,
    message: "",
  });
  const [methodType, setMethodType] = useState<"all" | "credit_card" | "debit" | "cash">("all");

  const amount = form.watch("amount");
  const merchant = form.watch("merchant");
  const cat = form.watch("categoryId");
  const method = form.watch("accountId");
  const isInstallment = form.watch("isInstallment");
  const cats = data.expenseForm.categories;
  const methods = data.expenseForm.accounts;
  const filteredMethods = methods.filter((item) => methodType === "all" || item.paymentMethod === methodType);
  const selectedMethod = methods.find((item) => item.id === method);
  const merchantSuggestion = useMemo(() => suggestCategory(merchant, cats), [cats, merchant]);
  const recentMerchants = useMemo(() => {
    const seen = new Set<string>();
    return data.movementDetail
      .filter((transaction) => transaction.direction === "expense" && transaction.source !== "system")
      .map((transaction) => transaction.merchant)
      .filter((item) => {
        const key = item.toLowerCase();
        if (key === "saldo inicial") return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [data.movementDetail]);

  useEffect(() => {
    if (!state.ok) return;

    const timer = window.setTimeout(() => {
      router.refresh();
      onSaved();
    }, 850);

    return () => window.clearTimeout(timer);
  }, [onSaved, router, state.ok]);

  useEffect(() => {
    if (filteredMethods.some((item) => item.id === method)) return;
    form.setValue("accountId", filteredMethods[0]?.id ?? "");
  }, [filteredMethods, form, method]);

  useEffect(() => {
    if (!merchantSuggestion || cat === merchantSuggestion.id) return;
    form.setValue("categoryId", merchantSuggestion.id);
  }, [cat, form, merchantSuggestion]);

  return (
    <form action={formAction} className="flex flex-1 flex-col overflow-hidden bg-[#06080c] app-top">
      <input type="hidden" name="amount" value={amount} readOnly />
      <input type="hidden" name="categoryId" value={cat} readOnly />
      <input type="hidden" name="accountId" value={method} readOnly />
      <input type="hidden" name="isInstallment" value={isInstallment ? "true" : "false"} readOnly />
      <div className="flex items-center justify-between px-4 pb-2">
        <button type="button" className="text-[14px] text-[#a4adbe]" onClick={onCancel}>Cancelar</button>
        <div className="text-[15px] font-semibold">Nuevo gasto</div>
        <button className="text-[14px] font-semibold text-[#2A5BFF] disabled:text-[#6a7384]" disabled={pending || !cat || !method}>
          {pending ? "Guardando" : "Guardar"}
        </button>
      </div>
      <div className="z-10 border-b border-white/[0.06] bg-[#06080c] px-5 pb-3 pt-2 text-center">
        <div className="mb-1 text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">Importe del gasto</div>
        <div className="inline-flex items-baseline justify-center font-mono tabular-nums">
          <span className="mr-1 text-[24px] text-[#6a7384]">$</span>
          <span className="text-[52px] font-semibold leading-none">{amount.split(".")[0]}</span>
          <span className="text-[28px] font-semibold text-[#a4adbe]">.{amount.split(".")[1] || "00"}</span>
          <span className="ml-1 inline-block h-8 w-0.5 animate-[blink_1s_steps(2)_infinite] bg-[#2A5BFF]" />
        </div>
        <div className="mt-1.5 text-[12px] text-[#6a7384]">Hoy · {merchant || "Sin comercio"}</div>
      </div>
      <div className="no-scrollbar flex-1 overflow-auto px-4 pb-[238px] pt-4">
        <div>
          <SectionHeader title="Comercio" />
          <label className="flex h-[54px] items-center gap-3 rounded-[18px] border border-white/[0.08] bg-[#10141d] px-4 text-[#a4adbe] focus-within:border-[#2A5BFF]/60">
            <Search size={16} />
            <input
              {...form.register("merchant", { required: true })}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#eef2f8] outline-none placeholder:text-[#6a7384]"
              placeholder="Uber, Bama, Amazon..."
            />
          </label>
          {recentMerchants.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {recentMerchants.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => form.setValue("merchant", item)}
                  className="shrink-0 rounded-full border border-white/[0.08] bg-[#10141d] px-3.5 py-2 text-[12px] text-[#a4adbe]"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-5">
          <SectionHeader title={merchantSuggestion ? `Categoría · regla: ${merchantSuggestion.label}` : "Categoría"} />
          {cats.length === 0 ? (
            <div className="rounded-2xl border border-[#2A5BFF2e] bg-[#2A5BFF0f] px-3.5 py-3 text-[13px] text-[#a4adbe]">
              Crea categorías desde <span className="font-semibold text-[#2A5BFF]">Setup → Configuración</span> para poder guardar gastos.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {cats.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => form.setValue("categoryId", c.id)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium"
                  style={{ background: cat === c.id ? `${c.color}22` : FT.surface, borderColor: cat === c.id ? `${c.color}55` : FT.hairline, color: cat === c.id ? c.color : FT.textDim }}
                >
                  <Dot color={c.color} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-5">
          <SectionHeader title="Método de pago" />
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <MethodButton icon={Wallet} label="Todos" active={methodType === "all"} onClick={() => setMethodType("all")} />
            <MethodButton icon={CreditCard} label="Crédito" active={methodType === "credit_card"} onClick={() => setMethodType("credit_card")} />
            <MethodButton icon={Banknote} label="Débito" active={methodType === "debit"} onClick={() => setMethodType("debit")} />
            <MethodButton icon={ReceiptText} label="Cash" active={methodType === "cash"} onClick={() => setMethodType("cash")} />
          </div>
          <SectionHeader title="Cargar a" />
          <Card className="max-h-[172px] overflow-auto">
            {filteredMethods.map((m, index) => (
              <button type="button" key={m.id} onClick={() => form.setValue("accountId", m.id)} className={`flex w-full items-start gap-3 px-4 py-4 text-left ${index === filteredMethods.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <span className="grid size-[22px] shrink-0 place-items-center rounded-full border" style={{ borderColor: method === m.id ? FT.accent : "rgba(255,255,255,0.10)" }}>
                  {method === m.id ? <span className="size-2.5 rounded-full bg-[#2A5BFF]" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[#6a7384]">{m.sub}</span>
                </span>
                {method === m.id && m.cycleLabel ? (
                  <span className="max-w-[132px] shrink-0 truncate">
                    <Tag color={FT.accent} bg={FT.accentSoft}>{m.cycleLabel}</Tag>
                  </span>
                ) : null}
              </button>
            ))}
            {filteredMethods.length === 0 ? (
              <div className="px-4 py-5 text-center text-[13px] text-[#6a7384]">
                {methods.length === 0
                  ? "Crea cuentas o sobres desde Setup → Configuración."
                  : "No hay cuentas para este método."}
              </div>
            ) : null}
          </Card>
        </div>
        <Card className="mt-5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium">¿Meses sin intereses?</div>
              <div className="mt-0.5 text-[11px] text-[#6a7384]">Divide el monto en parcialidades del ciclo</div>
            </div>
            <button
              type="button"
              onClick={() => form.setValue("isInstallment", !isInstallment)}
              className={`flex h-6 w-[42px] items-center rounded-full p-0.5 ${isInstallment ? "justify-end bg-[#2A5BFF]" : "justify-start bg-[#1d2330]"}`}
            >
              <span className="size-5 rounded-full bg-white" />
            </button>
          </div>
          {isInstallment ? (
            <div className="mt-3 grid grid-cols-[1fr_96px] items-center gap-3">
              <label className="text-[12px] text-[#a4adbe]" htmlFor="installments">
                Parcialidades
              </label>
              <input
                id="installments"
                type="number"
                min={2}
                max={24}
                {...form.register("installments", { valueAsNumber: true })}
                className="h-11 rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-right font-mono text-[14px] outline-none focus:border-[#2A5BFF]/60"
              />
            </div>
          ) : null}
        </Card>
        <Card className="mt-5 p-4">
          <div className="grid grid-cols-1 gap-4">
            <label className="text-[12px] text-[#6a7384]">
              Fecha
              <input
                type="date"
                {...form.register("date", { required: true })}
                className="mt-1.5 block h-12 w-full min-w-0 rounded-[16px] border border-white/[0.08] bg-[#10141d] px-4 text-[15px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
              />
            </label>
            <label className="text-[12px] text-[#6a7384]">
              Hora
              <input
                type="time"
                {...form.register("time", { required: true })}
                className="mt-1.5 block h-12 w-full min-w-0 rounded-[16px] border border-white/[0.08] bg-[#10141d] px-4 text-[15px] text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
              />
            </label>
          </div>
        </Card>
        <Card className="mt-5 p-4">
          <div className="text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">Nota</div>
          <input
            {...form.register("note")}
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
      <Keypad value={amount} setValue={(value) => form.setValue("amount", value)} />
    </form>
  );
}

function MethodButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[54px] flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] font-medium"
      style={{
        background: active ? FT.accentSoft : "rgba(255,255,255,0.04)",
        borderColor: active ? "rgba(42,91,255,0.45)" : "rgba(255,255,255,0.08)",
        color: active ? FT.accent : FT.textDim,
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function suggestCategory(
  merchant: string,
  categories: FinanceSnapshot["expenseForm"]["categories"],
) {
  const value = merchant.toLowerCase();
  if (!value.trim()) return null;

  const rules = [
    { terms: ["uber", "didi", "taxi"], category: "transporte" },
    { terms: ["oxxo", "bama", "starbucks", "rest", "cafe"], category: "comida" },
    { terms: ["amazon", "mercado", "liverpool"], category: "libre" },
    { terms: ["netflix", "spotify", "openai", "github"], category: "tools" },
    { terms: ["msi", "meses"], category: "msi" },
  ];
  const match = rules.find((rule) => rule.terms.some((term) => value.includes(term)));
  if (!match) return null;

  return categories.find((category) => category.label.toLowerCase().includes(match.category)) ?? null;
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
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] border-t border-white/[0.06] bg-[#090c13]/96 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 shadow-[0_-18px_38px_rgba(0,0,0,0.48)] backdrop-blur-xl md:absolute">
      <div className="flex flex-col gap-1.5">
        {keys.map((row) => (
          <div key={row.join("")} className="flex gap-1.5">
            {row.map((key) => (
              <button type="button" key={key} onClick={() => press(key)} className="flex h-[42px] flex-1 items-center justify-center rounded-xl border border-white/[0.06] bg-[#161b25] font-mono text-[21px] font-medium active:bg-[#202737]">
                {key === "del" ? <Delete size={20} className="text-[#a4adbe]" /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
