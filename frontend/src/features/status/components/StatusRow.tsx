import { CircleCheck, CircleHelp, CircleX } from "lucide-react";
import type { Status } from "../types";

const statusIcon = {
  operational: <CircleCheck className="size-4 text-success" />,
  outage: <CircleX className="size-4 text-destructive" />,
  unknown: <CircleHelp className="size-4 text-muted-foreground" />,
};

const statusLabel = {
  operational: "Operational",
  outage: "Outage",
  unknown: "Unknown",
};

export function StatusRow({ name, status }: { name: string; status: Status }) {
  return (
    <div className="border-b last:border-b-0 flex items-center gap-3 p-4 text-sm font-medium hover:bg-muted/50">
      {statusIcon[status]}
      <span className="flex-1">{name}</span>
      <span className="text-xs font-normal text-muted-foreground">
        {statusLabel[status]}
      </span>
    </div>
  );
}
