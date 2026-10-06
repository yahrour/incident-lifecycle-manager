import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  confirmUnavailability,
  fetchAllPendingUnavailabilities,
  fetchAllUnavailabilities,
  rejectUnavailability,
} from "../../api/unavailabilities";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "../../utils/time";
import { queryClient } from "@/lib/queryClient";
import type { SortState } from "../../types";
import { toast } from "@/components/ui/toast";
import { ErrorUnavailabilitiesState } from "../error-states/ErrorUnavailabilitiesState";
import { NoUnavailabilitiesState } from "../empty-states/NoUnavailabilitiesState";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DEFAULT_LIMIT } from "@/features/organization/shared/constants";
import { NoPendingUnavailabilitiesState } from "../empty-states/NoPendingUnavailabilitiesState";
import type { UnavailabilityStatus } from "@/features/organization/shared/types";
import { Link } from "react-router";
import { useEffect } from "react";

const statusVariant: Record<
  UnavailabilityStatus,
  "warning" | "success" | "destructive"
> = {
  PENDING: "warning",
  APPROVED: "success",
  EXPIRED: "destructive",
  REJECTED: "destructive",
};

export function AllUnavailabilitiesTable({
  sort,
  page,
  setPage,
  filter,
}: {
  sort: SortState;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  filter: "all" | "pending";
}) {
  const { data, isError, isPending } = useQuery({
    queryKey: ["teams", "unavailabilities", page, sort, filter],
    queryFn: () =>
      filter === "all"
        ? fetchAllUnavailabilities(page, sort)
        : fetchAllPendingUnavailabilities(page, sort),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      teamId,
      memberId,
      unavailabilityId,
    }: {
      teamId: string;
      memberId: number;
      unavailabilityId: number;
    }) => confirmUnavailability(teamId, memberId, unavailabilityId),
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["teams", "unavailabilities"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["unavailabilities", teamId],
      });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "failed to approve",
        description: "something went wrong, try again.",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      teamId,
      memberId,
      unavailabilityId,
    }: {
      teamId: string;
      memberId: number;
      unavailabilityId: number;
    }) => rejectUnavailability(teamId, memberId, unavailabilityId),
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["teams", "unavailabilities"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["unavailabilities", teamId],
      });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "failed to reject",
        description: "something went wrong, try again.",
      });
    },
  });

  useErrorToast(isError, "failed to load unavailabilities");

  const unavailabilities = data?.data;
  const totalUnavailabilities = data?.meta?.total ?? 0;

  useEffect(() => {
    if (unavailabilities && unavailabilities.length === 0 && page > 1) {
      setPage(page - 1);
    }
  }, [unavailabilities, page, setPage]);

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  if (!unavailabilities || isError) {
    return <ErrorUnavailabilitiesState />;
  } else if (unavailabilities && totalUnavailabilities === 0) {
    return filter === "all" ? (
      <NoUnavailabilitiesState />
    ) : (
      <NoPendingUnavailabilitiesState />
    );
  }

  const handleApprove = (
    teamId: string,
    unavailabilityId: number,
    memberId: number
  ) => {
    approveMutation.mutate({ teamId, memberId, unavailabilityId });
  };
  const handleReject = (
    teamId: string,
    unavailabilityId: number,
    memberId: number
  ) => {
    rejectMutation.mutate({ teamId, memberId, unavailabilityId });
  };

  const isFirstPage = page === 1;
  const isLastPage = page * DEFAULT_LIMIT >= totalUnavailabilities;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">Engineer</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unavailabilities.map((unavailability) => {
            const isActionDisabled =
              unavailability.status !== "PENDING" ||
              approveMutation.isPending ||
              rejectMutation.isPending;
            return (
              <TableRow key={unavailability.id} className="w-full">
                <TableCell className="font-medium text-sm flex-1">
                  {unavailability.teamMember.user.firstName +
                    " " +
                    unavailability.teamMember.user.lastName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <Link
                    to={`/manager/teams/${unavailability.teamMember.team.id}`}
                    className="hover:underline hover:text-foreground"
                  >
                    {unavailability.teamMember.team.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">
                  {formatDuration(
                    unavailability.startDate,
                    unavailability.endDate
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {unavailability.reason}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[unavailability.status]}>
                    {unavailability.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-right text-muted-foreground space-x-2">
                  <Button
                    size={"xs"}
                    className="bg-success text-xs hover:bg-success/90"
                    onClick={() =>
                      handleApprove(
                        unavailability.teamMember.team.id,
                        unavailability.id,
                        unavailability.memberId
                      )
                    }
                    disabled={isActionDisabled}
                  >
                    Approve
                  </Button>
                  <Button
                    size={"xs"}
                    variant="destructive"
                    className="text-xs"
                    onClick={() =>
                      handleReject(
                        unavailability.teamMember.team.id,
                        unavailability.id,
                        unavailability.memberId
                      )
                    }
                    disabled={isActionDisabled}
                  >
                    Reject
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
    </div>
  );
}
