import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InlineErrorStateProps = {
  message?: string;
  onRetry: () => void;
  className?: string;
};

export function InlineErrorState({
  message = "Something went wrong.",
  onRetry,
  className,
}: InlineErrorStateProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-white p-4 text-sm text-muted-foreground rounded-lg",
        className
      )}
    >
      {message}
      <Button
        variant="link"
        onClick={onRetry}
        className="text-secondary hover:underline"
      >
        Try again
      </Button>
    </div>
  );
}
