import { money } from "@/lib/money";
import { FT } from "@/lib/finance-tokens";

export function TransactionRow({
  merchant,
  cat,
  account,
  budgetAccount,
  amount,
  date,
  income,
  last,
}: {
  merchant: string;
  cat: string;
  account: string;
  budgetAccount?: string;
  amount: number;
  date: string;
  income?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div
        className="grid size-8 place-items-center rounded-full text-[13px] font-semibold"
        style={{ background: income ? FT.posSoft : "rgba(255,255,255,0.05)", color: income ? FT.pos : FT.textDim }}
      >
        {merchant[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium">{merchant}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6a7384]">
          {cat} · {budgetAccount ? `${budgetAccount} · ` : ""}{account} · {date}
        </div>
      </div>
      <div className="font-mono text-[14px] font-semibold tabular-nums" style={{ color: income ? FT.pos : FT.text }}>
        {income ? "+" : "−"}
        {money(Math.abs(amount), amount % 1 ? 2 : 0)}
      </div>
    </div>
  );
}
