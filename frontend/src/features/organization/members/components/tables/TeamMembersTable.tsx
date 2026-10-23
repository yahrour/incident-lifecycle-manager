import { NoMembersState } from "../empty-states/NoMembersState";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchTeamMembers } from "../../api/members";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { MembersTable } from "./MembersTable";
import { teamKeys } from "@/features/organization/shared/constants";
import { usePreviousPageWhenEmpty } from "@/features/organization/shared/hooks";
import { useState } from "react";
import type { SortState } from "../../types";

export function TeamMembersTable({
  teamId,
  page,
  setPage,
}: {
  teamId: string;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [sort, setSort] = useState<SortState>({
    field: "joinedAt",
    order: "asc",
  });
  const { data, isPending, isError } = useQuery({
    queryKey: teamKeys.membersList(teamId, page, sort),
    queryFn: () => fetchTeamMembers(teamId, page, sort),
    placeholderData: keepPreviousData,
  });

  useErrorToast(isError, "failed to load members");

  const members = data?.data;
  const totalMembers = data?.meta?.total ?? 0;

  usePreviousPageWhenEmpty(members, page, setPage);

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  if (!members || members.length === 0) {
    return <NoMembersState />;
  }

  return (
    <MembersTable
      members={members}
      page={page}
      setPage={setPage}
      showOrgWide={false}
      totalMembers={totalMembers}
      sort={sort}
      setSort={setSort}
    />
  );
}
