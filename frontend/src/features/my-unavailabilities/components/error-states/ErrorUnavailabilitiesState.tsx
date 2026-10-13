import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorUnavailabilitiesState({
  onRetry,
  description = "Something went wrong while loading your unavailabilities.",
}: {
  onRetry: () => void;
  description?: string;
}) {
  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <TriangleAlertIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">Unable to load unavailabilities</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
