"use client";

import { useActionState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { money } from "@/lib/money";
import { initialSettingsState, reorderAccountAction } from "@/features/settings/actions";

export function ReorderEnvelopesScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const [state, action, pending] = useActionState(reorderAccountAction, initialSettingsState);

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Reordenar</div>
        <div className="size-10" />
      </div>

      <div>
        <SectionHeader title="Sobres" />
        <Card className="overflow-hidden">
          {data.envelopes.map((envelope, index) => (
            <div key={envelope.id} className={`flex items-center gap-3 px-4 py-3.5 ${index === data.envelopes.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
              <div className="grid size-8 place-items-center rounded-xl font-mono text-[12px] font-semibold" style={{ background: `${envelope.color}22`, color: envelope.color }}>
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{envelope.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-[#6a7384]">{money(envelope.balance)}</div>
              </div>
              <form action={action} className="flex gap-1">
                <input type="hidden" name="id" value={envelope.id} />
                <button name="direction" value="up" disabled={pending || index === 0} className="grid size-8 place-items-center rounded-full border border-white/10 text-[#a4adbe] disabled:opacity-30" aria-label="Subir">
                  <ArrowUp size={14} />
                </button>
                <button name="direction" value="down" disabled={pending || index === data.envelopes.length - 1} className="grid size-8 place-items-center rounded-full border border-white/10 text-[#a4adbe] disabled:opacity-30" aria-label="Bajar">
                  <ArrowDown size={14} />
                </button>
              </form>
            </div>
          ))}
        </Card>
        {state.message ? (
          <div className="mt-2 text-[12px]" style={{ color: state.ok ? "#3DD68C" : "#F46A6A" }}>
            {state.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
