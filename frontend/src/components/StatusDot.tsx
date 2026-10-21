import type { ReactNode } from "react";
import { cn } from "cn";

// className sets the colour, the dot follows it via bg-current
export function StatusDot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs capitalize",
        className
      )}
    >
      <span className="size-2 rounded-full bg-current" />
      {children}
    </span>
  );
}
