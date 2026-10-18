import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MyTeam } from "../../types";

export function UpcomingShiftsCard({
  teamUpcomingRotations,
}: Pick<MyTeam, "teamUpcomingRotations">) {
  return (
    <div className="flex-1 rounded-lg border border-border/50 bg-white">
      <h2 className="border-b border-border/50 px-4 py-3 text-sm font-medium text-[#2a2320]">
        Upcoming rotations
      </h2>

      <div className="px-4 py-3">
        {teamUpcomingRotations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No upcoming rotations scheduled.
          </p>
        ) : (
          <ul className="space-y-3">
            {teamUpcomingRotations.map((rotation, index) => (
              <li
                key={rotation.shift.startDate}
                className="flex items-center gap-2"
              >
                <span className="w-4 text-center text-xs tabular-nums text-[#8a8178]">
                  {index + 1}
                </span>

                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px] font-medium">
                    {rotation.user.firstName[0]}
                    {rotation.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {rotation.user.firstName} {rotation.user.lastName}
                  </p>
                  {rotation.user.specialty && (
                    <p className="truncate text-xs text-[#8a8178]">
                      {rotation.user.specialty}
                    </p>
                  )}
                </div>

                <p className="shrink-0 text-right text-xs tabular-nums text-[#8a8178]">
                  {format(rotation.shift.startDate, "MMM d")} -{" "}
                  {format(rotation.shift.endDate, "MMM d")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
