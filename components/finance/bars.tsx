import { ProgressBar } from "@/components/finance/progress-bar";
import { money } from "@/lib/money";

export function Bars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[13px]">{item.label}</span>
            <span className="font-mono text-[12px] tabular-nums text-[#a4adbe]">{money(item.value)}</span>
          </div>
          <ProgressBar pct={(item.value / max) * 100} color={item.color} height={5} />
        </div>
      ))}
    </div>
  );
}
