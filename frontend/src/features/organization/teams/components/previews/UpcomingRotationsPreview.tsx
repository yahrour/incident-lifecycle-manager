import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchUpcomingRotations } from "../../api/teams";
import { Link } from "react-router";
import type { UpcomingRotation } from "../../types";
import { format } from "date-fns";
import { teamKeys } from "@/features/organization/shared/constants";
import { InlineErrorState } from "@/components/InlineErrorState";

export function UpcomingRotationsPreview({ teamId }: { teamId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: teamKeys.upcomingRotations(teamId),
    queryFn: () => fetchUpcomingRotations(teamId),
  });

  const upcomingRotations = data?.data ?? [];

  return (
    <div className="flex-1 rounded-lg border border-border/50 bg-white">
      <h2 className="border-b border-border/50 px-4 py-3 text-sm font-medium text-[#2a2320]">
        Upcoming rotations
      </h2>

      <div className="px-4 py-3">
        {isPending ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-[#f1ece4]"
              />
            ))}
          </div>
        ) : isError ? (
          <InlineErrorState
            message="Couldn't load upcoming rotations"
            onRetry={() => void refetch()}
          />
        ) : !upcomingRotations || upcomingRotations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No upcoming rotations scheduled.
          </p>
        ) : (
          <ol className="space-y-3">
            {upcomingRotations.map((engineer: UpcomingRotation, index) => (
              <RotationRow
                key={engineer.user.id}
                engineer={engineer}
                position={index + 1}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function RotationRow({
  engineer,
  position,
}: {
  engineer: UpcomingRotation;
  position: number;
}) {
  const name = `${engineer.user.firstName} ${engineer.user.lastName}`;
  const initials = `${engineer.user.firstName[0] ?? ""}${engineer.user.lastName[0] ?? ""}`;

  const start = new Date(engineer.shift.startDate);
  const end = new Date(engineer.shift.endDate);

  return (
    <li className="flex items-center gap-2">
      <span className="w-4 text-center text-xs tabular-nums text-[#8a8178]">
        {position}
      </span>

      <Avatar className="size-7">
        <AvatarFallback className="text-[10px] font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{name}</p>
        </div>
        {engineer.user.specialty && (
          <p className="truncate text-xs text-[#8a8178]">
            {engineer.user.specialty}
          </p>
        )}
      </div>

      <p className="shrink-0 text-right text-xs tabular-nums text-[#8a8178]">
        {format(start, "MMM d")} - {format(end, "MMM d")}
      </p>

      <Link
        to={`mailto:${engineer.user.email}`}
        aria-label={`Email ${name}`}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
      >
        <Mail className="size-4" />
      </Link>
    </li>
  );
}
