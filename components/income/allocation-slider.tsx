import { Card } from "@/components/ui/card";
import { money } from "@/lib/money";
import { FT } from "@/lib/finance-tokens";

export function AllocationSlider({
  name,
  note,
  color,
  icon: Icon,
  value,
  sugerido,
  ingreso,
  onChange,
}: {
  name: string;
  note: string;
  color: string;
  icon: React.ElementType;
  value: number;
  sugerido: number;
  ingreso: number;
  onChange: (value: number) => void;
}) {
  const pct = ingreso > 0 ? (value / ingreso) * 100 : 0;
  const isSuggested = Math.abs(value - sugerido) < 50;

  return (
    <Card className="p-3.5">
      <div className="mb-2.5 flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-[10px] border" style={{ background: `${color}1f`, borderColor: `${color}40`, color }}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{name}</div>
          <div className="mt-0.5 truncate text-[11px] text-[#6a7384]">{note}</div>
        </div>
        <div className="text-right">
          <input
            aria-label={`Monto para ${name}`}
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-9 w-[112px] rounded-xl border border-white/[0.08] bg-[#0c1018] px-2 text-right font-mono text-[16px] font-semibold text-[#eef2f8] outline-none focus:border-[#2A5BFF]/60"
          />
          <div className="mt-0.5 text-[10px]" style={{ color: isSuggested ? FT.pos : FT.textMute }}>
            {isSuggested ? "✓ sugerido" : `sugerido ${money(sugerido)}`}
          </div>
        </div>
      </div>
      <input
        aria-label={`Asignación para ${name}`}
        type="range"
        min={0}
        max={Math.max(ingreso, value, 0)}
        step={50}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#2A5BFF]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-[#444c5b]">
        <span>$0</span>
        <span className="font-mono text-[#6a7384]">{pct.toFixed(0)}% de la quincena</span>
        <span>{money(ingreso)}</span>
      </div>
    </Card>
  );
}
