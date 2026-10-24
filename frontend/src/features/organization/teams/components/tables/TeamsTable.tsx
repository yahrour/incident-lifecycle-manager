import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { fetchTeams } from "../../api/teams";
import { fetchMetrics } from "../../api/metrics";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useErrorToast } from "@/hooks/use-error-toast";
import { NoTeamsState } from "../empty-states/NoTeamsState";
import type { SortField, SortState } from "../../types";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import {
  DEFAULT_LIMIT,
  teamKeys,
} from "@/features/organization/shared/constants";
import { TablePagination } from "@/components/TablePagination";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronsUpDown } from "lucide-react";

export function TeamsTable({
  search,
  page,
  setPage,
}: {
  search: string;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "asc",
  });
  const navigate = useNavigate();
  const [teamsQuery, metricsQuery] = useQueries({
    queries: [
      {
        queryKey: teamKeys.list(page, search, sort),
        queryFn: () => fetchTeams(page, search, sort),
        placeholderData: keepPreviousData,
      },
      {
        queryKey: teamKeys.metrics(),
        queryFn: fetchMetrics,
      },
    ],
  });

  useErrorToast(teamsQuery.isError, "something went wrong fetching teams");
  useErrorToast(metricsQuery.isError, "something went wrong fetching metrics");

  if (teamsQuery.isPending || metricsQuery.isPending) {
    return <FullPageSpinner />;
  }

  const teams = teamsQuery.data;
  const totalTeams = teams?.meta?.total as number;
  const metrics = metricsQuery.data?.data;

  const membersCountByTeam = new Map(
    metrics?.organization.teamsMembersCounts.map((t) => [t.id, t.count]) ?? []
  );

  const onCallByTeam = new Map(
    metrics?.organization.teamsCurrentOnCall.map((t) => [t.id, t.onCall[0]]) ??
      []
  );

  if (!teams || teams?.data.length === 0) {
    return <NoTeamsState />;
  }

  const toggleSort = (field: SortField) => {
    setSort({
      field,
      order: sort.order === "desc" ? "asc" : "desc",
    });
    setPage(1);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">
              <div className="flex items-center">
                <span>team</span>
                <button
                  className="cursor-pointer"
                  onClick={() => toggleSort("name")}
                >
                  <ChevronsUpDown size={18} />
                </button>
              </div>
            </TableHead>

            <TableHead className="flex items-center">
              <span>created at</span>
              <button
                className="cursor-pointer"
                onClick={() => toggleSort("createdAt")}
              >
                <ChevronsUpDown size={18} />
              </button>
            </TableHead>
            <TableHead>services</TableHead>
            <TableHead>members</TableHead>
            <TableHead className="flex items-center">
              <span>rotation</span>
              <button
                className="cursor-pointer"
                onClick={() => toggleSort("rotationPeriodDays")}
              >
                <ChevronsUpDown size={18} />
              </button>
            </TableHead>
            <TableHead>on-call now</TableHead>
            <TableHead>escalates(min)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams?.data.map((team) => {
            const onCall = onCallByTeam.get(team.id);
            const fullName =
              (onCall?.firstName ?? "") + " " + (onCall?.lastName ?? "");
            const initials =
              (onCall?.firstName.charAt(0) ?? "") +
              (onCall?.lastName.charAt(0) ?? "");
            return (
              <TableRow
                key={team.id}
                className="w-full cursor-pointer"
                onClick={() => {
                  void navigate(`/manager/teams/${team.id}`);
                }}
              >
                <TableCell className="font-medium text-sm flex-1">
                  {team.name}
                </TableCell>
                <TableCell className="text-xs">
                  {format(team.createdAt, "yyyy-MM-dd")}
                </TableCell>
                <TableCell>
                  {team.services.slice(0, 2).join(" • ")}
                  {team.services.length > 2 && (
                    <span className="text-muted-foreground">
                      {" "}
                      +{team.services.length - 2}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {membersCountByTeam.get(team.id)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {team.rotationPeriodDays > 1
                    ? `every ${team.rotationPeriodDays} days`
                    : "every day"}
                </TableCell>
                <TableCell className="text-xs text-center text-muted-foreground flex items-center gap-1">
                  {onCall && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {initials.length > 0 ? initials : "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {fullName.length > 1 ? fullName : "no members yet"}
                </TableCell>
                <TableCell className="text-left text-xs text-muted-foreground">
                  {team.escalationTimeoutMinutes}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        setPage={setPage}
        total={totalTeams}
        limit={DEFAULT_LIMIT}
      />
    </>
  );
}
