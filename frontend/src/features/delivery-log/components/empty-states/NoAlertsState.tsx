import { Send } from "lucide-react";

export function NoAlertsState() {
  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <Send className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">No alerts delivered</h3>
        <p className="text-sm text-muted-foreground">
          Alerts sent to the ingestion endpoint will show up here.
        </p>
      </div>
    </div>
  );
}
