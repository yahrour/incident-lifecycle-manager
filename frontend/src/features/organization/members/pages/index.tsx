import { useQueries } from "@tanstack/react-query";
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
import { MembersTable } from "./MembersTable";
import { SortControls } from "../components/SortControls";
import { useState } from "react";
import { SortOrder, type SortState } from "../types";
import { InviteDialog } from "./dialogs/Invite/InviteDialog";
import { fetchMembers } from "../api/members";
import { fetchTeam } from "../../teams";
import { TeamNotFound } from "../../shared/components/TeamNotFound";

export function Members() {
  const [sort, setSort] = useState<SortState>({
    field: "name",
    order: SortOrder.ASC,
  });
  const { id: teamId } = useParams();
  const [membersQuery, teamQuery] = useQueries({
    queries: [
      {
        queryKey: ["teams", "members", teamId],
        queryFn: () => fetchMembers(teamId as string),
      },
      {
        queryKey: ["team", teamId],
        queryFn: () => fetchTeam(teamId as string),
      },
    ],
  });

  useErrorToast(teamQuery.isError, "team doesn't exist");
  useErrorToast(membersQuery.isError, "failed to load members");

  if (membersQuery.isPending || teamQuery.isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const members = membersQuery.data?.data;
  const team = teamQuery.data?.data;

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
        {members && (
          <div className="flex justify-end items-center gap-2">
            <SortControls sort={sort} onSortChange={setSort} />
            <InviteDialog team={team} />
          </div>
        )}
        <MembersTable members={members} />
      </div>
    </div>
  );
}
