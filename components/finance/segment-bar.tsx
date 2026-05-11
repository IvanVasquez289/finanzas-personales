export function SegmentBar({
  segments,
  height = 8,
}: {
  segments: { value: number; color: string }[];
  height?: number;
}) {
  return (
    <div className="flex w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.04]" style={{ height }}>
      {segments.map((segment, index) => (
        <div key={index} className="h-full" style={{ flex: segment.value, background: segment.color }} />
      ))}
    </div>
  );
}
