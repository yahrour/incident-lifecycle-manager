import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { fetchMemberUnavailabilities } from "../../api/unavailability";
import type { Membership, SortState } from "../../types";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { NoUnavailabilitiesState } from "../empty-states/NoUnavailabilitiesState";
import { ErrorUnavailabilitiesState } from "../error-states/ErrorUnavailabilitiesState";
import { RemoveUnavailabilityButton } from "../buttons/RemoveUnavailabilityButton";
import { DEFAULT_LIMIT, unavailabilityKeys } from "../../constants";
import { formatDuration } from "../../utils/time";
import type { UnavailabilityFilter, UnavailabilityStatus } from "@/types";
import { TablePagination } from "@/components/TablePagination";
import { usePreviousPageWhenEmpty } from "@/features/organization/shared/hooks";
import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { StatusDot } from "@/components/StatusDot";
import { UpdateUnavailabilityDialog } from "../dialogs/UpdateUnavailabilityDialog";

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
}: {
  membership: Membership;
  filter: UnavailabilityFilter;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "desc",
  });

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

  usePreviousPageWhenEmpty(unavailabilities, page, setPage);

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
            <TableHead>Reason</TableHead>
            <TableHead className="flex items-center">
              <span>Requested At</span>
              <button className="cursor-pointer" onClick={toggleSort}>
                <ChevronsUpDown size={18} />
              </button>
            </TableHead>
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
                  {format(unavailability.createdAt, "yyyy-MM-dd")}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDuration(
                    unavailability.startDate,
                    unavailability.endDate
                  )}
                </TableCell>
                <TableCell>
                  <StatusDot
                    variant={statusVariant[unavailability.status]}
                    className="capitalize!"
                  >
                    {unavailability.status.toLowerCase()}
                  </StatusDot>
                </TableCell>
                <TableCell className="p-0! m-0!">
                  <div className="flex items-center">
                    <UpdateUnavailabilityDialog
                      unavailability={unavailability}
                      teamId={membership.team.id}
                      memberId={membership.memberId}
                    />
                    <RemoveUnavailabilityButton
                      teamId={membership.team.id}
                      memberId={membership.memberId}
                      unavailabilityId={unavailability.id}
                      unavailabilityStatus={unavailability.status}
                    />
                  </div>
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
