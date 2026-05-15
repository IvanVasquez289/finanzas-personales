"use client";

import { Settings2, TrendingUp, ArrowLeft } from "lucide-react";
import { BigNum } from "@/components/finance/big-num";
import { ProgressBar } from "@/components/finance/progress-bar";
import { Ring } from "@/components/finance/ring";
import { Spark } from "@/components/finance/spark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";

export function GoalScreen({
  data,
  onBack,
  onDistribute,
  onManage,
}: {
  data: FinanceSnapshot;
  onBack: () => void;
  onDistribute: () => void;
  onManage: () => void;
}) {
  const goal = data.goals.ahorro;
  const pct = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthsLeft =
    goal.monthlyDelta > 0 && remaining > 0 ? Math.ceil(remaining / goal.monthlyDelta) : null;

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Meta de ahorro</div>
        <button
          type="button"
          onClick={onManage}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161b25] px-3 py-2 text-[12px] text-[#a4adbe]"
        >
          <Settings2 size={13} />
          Configurar
        </button>
      </div>

      {/* Progress card */}
      <Card className="p-5">
        <div className="flex items-center gap-5">
          <Ring size={88} stroke={8} value={pct} color={pct >= 1 ? FT.pos : FT.accent}>
            <div className="text-center">
              <div className="font-mono text-[16px] font-bold">{Math.round(pct * 100)}%</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">{goal.name}</div>
            <div className="mt-1">
              <BigNum value={goal.currentAmount} size={34} />
            </div>
            <div className="mt-1 text-[12px] text-[#6a7384]">
              de <span className="font-mono text-[#eef2f8]">{money(goal.targetAmount)}</span>
            </div>
            {monthsLeft !== null ? (
              <div className="mt-0.5 text-[11px] text-[#6a7384]">
                ~{monthsLeft} quincena{monthsLeft !== 1 ? "s" : ""} restante{monthsLeft !== 1 ? "s" : ""}
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar
            pct={Math.min(100, pct * 100)}
            color={pct >= 1 ? FT.pos : FT.accent}
            height={6}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-[14px] bg-white/[0.03] px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.06em] text-[#6a7384]">Ahorrado</div>
            <div className="mt-1 font-mono text-[14px] font-semibold text-[#3DD68C]">
              {money(goal.currentAmount)}
            </div>
          </div>
          <div className="rounded-[14px] bg-white/[0.03] px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.06em] text-[#6a7384]">Faltante</div>
            <div className="mt-1 font-mono text-[14px] font-semibold text-[#F5B544]">
              {money(remaining)}
            </div>
          </div>
        </div>
      </Card>

      {/* History spark */}
      {goal.history.length > 1 ? (
        <Card className="p-4">
          <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">
            Progreso histórico
          </div>
          <Spark data={goal.history} />
        </Card>
      ) : null}

      {/* Monthly contribution */}
      {goal.monthlyDelta > 0 ? (
        <Card className="flex items-center gap-3 p-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[#3DD68C]/10 text-[#3DD68C]">
            <TrendingUp size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium">Aporte por quincena</div>
            <div className="mt-0.5 text-[11px] text-[#6a7384]">Último ingreso distribuido</div>
          </div>
          <div className="font-mono text-[15px] font-semibold text-[#3DD68C]">
            +{money(goal.monthlyDelta)}
          </div>
        </Card>
      ) : null}

      {/* Explanation */}
      <div className="rounded-[18px] border border-[#2A5BFF]/20 bg-[#2A5BFF]/[0.06] px-4 py-3.5">
        <div className="text-[13px] font-medium text-[#a4adbe]">¿Cómo incrementa tu meta?</div>
        <p className="mt-1.5 text-[12px] leading-[1.5] text-[#6a7384]">
          Cada quincena que registras, asignas una parte a tu cuenta de ahorro. Eso es lo que
          hace crecer este número.
        </p>
      </div>

      {/* CTA */}
      <Button className="w-full" onClick={onDistribute}>
        Registrar quincena
      </Button>
    </div>
  );
}
