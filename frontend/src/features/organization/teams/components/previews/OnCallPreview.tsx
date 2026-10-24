import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { fetchOnCall } from "../../api/teams";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router";
import type { ChainUser } from "../../types";
import { teamKeys } from "@/features/organization/shared/constants";
import { InlineErrorState } from "@/components/InlineErrorState";

export function OnCallPreview({ teamId }: { teamId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: teamKeys.onCall(teamId),
    queryFn: () => fetchOnCall(teamId),
    refetchInterval: 3_600_000, // every hour
    staleTime: 1_800_000, // every half hour
  });

  const [primary, secondary] = data?.data?.chain ?? [];

  return (
    <div className="flex-1 rounded-lg border border-border/50 bg-card">
      <h2 className="border-b border-border/50 px-4 py-3 text-sm font-medium text-foreground">
        On call right now
      </h2>

      <div className="px-4 py-3">
        {isPending ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <InlineErrorState
            message="Couldn't load who's on call"
            onRetry={() => void refetch()}
          />
        ) : !primary ? (
          <p className="text-center text-sm text-muted-foreground">
            Nobody is on call for this team.
          </p>
        ) : (
          <div className="space-y-3">
            <Person engineer={primary} label="Primary" />
            {secondary && (
              <>
                <p className="text-xs text-muted-foreground">
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
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {label} · {engineer.specialty}
        </p>
      </div>

      <Link
        to={`mailto:${engineer.email}`}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
      >
        <Mail className="size-4" />
      </Link>
    </div>
  );
}
