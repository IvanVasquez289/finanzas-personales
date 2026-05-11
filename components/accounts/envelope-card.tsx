import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/finance/progress-bar";
import { money } from "@/lib/money";

export function EnvelopeCard({
  name,
  balance,
  color,
  note,
  goal,
  locked,
}: {
  name: string;
  balance: number;
  color: string;
  note: string;
  goal?: number;
  locked?: boolean;
}) {
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
      {goal ? (
        <div className="mt-2.5">
          <ProgressBar pct={pct * 100} color={color} height={4} />
        </div>
      ) : null}
    </Card>
  );
}
