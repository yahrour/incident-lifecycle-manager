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
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import {
  approveUnavailability,
  rejectUnavailability,
} from "../../api/unavailabilities";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/toast";
import {
  DEFAULT_LIMIT,
  teamKeys,
  unavailabilityKeys,
} from "@/features/organization/shared/constants";
import { formatDuration } from "@/utils/time";
import type { UnavailabilityStatus } from "@/types";
import type { UnavailabilityWithTeamMember } from "@/features/organization/shared/types";
import { TablePagination } from "@/components/TablePagination";
import { format } from "date-fns";
import { ChevronsUpDown } from "lucide-react";
import type { SortState } from "../../types";

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
  sort,
  setSort,
}: {
  unavailabilities: UnavailabilityWithTeamMember[];
  showOrgWide: boolean;
  totalUnavailabilities: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  sort: SortState;
  setSort: React.Dispatch<React.SetStateAction<SortState>>;
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

  const toggleSort = () => {
    setSort({
      ...sort,
      order: sort.order === "desc" ? "asc" : "desc",
    });
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">Engineer</TableHead>
            {showOrgWide && <TableHead>Team</TableHead>}
            <TableHead className="flex items-center">
              <span>Requested At</span>
              <button className="cursor-pointer" onClick={toggleSort}>
                <ChevronsUpDown size={18} />
              </button>
            </TableHead>
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
                  {format(unavailability.createdAt, "yyyy-MM-dd")}
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
                      approveMutation.mutate({
                        teamId: unavailability.teamMember.team.id,
                        memberId: unavailability.memberId,
                        unavailabilityId: unavailability.id,
                      })
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
                      rejectMutation.mutate({
                        teamId: unavailability.teamMember.team.id,
                        memberId: unavailability.memberId,
                        unavailabilityId: unavailability.id,
                      })
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
        limit={DEFAULT_LIMIT}
      />
    </div>
  );
}
