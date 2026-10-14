import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  Unavailability,
  UnavailabilityStatus,
} from "@/features/organization/shared/types";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import {
  approveUnavailability,
  rejectUnavailability,
} from "../../api/unavailabilities";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/toast";
import { TablePagination } from "@/features/organization/shared/components/TablePagination";
import {
  teamKeys,
  unavailabilityKeys,
} from "@/features/organization/shared/constants";
import { formatDuration } from "@/utils/time";

const statusVariant: Record<
  UnavailabilityStatus,
  "warning" | "success" | "destructive"
> = {
  PENDING: "warning",
  APPROVED: "success",
  EXPIRED: "destructive",
  REJECTED: "destructive",
};

export function UnavailabilitiesTable({
  unavailabilities,
  showOrgWide,
  totalUnavailabilities,
  page,
  setPage,
}: {
  unavailabilities: Unavailability[];
  showOrgWide: boolean;
  totalUnavailabilities: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const approveMutation = useMutation({
    mutationFn: ({
      teamId,
      memberId,
      unavailabilityId,
    }: {
      teamId: string;
      memberId: number;
      unavailabilityId: number;
    }) => approveUnavailability(teamId, memberId, unavailabilityId),
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      void queryClient.invalidateQueries({ queryKey: unavailabilityKeys.all });
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
      void queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      void queryClient.invalidateQueries({ queryKey: unavailabilityKeys.all });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "failed to reject",
        description: "something went wrong, try again.",
      });
    },
  });

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

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">Engineer</TableHead>
            {showOrgWide && <TableHead>Team</TableHead>}
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
                {showOrgWide && (
                  <TableCell className="text-sm text-muted-foreground">
                    <Link
                      to={`/manager/teams/${unavailability.teamMember.team.id}`}
                      className="hover:underline hover:text-foreground"
                    >
                      {unavailability.teamMember.team.name}
                    </Link>
                  </TableCell>
                )}
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
      <TablePagination
        page={page}
        setPage={setPage}
        total={totalUnavailabilities}
      />
    </div>
  );
}
