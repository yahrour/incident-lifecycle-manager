import { Button } from "@/components/ui/button";
import { TriangleAlertIcon } from "lucide-react";

export function ErrorUnavailabilitiesState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <TriangleAlertIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">Unable to load unavailabilities</h3>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading your unavailabilities.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
