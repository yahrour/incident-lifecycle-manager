import { useQueries } from "@tanstack/react-query";
import { fetchTeams } from "../../api/teams";
import { fetchMetrics } from "../../api/metrics";
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useErrorToast } from "@/hooks/use-error-toast";
import { DEFAULT_LIMIT } from "@/features/organization/shared/constants";
import { NoTeamsState } from "../empty-states/NoTeamsState";
import type { SortState } from "../../types";

export function TeamsTable({
  search,
  sort,
  page,
  setPage,
}: {
  search: string;
  sort: SortState;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const navigate = useNavigate();
  const [teamsQuery, metricsQuery] = useQueries({
    queries: [
      {
        queryKey: ["teams", page, search, sort],
        queryFn: () => fetchTeams(page, search, sort),
      },
      {
        queryKey: ["teamsMetrics"],
        queryFn: fetchMetrics,
      },
    ],
  });

  useErrorToast(teamsQuery.isError, "something went wrong fetching teams");
  useErrorToast(metricsQuery.isError, "something went wrong fetching metrics");

  if (teamsQuery.isPending || metricsQuery.isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
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

  const isFirstPage = page === 1;
  const isLastPage = page * DEFAULT_LIMIT >= totalTeams;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">team</TableHead>
            <TableHead>services</TableHead>
            <TableHead>members</TableHead>
            <TableHead>rotation</TableHead>
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
      <Pagination>
        <PaginationContent>
          <PaginationItem
            className={
              isFirstPage ? "pointer-events-none opacity-50" : undefined
            }
            aria-disabled={isFirstPage}
          >
            <PaginationPrevious onClick={() => setPage(page - 1)} />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink isActive>{page}</PaginationLink>
          </PaginationItem>

          <PaginationItem
            className={
              isLastPage ? "pointer-events-none opacity-50" : undefined
            }
            aria-disabled={isLastPage}
          >
            <PaginationNext onClick={() => setPage(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
