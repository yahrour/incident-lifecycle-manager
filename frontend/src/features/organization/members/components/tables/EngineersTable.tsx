import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoMembersState } from "../NoMembersState";
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
import { useState } from "react";
import type { SortState } from "../../types";

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
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "Team member removed",
        description: "The team member was successfully removed from your team",
      });
      void queryClient.invalidateQueries({
        queryKey: ["teams"],
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

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const members = data?.data;
  const totalMembers = data?.meta?.total as number;

  if (!members || members.length === 0) {
    return <NoMembersState />;
  }

  const isFirstPage = page === 1;
  const isLastPage = page * DEFAULT_LIMIT >= totalMembers;

  const handleRemove = (memberId: number) => {
    setPendingMemberId(memberId);
    // mutation.mutate({ teamId, memberId });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">Engineer</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Role</TableHead>
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
                <TableCell>
                  {member.user.firstName + " " + member.user.lastName}
                </TableCell>
                <TableCell>{member.team?.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {member.user.role}
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
                <TableCell>
                  <Button
                    variant="destructive"
                    className="bg-transparent"
                    onClick={() => handleRemove(member.id)}
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
