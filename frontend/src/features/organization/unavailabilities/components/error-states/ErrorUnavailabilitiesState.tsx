import { UsersIcon } from "lucide-react";

export function ErrorUnavailabilitiesState() {
  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <UsersIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">Unable to load unavailabilities</h3>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading the team's unavailabilities.
        </p>
      </div>
    </div>
  );
}
