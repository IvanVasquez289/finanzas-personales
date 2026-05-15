export function PageHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="app-top flex items-end justify-between px-5 pb-4">
      <div>
        {eyebrow ? (
          <div className="mb-1 flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">
            <span>{eyebrow}</span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] tracking-normal text-[#a4adbe]">
              v1.0.5
            </span>
          </div>
        ) : null}
        <h1 className="text-[28px] font-semibold leading-[1.1] text-[#eef2f8]">{title}</h1>
      </div>
      {right}
    </header>
  );
}
