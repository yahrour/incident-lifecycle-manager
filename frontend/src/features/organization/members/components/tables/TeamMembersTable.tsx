import { NoMembersState } from "../empty-states/NoMembersState";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchTeamMembers } from "../../api/members";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import type { SortState } from "../../types";
import { MembersTable } from "./MembersTable";
import { useEffect } from "react";

export function TeamMembersTable({
  teamId,
  page,
  setPage,
  sort,
}: {
  teamId: string;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  sort: SortState;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["teams", "members", teamId, page, sort],
    queryFn: () => fetchTeamMembers(teamId, page, sort),
    placeholderData: keepPreviousData,
  });

  useErrorToast(isError, "failed to load members");

  const members = data?.data;
  const totalMembers = data?.meta?.total ?? 0;

  useEffect(() => {
    if (members && members.length === 0 && page > 1) {
      setPage(page - 1);
    }
  }, [members, page, setPage]);

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
    />
  );
}
