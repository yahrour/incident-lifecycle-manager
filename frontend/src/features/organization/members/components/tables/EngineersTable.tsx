import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoMembersState } from "../empty-states/NoMembersState";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DEFAULT_LIMIT } from "@/features/organization/shared/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEngineers, removeMember } from "../../api/members";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatJoined } from "../../utils/time";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import type { SortState } from "../../types";
import { Link } from "react-router";
import { FullPageSpinner } from "@/components/FullPageSpinner";

export function EngineersTable({
  page,
  setPage,
  sort,
}: {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  sort: SortState;
}) {
  const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
  const { data, isPending, isError } = useQuery({
    queryKey: ["teams", "members", page, sort],
    queryFn: () => fetchEngineers(page, sort),
  });

  const mutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: number }) =>
      removeMember({ teamId, memberId }),
    onSuccess: (_data, { teamId }) => {
      toast.add({
        type: "success",
        title: "Team member removed",
        description: "The team member was successfully removed",
      });
      void queryClient.invalidateQueries({
        queryKey: ["teams"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teamsMetrics"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["team", teamId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["members", teamId],
      });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "Failed to remove team member",
        description: "We couldn't remove the team member. Please try again",
      });
    },
    onSettled: () => {
      setPendingMemberId(null);
    },
  });

  useErrorToast(isError, "failed to load members");

  const members = data?.data;
  const totalMembers = data?.meta?.total ?? 0;

  useEffect(() => {
    if (members && members.length === 0 && page > 1) {
      setPage(page - 1);
    }
  }, [members, page, setPage]);

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (!members || members.length === 0) {
    return <NoMembersState />;
  }

  const isFirstPage = page === 1;
  const isLastPage = page * DEFAULT_LIMIT >= totalMembers;

  const handleRemove = (teamId: string, memberId: number) => {
    setPendingMemberId(memberId);
    mutation.mutate({ teamId, memberId });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">Engineer</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isAway = member.unavailabilities.length > 0;

            return (
              <TableRow key={member.id}>
                <TableCell className="font-medium text-sm flex-1">
                  {member.user.firstName + " " + member.user.lastName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.team ? (
                    <Link
                      to={`/manager/teams/${member.teamId}`}
                      className="hover:underline hover:text-foreground"
                    >
                      {member.team.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {member.user.specialty}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isAway ? "warning" : "success"}
                    className="uppercase"
                  >
                    {isAway ? "AWAY" : "AVAILABLE"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatJoined(member.joinedAt)}
                </TableCell>
                <TableCell className="p-0! m-0!">
                  <Button
                    variant="destructive"
                    className="bg-transparent"
                    onClick={() => handleRemove(member.teamId, member.id)}
                    disabled={mutation.isPending}
                  >
                    {pendingMemberId === member.id && mutation.isPending ? (
                      <Spinner />
                    ) : (
                      <Trash />
                    )}
                  </Button>
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
