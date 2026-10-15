import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchMemberUnavailabilities } from "../../api/unavailability";
import type { Membership, SortState } from "../../types";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { NoUnavailabilitiesState } from "../empty-states/NoUnavailabilitiesState";
import { ErrorUnavailabilitiesState } from "../error-states/ErrorUnavailabilitiesState";
import { RemoveUnavailabilityButton } from "../buttons/RemoveUnavailabilityButton";
import { unavailabilityKeys } from "../../constants";
import { formatDuration } from "../../utils/time";
import { TablePagination } from "../TablePagination";
import { useEffect } from "react";
import type { UnavailabilityFilter, UnavailabilityStatus } from "@/types";

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
  filter: UnavailabilityFilter;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  sort: SortState;
}) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: unavailabilityKeys.detail({
      teamId: membership.team.id,
      memberId: membership.memberId,
      filter,
      page,
      sort,
    }),
    queryFn: () =>
      fetchMemberUnavailabilities({
        memberId: membership.memberId,
        teamId: membership.team.id,
        filter,
        page,
        sort,
      }),
    placeholderData: (previousData, previousQuery) => {
      // WARN: the filter value should be last one in the unavailabilityKeys.detail array
      const prevFilter = previousQuery?.queryKey.at(-1) as UnavailabilityFilter;
      return prevFilter === filter ? previousData : undefined;
    },
  });

  const unavailabilities = data?.data;
  const totalUnavailabilities = data?.meta?.total ?? 0;

  useEffect(() => {
    if (unavailabilities && unavailabilities.length === 0 && page > 1) {
      setPage(page - 1);
    }
  }, [unavailabilities, page, setPage]);

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <ErrorUnavailabilitiesState onRetry={() => void refetch()} />;
  }

  if (!data) {
    return <NoUnavailabilitiesState filter={filter} />;
  }

  if (!unavailabilities || unavailabilities.length === 0) {
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
            <TableHead className="w-16">Action</TableHead>
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
                <TableCell className="p-0! m-0! ">
                  <RemoveUnavailabilityButton
                    teamId={membership.team.id}
                    memberId={membership.memberId}
                    unavailabilityId={unavailability.id}
                    unavailabilityStatus={unavailability.status}
                  />
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
