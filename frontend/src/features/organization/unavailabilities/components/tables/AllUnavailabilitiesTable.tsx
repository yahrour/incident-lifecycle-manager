import { useQuery } from "@tanstack/react-query";
import {
  fetchAllPendingUnavailabilities,
  fetchAllUnavailabilities,
} from "../../api/unavailabilities";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import type { SortState } from "../../types";
import { ErrorUnavailabilitiesState } from "../error-states/ErrorUnavailabilitiesState";
import { NoUnavailabilitiesState } from "../empty-states/NoUnavailabilitiesState";
import { NoPendingUnavailabilitiesState } from "../empty-states/NoPendingUnavailabilitiesState";
import { useEffect } from "react";
import { UnavailabilitiesTable } from "./UnavailabilitiesTable";

export function AllUnavailabilitiesTable({
  sort,
  page,
  setPage,
  filter,
}: {
  sort: SortState;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  filter: "all" | "pending";
}) {
  const { data, isError, isPending } = useQuery({
    queryKey: ["teams", "unavailabilities", page, sort, filter],
    queryFn: () =>
      filter === "all"
        ? fetchAllUnavailabilities(page, sort)
        : fetchAllPendingUnavailabilities(page, sort),
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
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
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
      showOrgWide={true}
      totalUnavailabilities={totalUnavailabilities}
      page={page}
      setPage={setPage}
    />
  );
}
