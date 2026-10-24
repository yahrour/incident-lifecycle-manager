import type { ReactNode } from "react";
import { cn } from "cn";

const colors = {
  default: "",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function StatusDot({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: keyof typeof colors;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs capitalize",
        colors[variant],
        className
      )}
    >
      <span className="size-2 rounded-full bg-current" />
      {children}
    </span>
  );
}
