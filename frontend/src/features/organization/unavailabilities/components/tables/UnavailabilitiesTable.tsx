import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  confirmUnavailability,
  fetchUnavailabilities,
  rejectUnavailability,
} from "../../api/unavailabilities";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { NoUnavailabilitiesState } from "../NoUnavailabilitiesState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "../../utils/time";
import { queryClient } from "@/lib/queryClient";
import type { SortState } from "../../types";
import { toast } from "@/components/ui/toast";
import { ErrorUnavailabilitiesState } from "../ErrorUnavailabilitiesState";

export function UnavailabilitiesTable({
  teamId,
  sort,
}: {
  teamId: string;
  sort: SortState;
}) {
  const {
    data,
    isError,
    isSuccess,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["teams", "unavailabilities", teamId, sort],
    queryFn: ({ pageParam }) => fetchUnavailabilities(teamId, pageParam, sort),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  });

  const confirmMutation = useMutation({
    mutationFn: ({
      teamId,
      memberId,
      unavailabilityId,
    }: {
      teamId: string;
      memberId: number;
      unavailabilityId: number;
    }) => confirmUnavailability(teamId, memberId, unavailabilityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["teams", "unavailabilities", teamId],
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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["teams", "unavailabilities", teamId],
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

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const unavailabilities = data?.pages.flatMap((page) => page.data) ?? [];

  if ((!unavailabilities || unavailabilities.length === 0) && isSuccess) {
    return <NoUnavailabilitiesState />;
  } else if ((!unavailabilities || unavailabilities.length === 0) && isError) {
    return <ErrorUnavailabilitiesState />;
  }

  const handleConfirm = (unavailabilityId: number, memberId: number) => {
    confirmMutation.mutate({ teamId, memberId, unavailabilityId });
  };
  const handleReject = (unavailabilityId: number, memberId: number) => {
    rejectMutation.mutate({ teamId, memberId, unavailabilityId });
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">Engineer</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unavailabilities.map((unavailability) => (
            <TableRow key={unavailability.id} className="w-full">
              <TableCell className="font-medium text-sm flex-1">
                {unavailability.teamMember.user.firstName +
                  " " +
                  unavailability.teamMember.user.lastName}
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
                {unavailability.status === "PENDING" ? (
                  <Badge variant="warning">PENDING</Badge>
                ) : unavailability.status === "APPROVED" ? (
                  <Badge variant="success">APPROVED</Badge>
                ) : unavailability.status === "EXPIRED" ? (
                  <Badge variant="destructive">EXPIRED</Badge>
                ) : (
                  <Badge variant="destructive">REJECTED</Badge>
                )}
              </TableCell>
              <TableCell className="text-xs text-right text-muted-foreground space-x-2">
                <Button
                  size={"xs"}
                  className="bg-success text-xs hover:bg-success/90"
                  onClick={() =>
                    handleConfirm(unavailability.id, unavailability.memberId)
                  }
                  disabled={
                    unavailability.status !== "PENDING" ||
                    confirmMutation.isPending ||
                    rejectMutation.isPending
                  }
                >
                  Approve
                </Button>
                <Button
                  size={"xs"}
                  variant="destructive"
                  className="text-xs"
                  onClick={() =>
                    handleReject(unavailability.id, unavailability.memberId)
                  }
                  disabled={
                    unavailability.status !== "PENDING" ||
                    confirmMutation.isPending ||
                    rejectMutation.isPending
                  }
                >
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-center">
        <Button
          onClick={() => void fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading more..." : "Load More"}
        </Button>
      </div>
    </div>
  );
}
