import { CalendarOffIcon } from "lucide-react";

export function NoUnavailabilitiesState() {
  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <CalendarOffIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">No unavailability recorded</h3>
        <p className="text-sm text-muted-foreground">
          You're available for on-call on this team. Request time off when you
          need to be skipped in the rotation.
        </p>
      </div>
    </div>
  );
}
