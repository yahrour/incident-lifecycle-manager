import type { ReactNode } from "react";
import { cn } from "cn";

export function Page({
  header,
  children,
  className,
  contentClassName,
}: {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        {header}
      </div>
      <div className={cn("p-4 m-0 space-y-4", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
