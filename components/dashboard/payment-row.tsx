import { Tag } from "@/components/finance/tag";
import { money } from "@/lib/money";
import { FT } from "@/lib/finance-tokens";

export function PaymentRow({
  label,
  sub,
  date,
  amount,
  chip,
  chipColor,
  muted,
  last,
}: {
  label: string;
  sub: string;
  date: string;
  amount: number;
  chip: string;
  chipColor?: string;
  muted?: boolean;
  last?: boolean;
}) {
  const [day, month = ""] = date.split(" ");

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="grid size-[38px] shrink-0 place-items-center rounded-[10px] border border-white/[0.06] bg-[#161b25]">
        <div className="text-center font-mono text-[11px] leading-none text-[#a4adbe]">
          <div className="mb-0.5 text-[9px] uppercase text-[#6a7384]">{month}</div>
          <div className="font-semibold text-[#eef2f8]">{day}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-[14px] font-medium ${muted ? "text-[#a4adbe]" : "text-[#eef2f8]"}`}>{label}</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Tag color={chipColor || FT.textDim} bg={chipColor ? `${chipColor}22` : "rgba(255,255,255,0.05)"}>
            {chip}
          </Tag>
          <span className="truncate text-[11px] text-[#6a7384]">{sub}</span>
        </div>
      </div>
      <div className={`font-mono text-[15px] font-semibold tabular-nums ${muted ? "text-[#a4adbe]" : "text-[#eef2f8]"}`}>
        {money(amount)}
      </div>
    </div>
  );
}
