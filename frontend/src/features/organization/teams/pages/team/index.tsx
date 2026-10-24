import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useErrorToast } from "@/hooks/use-error-toast";
import { EditTeamDialog } from "../../components/dialogs/EditTeamDialog";
import { DeleteTeamDialog } from "../../components/dialogs/DeleteTeamDialog";
import { TeamStats } from "../../components/stats/TeamStats";
import { OnCallPreview } from "../../components/previews/OnCallPreview";
import { ServicesPreview } from "../../components/previews/ServicesPreview";
import { MembersPreview } from "@/features/organization/members";
import { fetchTeam } from "@/features/organization/shared/api/teams";
import { UnavailabilitiesPreview } from "@/features/organization/unavailabilities";
import { TeamNotFound } from "@/features/organization/shared/components/empty-states/TeamNotFound";
import { UpcomingRotationsPreview } from "../../components/previews/UpcomingRotationsPreview";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { teamKeys } from "@/features/organization/shared/constants";
import { Page } from "@/components/Page";

export function Team() {
  const { id: teamId } = useParams();

  const { data, isPending, isError } = useQuery({
    queryKey: teamKeys.detail(teamId as string),
    queryFn: () => fetchTeam(teamId as string),
  });

  useErrorToast(isError, "team doesn't exist");

  if (isPending) {
    return <FullPageSpinner />;
  }

  const team = data?.data;

  if (!team) {
    return <TeamNotFound />;
  }

  return (
    <Page
      header={
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
      }
    >
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight capitalize text-foreground">
          {team.name}
        </h1>
        <div className="space-x-2">
          <EditTeamDialog team={team} />
          <DeleteTeamDialog teamId={team.id} />
        </div>
      </div>

      <TeamStats team={team} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:sticky lg:top-6 lg:order-last">
          <OnCallPreview teamId={team.id} />
          <UpcomingRotationsPreview teamId={team.id} />
          <ServicesPreview services={team.services} />
        </div>
        <main className="min-w-0 space-y-6 lg:col-span-2">
          <MembersPreview teamId={team.id} />
          <UnavailabilitiesPreview teamId={team.id} />
        </main>
      </div>
    </Page>
  );
}
