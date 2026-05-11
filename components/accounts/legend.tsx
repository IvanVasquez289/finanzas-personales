import { Dot } from "@/components/finance/dot";
import { money } from "@/lib/money";

export function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <div className="flex items-center gap-1.5 text-[#a4adbe]">
        <Dot color={color} />
        <span>{label}</span>
      </div>
      <span className="font-mono tabular-nums">{money(value)}</span>
    </div>
  );
}
