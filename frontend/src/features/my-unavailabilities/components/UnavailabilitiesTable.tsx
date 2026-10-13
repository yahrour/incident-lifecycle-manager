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
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TablePagination } from "@/features/organization/shared/components/TablePagination";
import { formatDuration } from "@/utils/time";
import { fetchMemberUnavailabilities } from "../api/unavailability";
import type { Filter, Membership, SortState } from "../types";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { useErrorToast } from "@/hooks/use-error-toast";
import { NoUnavailabilitiesState } from "./NoUnavailabilitiesState";
import { ErrorUnavailabilitiesState } from "./ErrorUnavailabilitiesState";

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
  filter: Filter;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  sort: SortState;
}) {
  const { data, isPending, isError, refetch } = useQuery({
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
    placeholderData: keepPreviousData,
  });

  useErrorToast(isError, "Failed to fetch unavailabilities");

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <ErrorUnavailabilitiesState onRetry={() => void refetch()} />;
  }

  if (!data) {
    return <NoUnavailabilitiesState filter={filter} />;
  }

  const unavailabilities = data.data;
  const totalUnavailabilities = data.meta?.total ?? 0;

  if (unavailabilities.length === 0) {
    return <NoUnavailabilitiesState filter={filter} />;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">Reason</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unavailabilities.map((unavailability) => {
            return (
              <TableRow key={unavailability.id} className="w-full">
                <TableCell className="text-xs text-muted-foreground">
                  {unavailability.reason}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDuration(
                    unavailability.startDate,
                    unavailability.endDate
                  )}
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
