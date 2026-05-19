import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";

export function EnvelopeDonut({ data }: { data: FinanceSnapshot }) {
  const items = data.envelopes.length > 0 ? data.envelopes : data.bankAccounts.map((account) => ({ ...account, color: FT.textDim }));
  const total = items.reduce((a, s) => a + s.balance, 0) || 1;
  const size = 116;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative size-[116px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {items.map((item) => {
          const len = (item.balance / total) * C;
          const element = (
            <circle
              key={item.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - 2)} ${C}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[9px] uppercase tracking-[0.06em] text-[#6a7384]">Sobres</div>
    </div>
  );
}
