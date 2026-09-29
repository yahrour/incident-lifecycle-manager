import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { fetchOnCall } from "../../api/teams";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router";
import type { ChainUser } from "../../types";

export function OnCallPreview({ teamId }: { teamId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["oncall", teamId],
    queryFn: () => fetchOnCall(teamId),
    refetchInterval: 3_600_000, // every hour
    staleTime: 1_800_000, // every half hour
  });

  const [primary, secondary] = data?.data?.chain ?? [];

  return (
    <div className="flex-1 rounded-lg border border-border/50 bg-white">
      <h2 className="border-b border-border/50 px-4 py-3 text-sm font-medium text-[#2a2320]">
        On call right now
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
            Couldn't load who's on call.{" "}
            <button
              onClick={() => void refetch()}
              className="text-warning hover:underline"
            >
              Try again
            </button>
          </p>
        ) : !primary ? (
          <p className="text-center text-sm text-muted-foreground">
            Nobody is on call for this team.
          </p>
        ) : (
          <div className="space-y-3">
            <Person engineer={primary} label="Primary" />
            {secondary && (
              <>
                <p className="text-xs text-[#8a8178]">
                  Escalates to secondary if not acknowledged within{" "}
                  {data.data!.escalationTimeoutMinutes} min
                </p>
                <Person engineer={secondary} label="Secondary" />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Person({ engineer, label }: { engineer: ChainUser; label: string }) {
  const name = `${engineer.firstName} ${engineer.lastName}`;
  const initials = engineer.firstName[0] + engineer.lastName[0];

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7">
        <AvatarFallback className="text-[10px] font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="text-sm font-medium text-[#2a2320]">{name}</p>
        <p className="text-xs text-[#8a8178]">
          {label} · {engineer.specialty}
        </p>
      </div>

      <Link
        to={`mailto:${engineer.email}`}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-[#f7f2ea] hover:text-foreground"
      >
        <Mail className="size-4" />
      </Link>
    </div>
  );
}
