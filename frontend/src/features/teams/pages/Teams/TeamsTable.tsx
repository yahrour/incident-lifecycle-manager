import { useQueries } from "@tanstack/react-query";
import { fetchTeams } from "../../api/teamsApi";
import { fetchMetrics } from "../../api/metricsApi";
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
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
import { useEffect } from "react";
import { DEFAULT_LIMIT } from "../../constants";

export function TeamsTable({
  search,
  page,
  setPage,
}: {
  search: string;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [teamsQuery, metricsQuery] = useQueries({
    queries: [
      {
        queryKey: ["teams", page, search],
        queryFn: () => fetchTeams(page, search),
      },
      {
        queryKey: ["teamsMetrics"],
        queryFn: fetchMetrics,
      },
    ],
  });

  useEffect(() => {
    if (teamsQuery.isError) {
      toast.add({
        type: "error",
        title: "failed to fetch",
        description: "something went wrong fetching teams",
      });
    }
  }, [teamsQuery.isError]);

  useEffect(() => {
    if (metricsQuery.isError) {
      toast.add({
        type: "error",
        title: "failed to fetch",
        description: "something went wrong fetching metrics",
      });
    }
  }, [metricsQuery.isError]);

  const navigate = useNavigate();

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
    return <EmptyTeamsState />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="uppercase">
            <TableHead className="w-2/5">team</TableHead>
            <TableHead className="w-15">members</TableHead>
            <TableHead>rotation</TableHead>
            <TableHead>on-call now</TableHead>
            <TableHead>escalates</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams?.data.map((team) => {
            const onCall = onCallByTeam.get(team.id);
            const initials = onCall?.firstName?.[0] ?? "?";

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
                <TableCell className="text-xs text-right">
                  {membersCountByTeam.get(team.id)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {team.rotationPeriodDays > 1
                    ? `every ${team.rotationPeriodDays} days`
                    : "every day"}
                </TableCell>
                <TableCell className="text-xs text-center text-muted-foreground flex items-center gap-1">
                  {onCall && (
                    <Avatar className="h-5 w-5 bg-purple-400 text-white">
                      <AvatarFallback className="bg-purple-400 text-xs text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {onCall?.firstName ?? <span className="block ml-6">──</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {team.escalationTimeoutMinutes}m
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
              page === 1 ? "pointer-events-none opacity-50" : undefined
            }
            aria-disabled={page === 1}
          >
            <PaginationPrevious onClick={() => setPage(page - 1)} />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink isActive>{page}</PaginationLink>
          </PaginationItem>

          <PaginationItem
            className={
              page * DEFAULT_LIMIT >= totalTeams
                ? "pointer-events-none opacity-50"
                : undefined
            }
            aria-disabled={page * DEFAULT_LIMIT >= totalTeams}
          >
            <PaginationNext onClick={() => setPage(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}

function EmptyTeamsState() {
  return (
    <div className="mt-4 text-muted-foreground uppercase text-center font-medium text-sm w-full!">
      No Teams Yet
    </div>
  );
}
