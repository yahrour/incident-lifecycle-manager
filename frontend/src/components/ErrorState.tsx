import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  onRetry,
  title = "Something went wrong",
  description = "We couldn't load this. Please try again.",
  className,
}: {
  onRetry: () => void;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center",
        className
      )}
    >
      <TriangleAlertIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
