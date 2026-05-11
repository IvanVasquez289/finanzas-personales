export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between px-1 pb-2.5">
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6a7384]">{title}</div>
      {action ? <div className="text-[13px] text-[#2A5BFF]">{action}</div> : null}
    </div>
  );
}
