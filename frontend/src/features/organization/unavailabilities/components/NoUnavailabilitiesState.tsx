import { UsersIcon } from "lucide-react";

export function NoUnavailabilitiesState() {
  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <UsersIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">No unavailability recorded</h3>
        <p className="text-sm text-muted-foreground">
          Everyone on this team is currently available.
        </p>
      </div>
    </div>
  );
}
