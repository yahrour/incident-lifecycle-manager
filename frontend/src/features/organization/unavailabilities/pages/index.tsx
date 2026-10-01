import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { fetchTeam } from "../../shared/api/teams";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { TeamNotFound } from "../../shared/components/TeamNotFound";
import { UnavailabilitiesTable } from "../components/tables/UnavailabilitiesTable";

export function Unavailabilities() {
  const { id: teamId } = useParams();
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
              <BreadcrumbLink
                render={<Link to={`/manager/teams/${team.id}`} />}
              >
                {team.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>unavailabilities</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-6">
        <UnavailabilitiesTable teamId={team.id} />
      </div>
    </div>
  );
}
