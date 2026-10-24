import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { useErrorToast } from "@/hooks/use-error-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TeamMembersTable } from "../../components/tables/TeamMembersTable";
import { useState } from "react";
import { TeamNotFound } from "../../../shared/components/empty-states/TeamNotFound";
import { fetchTeam } from "../../../shared/api/teams";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { teamKeys } from "@/features/organization/shared/constants";
import { InviteDialog } from "../../components/invite-dialog";
import { Page } from "@/components/Page";

export function TeamMembers() {
  const { id: teamId } = useParams();
  const [page, setPage] = useState(1);

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
              <BreadcrumbLink
                render={<Link to={`/manager/teams/${team.id}`} />}
              >
                {team.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>members</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <div className="flex justify-end">
        <InviteDialog team={team} />
      </div>
      <TeamMembersTable page={page} setPage={setPage} teamId={team.id} />
    </Page>
  );
}
