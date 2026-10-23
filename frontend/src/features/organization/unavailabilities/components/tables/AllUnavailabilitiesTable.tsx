import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAllUnavailabilities } from "../../api/unavailabilities";
import { useErrorToast } from "@/hooks/use-error-toast";
import type { SortState } from "../../types";
import { ErrorUnavailabilitiesState } from "../error-states/ErrorUnavailabilitiesState";
import { NoUnavailabilitiesState } from "../empty-states/NoUnavailabilitiesState";
import { UnavailabilitiesTable } from "./UnavailabilitiesTable";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { unavailabilityKeys } from "@/features/organization/shared/constants";
import type { UnavailabilityFilter } from "@/types";
import { usePreviousPageWhenEmpty } from "@/features/organization/shared/hooks";

export function AllUnavailabilitiesTable({
  sort,
  page,
  setPage,
  filter,
}: {
  sort: SortState;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  filter: UnavailabilityFilter;
}) {
  const { data, isError, isPending, refetch } = useQuery({
    queryKey: unavailabilityKeys.list(page, sort, filter),
    queryFn: () => fetchAllUnavailabilities(page, sort, filter),
    placeholderData: keepPreviousData,
  });

  useErrorToast(isError, "failed to load unavailabilities");

  const unavailabilities = data?.data;
  const totalUnavailabilities = data?.meta?.total ?? 0;

  usePreviousPageWhenEmpty(unavailabilities, page, setPage);

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (!unavailabilities || isError) {
    return <ErrorUnavailabilitiesState onRetry={() => void refetch()} />;
  } else if (unavailabilities && totalUnavailabilities === 0) {
    return <NoUnavailabilitiesState filter={filter} />;
  }

  return (
    <UnavailabilitiesTable
      unavailabilities={unavailabilities}
      showOrgWide={true}
      totalUnavailabilities={totalUnavailabilities}
      page={page}
      setPage={setPage}
    />
  );
}
