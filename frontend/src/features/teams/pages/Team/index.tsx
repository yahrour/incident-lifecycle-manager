import { useQueries } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { fetchStats, fetchTeam } from "../../api/teams";
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
import { Button } from "@/components/ui/button";
import { MembersPreview } from "./MembersPreview";
import { OnCallPreview } from "./OnCallPreview";
import { UnavailabilitiesPreview } from "./UnavailabilitiesPreview";
import { ServicesPreview } from "./ServicesPreview";

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
        queryKey: ["team", teamId, "stats"],
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

  if (teamQuery.isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const team = teamQuery?.data?.data;
  const stats = statsQuery?.data?.data;

  if (!team) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/manager/teams" />}>
                Teams
              </BreadcrumbLink>
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
            <EditDialog team={team} />
            <DeleteDialog teamId={team.id} />
          </div>
        </div>

        {statsQuery.isPending ? (
          <div className="flex w-full bg-white border border-border/50 rounded-xl overflow-hidden h-24">
            <Spinner className="m-auto size-5" />
          </div>
        ) : statsQuery.isError || !stats ? (
          <div className="flex w-full items-center justify-center bg-white border border-border/50 rounded-xl p-4 text-sm text-muted-foreground">
            Couldn't load team stats.
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void statsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="flex w-full bg-white border border-border/50 rounded-xl divide-x divide-border/50 overflow-hidden">
              <StatBlock title="Members" value={stats.memberCount} />
              <StatBlock
                title="Away Now"
                value={stats.activeUnavailabilityCount}
              />
              <StatBlock
                title="Rotation (day)"
                value={team.rotationPeriodDays}
              />
              <StatBlock
                title="Escalation (min)"
                value={team.escalationTimeoutMinutes}
              />
              <StatBlock title="Open Incidents" value={stats.incidentCount} />
            </div>
            <MembersPreview teamId={team.id} />
            <div className="flex gap-4 max-md:flex-col">
              <OnCallPreview teamId={team.id} />
              <UnavailabilitiesPreview teamId={team.id} />
              <ServicesPreview services={team.services} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
