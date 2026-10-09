import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchTeamPendingUnavailabilities,
  fetchTeamUnavailabilities,
} from "../../api/unavailabilities";
import { useErrorToast } from "@/hooks/use-error-toast";
import type { SortState } from "../../types";
import { ErrorUnavailabilitiesState } from "../error-states/ErrorUnavailabilitiesState";
import { NoUnavailabilitiesState } from "../empty-states/NoUnavailabilitiesState";
import { NoPendingUnavailabilitiesState } from "../empty-states/NoPendingUnavailabilitiesState";
import { useEffect } from "react";
import { UnavailabilitiesTable } from "./UnavailabilitiesTable";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { unavailabilityKeys } from "@/features/organization/shared/constants";

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
  filter: "all" | "pending";
}) {
  const { data, isError, isPending } = useQuery({
    queryKey: unavailabilityKeys.listByTeam(teamId, page, sort, filter),
    queryFn: () =>
      filter === "all"
        ? fetchTeamUnavailabilities(teamId, page, sort)
        : fetchTeamPendingUnavailabilities(teamId, page, sort),
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
    return filter === "all" ? (
      <NoUnavailabilitiesState />
    ) : (
      <NoPendingUnavailabilitiesState />
    );
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
