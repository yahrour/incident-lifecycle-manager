import type { ReactNode } from "react";
import { cn } from "cn";
import { TableCell } from "@/components/ui/table";

// className sets the background and text colour of the whole cell
export function SeverityCell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <TableCell className={cn("text-xs text-center capitalize", className)}>
      {children}
    </TableCell>
  );
}
