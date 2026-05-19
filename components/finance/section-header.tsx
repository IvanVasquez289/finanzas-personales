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
        <button
          type="button"
          onClick={onAction}
          className="min-h-8 rounded-full border border-white/[0.08] bg-[#161b25] px-3 text-[12px] font-semibold text-[#2A5BFF] disabled:opacity-60"
          disabled={!onAction}
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
