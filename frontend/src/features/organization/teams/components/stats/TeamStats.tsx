import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "../../api/teams";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { StatBlock } from "./StatBlock";
import type { Team } from "@/features/organization/shared/types";
import { useErrorToast } from "@/hooks/use-error-toast";

export function TeamStats({ team }: { team: Team }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["team", team.id, "stats"],
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
      <div className="flex w-full items-center justify-center bg-white border border-border/50 rounded-xl p-4 text-sm text-muted-foreground">
        Couldn't load team stats.
        <Button
          variant="link"
          onClick={() => void refetch()}
          className="text-[#e8742c] hover:underline"
        >
          Try again
        </Button>
      </div>
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
      <StatBlock title="Open Incidents" value={stats.incidentCount} />
    </div>
  );
}
