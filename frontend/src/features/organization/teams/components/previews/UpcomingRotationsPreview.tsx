import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchUpcomingRotations } from "../../api/teams";
import type { User } from "@/features/organization/shared/types";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";

export function UpcomingRotationsPreview({ teamId }: { teamId: string }) {
  const {
    data: upcomingRotations,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["oncall", "upcoming-rotations", teamId],
    queryFn: () => fetchUpcomingRotations(teamId),
  });

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
          <p className="text-sm text-[#2a2320]">
            Couldn't load upcoming rotations.{" "}
            <button
              onClick={() => void refetch()}
              className="text-warning hover:underline"
            >
              Try again
            </button>
          </p>
        ) : upcomingRotations.data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No upcoming rotations scheduled.
          </p>
        ) : (
          <ol className="space-y-3">
            {upcomingRotations.data.map((engineer: User, index) => (
              <RotationRow
                key={engineer.id}
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
  engineer: User;
  position: number;
}) {
  const name = `${engineer.firstName} ${engineer.lastName}`;
  const initials = `${engineer.firstName[0] ?? ""}${engineer.lastName[0] ?? ""}`;

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
          {position === 1 && <Badge variant="secondary">Next up</Badge>}
        </div>
        {engineer.specialty && (
          <p className="truncate text-xs text-[#8a8178]">
            {engineer.specialty}
          </p>
        )}
      </div>

      <Link
        to={`mailto:${engineer.email}`}
        aria-label={`Email ${name}`}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
      >
        <Mail className="size-4" />
      </Link>
    </li>
  );
}
