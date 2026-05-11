export function BigNum({ value, size = 44 }: { value: number; size?: number }) {
  const [intPart, decPart] = Math.abs(value).toFixed(2).split(".");

  return (
    <div className="inline-flex items-baseline font-mono font-semibold leading-none tabular-nums text-[#eef2f8]">
      <span className="mr-0.5 text-[#6a7384]" style={{ fontSize: size * 0.55 }}>
        $
      </span>
      <span style={{ fontSize: size }}>{Number(intPart).toLocaleString("en-US")}</span>
      <span className="ml-0.5 text-[#6a7384]" style={{ fontSize: size * 0.5 }}>
        .{decPart}
      </span>
    </div>
  );
}
