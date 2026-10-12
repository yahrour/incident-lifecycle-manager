import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UnavailabilityStatus } from "@/features/organization/shared/types";
import { useQuery } from "@tanstack/react-query";
import { TablePagination } from "@/features/organization/shared/components/TablePagination";
import { formatDuration } from "@/utils/time";
import { fetchMemberUnavailabilities } from "../api/unavailability";
import type { Membership, SortState } from "../types";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { useErrorToast } from "@/hooks/use-error-toast";
import { NoUnavailabilitiesState } from "./NoUnavailabilitiesState";

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
  membership,
  filter,
  page,
  setPage,
  sort,
}: {
  membership: Membership;
  filter: "all" | "pending";
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  sort: SortState;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: [
      "engineer-unavailability",
      membership.team.id,
      membership.memberId,
      sort,
      page,
      filter,
    ],
    queryFn: () =>
      fetchMemberUnavailabilities({
        memberId: membership.memberId,
        teamId: membership.team.id,
        filter,
        page,
        sort,
      }),
  });

  useErrorToast(isError, "Failed to fetch unavailabilities");

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (!data) {
    return <NoUnavailabilitiesState />;
  }

  const unavailabilities = data.data;
  const totalUnavailabilities = data.meta?.total ?? 0;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">Engineer</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unavailabilities.map((unavailability) => {
            return (
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
                  <Badge variant={statusVariant[unavailability.status]}>
                    {unavailability.status}
                  </Badge>
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
