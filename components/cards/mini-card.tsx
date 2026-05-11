import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/finance/progress-bar";
import { money } from "@/lib/money";
import { FT } from "@/lib/finance-tokens";

export function MiniCard({
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
  const pct = budget > 0 ? used / budget : 0;
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
