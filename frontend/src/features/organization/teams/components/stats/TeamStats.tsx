import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "../../api/teams";
import { Spinner } from "@/components/ui/spinner";
import { StatBlock } from "./StatBlock";
import type { Team } from "@/features/organization/shared/types";
import { useErrorToast } from "@/hooks/use-error-toast";
import { teamKeys } from "@/features/organization/shared/constants";
import { InlineErrorState } from "@/components/InlineErrorState";

export function TeamStats({ team }: { team: Team }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: teamKeys.stats(team.id),
    queryFn: () => fetchStats(team.id),
  });

  useErrorToast(isError, "team doesn't exist");

  if (isPending) {
    return (
      <div className="flex w-full bg-white border border-border/50 rounded-xl overflow-hidden h-24">
        <Spinner className="m-auto size-5" />
      </div>
    );
  }

  const stats = data?.data;

  if (isError || !stats) {
    return (
      <InlineErrorState
        message="Couldn't load team stats"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex w-full bg-white border border-border/50 rounded-xl divide-x divide-border/50 overflow-hidden">
      <StatBlock title="Members" value={stats.memberCount} />
      <StatBlock title="Away Now" value={stats.activeUnavailabilityCount} />
      <StatBlock title="Rotation (day)" value={team.rotationPeriodDays} />
      <StatBlock
        title="Escalation (min)"
        value={team.escalationTimeoutMinutes}
      />
      <StatBlock title="Open Incidents" value={stats.openIncidentCount} />
    </div>
  );
}
