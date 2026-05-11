import { FT } from "@/lib/finance-tokens";

export function ProgressBar({
  pct,
  color = FT.accent,
  height = 6,
}: {
  pct: number;
  color?: string;
  height?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/[0.06]" style={{ height }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}
