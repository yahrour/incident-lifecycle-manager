import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { fetchTeam } from "../../api/teams";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useErrorToast } from "@/hooks/use-error-toast";
import { TeamNotFound } from "@/features/organization/shared/components/TeamNotFound";
import { EditTeamDialog } from "../../components/dialogs/EditTeamDialog";
import { DeleteTeamDialog } from "../../components/dialogs/DeleteTeamDialog";
import { TeamStats } from "../../components/stats/TeamStats";
import { OnCallPreview } from "../../components/previews/OnCallPreview";
import { UnavailabilitiesPreview } from "../../components/previews/UnavailabilitiesPreview";
import { ServicesPreview } from "../../components/previews/ServicesPreview";
import { MembersPreview } from "@/features/organization/members";

export function Team() {
  const params = useParams();
  const teamId = params.id;

  const { data, isPending, isError } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeam(teamId as string),
  });

  useErrorToast(isError, "team doesn't exist");

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const team = data?.data;

  if (!team) {
    return <TeamNotFound />;
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
            <EditTeamDialog team={team} />
            <DeleteTeamDialog teamId={team.id} />
          </div>
        </div>

        <TeamStats team={team} />
        <MembersPreview teamId={team.id} />
        <div className="flex gap-4 max-md:flex-col">
          <OnCallPreview teamId={team.id} />
          <UnavailabilitiesPreview teamId={team.id} />
          <ServicesPreview services={team.services} />
        </div>
      </div>
    </div>
  );
}
