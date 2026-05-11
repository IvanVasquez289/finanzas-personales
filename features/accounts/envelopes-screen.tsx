"use client";

import { Landmark, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EnvelopeCard } from "@/components/accounts/envelope-card";
import { EnvelopeDonut } from "@/components/accounts/envelope-donut";
import { Legend } from "@/components/accounts/legend";
import { BigNum } from "@/components/finance/big-num";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";

export function EnvelopesScreen({ data }: { data: FinanceSnapshot }) {
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
        eyebrow="Patrimonio"
        title="Tus sobres"
        right={<Button variant="secondary" size="icon" aria-label="Agregar sobre"><Plus size={18} /></Button>}
      />
      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto px-4 pb-32">
        <Card className="p-[18px]">
          <div className="flex items-center gap-4">
            <EnvelopeDonut data={data} />
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
