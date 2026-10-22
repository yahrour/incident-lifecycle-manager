import { NoMembersState } from "../empty-states/NoMembersState";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAllMembers } from "../../api/members";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import type { SortState } from "../../types";
import { MembersTable } from "./MembersTable";
import { memberKeys } from "@/features/organization/shared/constants";
import { usePreviousPageWhenEmpty } from "@/features/organization/shared/hooks";

export function AllMembersTable({
  page,
  setPage,
  sort,
}: {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  sort: SortState;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: memberKeys.list(page, sort),
    queryFn: () => fetchAllMembers(page, sort),
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
      totalMembers={totalMembers}
      page={page}
      setPage={setPage}
      showOrgWide={true}
    />
  );
}
