export function StatBlock({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="flex-1 flex flex-col justify-center px-5 py-4">
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase mb-1">
        {title}
      </span>
      <span className="text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}
