import { useQueries } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { fetchStats, fetchTeam } from "../../api/teamsApi";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StatBlock } from "./StatBlock";
import { EmptyState } from "./EmptyState";
import { DeleteDialog } from "./DeleteDialog";
import { EditDialog } from "./EditDialog";

export function Team() {
  const params = useParams();
  const teamId = params.id;

  const [teamQuery, statsQuery] = useQueries({
    queries: [
      {
        queryKey: ["team", teamId],
        queryFn: () => fetchTeam(teamId as string),
      },
      {
        queryKey: ["stats", teamId],
        queryFn: () => fetchStats(teamId as string),
      },
    ],
  });

  useEffect(() => {
    if (teamQuery.isError) {
      toast.add({
        type: "error",
        title: "failed to fetch",
        description: "team doesn't exist",
      });
    }
  }, [teamQuery.isError]);

  useEffect(() => {
    if (statsQuery.isError) {
      toast.add({
        type: "error",
        title: "failed to fetch",
        description: "something went wrong fetching team stats",
      });
    }
  }, [statsQuery.isError]);

  if (teamQuery.isPending || statsQuery.isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const team = teamQuery?.data?.data;
  const stats = statsQuery?.data?.data;

  if (!team || !stats) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/manager/teams">Teams</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{team.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight capitalize text-foreground">
            {team.name}
          </h1>
          <div className="space-x-2">
            <EditDialog teamId={team.id} />
            <DeleteDialog teamId={team.id} />
          </div>
        </div>

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
      </div>
    </div>
  );
}
