export function PageHeader({
  eyebrow,
  title,
  right,
  version = "V2.0.0",
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
  version?: string;
}) {
  return (
    <header className="app-top flex items-end justify-between gap-3 px-5 pb-5">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 flex min-w-0 items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[#6a7384]">
            <span className="min-w-0 truncate">{eyebrow}</span>
            <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-[#a4adbe]">
              {version}
            </span>
          </div>
        ) : null}
        <h1 className="text-[clamp(25px,7vw,32px)] font-semibold leading-[1.08] text-[#eef2f8]">{title}</h1>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}
