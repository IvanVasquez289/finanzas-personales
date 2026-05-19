"use client";

import { Landmark, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EnvelopeCard } from "@/components/accounts/envelope-card";
import { EnvelopeDonut } from "@/components/accounts/envelope-donut";
import { BigNum } from "@/components/finance/big-num";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { money } from "@/lib/money";

export function EnvelopesScreen({
  data,
  onManage,
  onReorder,
}: {
  data: FinanceSnapshot;
  onManage: () => void;
  onReorder: () => void;
}) {
  const envelopeTotal = data.envelopes.reduce((a, s) => a + s.balance, 0);
  const realTotal = data.bankAccounts.reduce((a, c) => a + c.balance, 0);
  const legendItems = [
    ...data.envelopes.slice(0, 3).map((envelope) => ({
      color: envelope.color,
      label: envelope.name,
      value: envelope.balance,
    })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Patrimonio"
        title="Tus sobres"
        right={<Button variant="secondary" size="icon" aria-label="Gestionar cuentas y sobres" onClick={onManage}><Plus size={18} /></Button>}
      />
      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto px-4 app-bottom-scroll">
        <Card className="p-[18px]">
          <div className="flex items-center gap-4">
            <EnvelopeDonut data={data} />
            <div className="flex-1">
              <div className="text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">Reservado en sobres</div>
              <div className="mt-1">
                <BigNum value={envelopeTotal} size={28} />
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {legendItems.length > 0 ? (
                  legendItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="min-w-0 truncate text-[#6a7384]">
                        <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-mono text-[#a4adbe]">{money(item.value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-[#6a7384]">Sin sobres configurados.</div>
                )}
              </div>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-[0.06em] text-[#6a7384]">Cuentas reales</div>
            <div className="mt-1 font-mono text-[16px] font-semibold">{money(realTotal)}</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-[0.06em] text-[#6a7384]">Sobres</div>
            <div className="mt-1 font-mono text-[16px] font-semibold">{money(envelopeTotal)}</div>
          </Card>
        </div>
        <div>
          <SectionHeader title="Sobres" action="Reordenar →" onAction={onReorder} />
          <div className="flex flex-col gap-2.5">
            {data.envelopes.map((envelope) => (
              <EnvelopeCard key={envelope.name} {...envelope} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Cuentas bancarias" action="+ Agregar" onAction={onManage} />
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
              <div className="text-[13px] font-medium">Define tus propios sobres antes de gastar.</div>
              <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">
                Las cuentas reales dicen dónde está el dinero. Los sobres dicen para qué está reservado.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
