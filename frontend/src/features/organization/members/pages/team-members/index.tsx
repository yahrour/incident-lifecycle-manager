import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MembersTable } from "../../components/tables/MembersTable";
import { SortControls } from "../../components/SortControls";
import { useState } from "react";
import { type SortState } from "../../types";
import { TeamNotFound } from "../../../shared/components/empty-states/TeamNotFound";
import { InviteDialog } from "../../components/invite-dialog";
import { fetchTeam } from "../../../shared/api/teams";

export function TeamMembers() {
  const { id: teamId } = useParams();
  const [sort, setSort] = useState<SortState>({
    field: "joinedAt",
    order: "asc",
  });
  const [page, setPage] = useState(1);

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
              <BreadcrumbPage>members</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-6 space-y-2">
        <div className="flex justify-end items-center gap-2">
          <SortControls sort={sort} onSortChange={setSort} setPage={setPage} />
          <InviteDialog team={team} />
        </div>
        <MembersTable
          page={page}
          setPage={setPage}
          sort={sort}
          teamId={team.id}
        />
      </div>
    </div>
  );
}
