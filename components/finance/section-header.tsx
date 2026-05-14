export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 pb-2.5">
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6a7384]">{title}</div>
      {action ? (
        <button type="button" onClick={onAction} className="text-[13px] text-[#2A5BFF] disabled:opacity-60" disabled={!onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}
