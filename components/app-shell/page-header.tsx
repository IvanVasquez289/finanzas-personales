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
          </div>
        ) : null}
        <h1 className="text-[28px] font-semibold leading-[1.1] text-[#eef2f8]">{title}</h1>
      </div>
      {right}
    </header>
  );
}
