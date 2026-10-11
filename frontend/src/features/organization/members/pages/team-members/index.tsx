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
import { SortControls } from "../../components/SortControls";
import { useState } from "react";
import { type SortState } from "../../types";
import { TeamNotFound } from "../../../shared/components/empty-states/TeamNotFound";
import { InviteDialog } from "../../components/invite-dialog";
import { fetchTeam } from "../../../shared/api/teams";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { teamKeys } from "@/features/organization/shared/constants";

export function TeamMembers() {
  const { id: teamId } = useParams();
  const [sort, setSort] = useState<SortState>({
    field: "joinedAt",
    order: "asc",
  });
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
    <div>
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
              <BreadcrumbPage>members</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 space-y-4 mt-2">
        <div className="flex justify-end items-center gap-2">
          <SortControls sort={sort} onSortChange={setSort} setPage={setPage} />
          <InviteDialog team={team} />
        </div>
        <TeamMembersTable
          page={page}
          setPage={setPage}
          sort={sort}
          teamId={team.id}
        />
      </div>
    </div>
  );
}
