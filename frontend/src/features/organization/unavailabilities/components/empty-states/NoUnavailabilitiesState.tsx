import type { UnavailabilityFilter } from "@/types";
import { CalendarOffIcon } from "lucide-react";

export function NoUnavailabilitiesState({
  filter,
}: {
  filter: UnavailabilityFilter;
}) {
  const isFiltered = filter !== "all";

  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <CalendarOffIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">
          {isFiltered
            ? `No ${filter} unavailabilities`
            : "No unavailability recorded"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isFiltered
            ? `No engineer on this team has ${filter} unavailabilities. Try another filter.`
            : "Everyone on this team is available for on-call. Unavailabilities will appear here when engineers request time off from the rotation."}
        </p>
      </div>
    </div>
  );
}
