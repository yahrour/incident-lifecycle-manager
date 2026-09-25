import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function StatBlock({
  title,
  value,
}: {
  title: string;
  value: string | string[] | number;
}) {
  return (
    <div className="flex-1 flex flex-col justify-center px-5 py-4">
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase mb-1">
        {title}
      </span>
      <span className="text-xl font-bold text-foreground">
        {Array.isArray(value) ? <StatBlockList value={value} /> : value}
      </span>
    </div>
  );
}

const MAX_VISIBLE_VALUES = 2;
function StatBlockList({ value }: { value: string[] }) {
  const visible = value.slice(0, MAX_VISIBLE_VALUES);
  const hiddenCount = value.length - visible.length;

  if (hiddenCount <= 0) {
    return <>{visible.join(" • ")}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className="cursor-default">
          {visible.join(" • ")}{" "}
          <span className="text-muted-foreground text-base">
            +{hiddenCount}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{value.join(", ")}</TooltipContent>
    </Tooltip>
  );
}
