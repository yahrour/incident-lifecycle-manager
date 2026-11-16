import { CircleCheck, CircleX } from "lucide-react";
import type { Status } from "../types";

const statusIcon = {
  up: <CircleCheck className="size-4 text-success" />,
  down: <CircleX className="size-4 text-destructive" />,
};

export function StatusRow({ name, status }: { name: string; status: Status }) {
  return (
    <div className="border-b last:border-b-0 flex items-center gap-3 p-4 text-sm font-medium hover:bg-muted/50">
      {statusIcon[status]}
      <span className="flex-1">{name}</span>
      <span className="text-xs font-normal text-muted-foreground capitalize">
        {status}
      </span>
    </div>
  );
}
