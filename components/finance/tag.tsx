import { FT } from "@/lib/finance-tokens";

export function Tag({
  children,
  color = FT.textDim,
  bg = "rgba(255,255,255,0.06)",
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}
