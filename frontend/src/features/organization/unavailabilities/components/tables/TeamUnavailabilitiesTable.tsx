import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchTeamUnavailabilities,
} from "../../api/unavailabilities";
import { useErrorToast } from "@/hooks/use-error-toast";
import type { Filter, SortState } from "../../types";
import { ErrorUnavailabilitiesState } from "../error-states/ErrorUnavailabilitiesState";
import { NoUnavailabilitiesState } from "../empty-states/NoUnavailabilitiesState";
import { useEffect } from "react";
import { UnavailabilitiesTable } from "./UnavailabilitiesTable";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { teamKeys } from "@/features/organization/shared/constants";

export function TeamUnavailabilitiesTable({
  teamId,
  sort,
  page,
  setPage,
  filter,
}: {
  teamId: string;
  sort: SortState;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  filter: Filter;
}) {
  const { data, isError, isPending } = useQuery({
    queryKey: teamKeys.unavailabilitiesList(teamId, page, sort, filter),
    queryFn: () => fetchTeamUnavailabilities(teamId, page, sort, filter),
    placeholderData: keepPreviousData,
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
    return <FullPageSpinner />;
  }

  if (!unavailabilities || isError) {
    return <ErrorUnavailabilitiesState />;
  } else if (unavailabilities && totalUnavailabilities === 0) {
    return <NoUnavailabilitiesState filter={filter} />
  }

  return (
    <UnavailabilitiesTable
      unavailabilities={unavailabilities}
      showOrgWide={false}
      totalUnavailabilities={totalUnavailabilities}
      page={page}
      setPage={setPage}
    />
  );
}
