import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoMembersState } from "../NoMembersState";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DEFAULT_LIMIT } from "@/features/organization/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { fetchMembers } from "../../api/members";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatJoined } from "../../utils/time";

export function MembersTable({
  teamId,
  page,
  setPage,
}: {
  teamId: string | undefined;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["teams", "members", teamId, page],
    queryFn: () => fetchMembers(teamId as string, page),
  });

  useErrorToast(isError, "failed to load members");

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const members = data?.data;
  const totalMembers = data?.meta?.total as number;

  if (!members || members.length === 0) {
    return <NoMembersState />;
  }

  const isFirstPage = page === 1;
  const isLastPage = page * DEFAULT_LIMIT >= totalMembers;

  console.log("members: ", members);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">Engineer</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                {member.user.firstName + " " + member.user.lastName}
              </TableCell>
              <TableCell>
                <Badge variant={"warning"} className="uppercase">
                  {member.user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {member.user.specialty}
              </TableCell>
              <TableCell>
                <Badge
                  variant={member ? "success" : "warning"}
                  className="uppercase"
                >
                  {member ? "Approved" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatJoined(member.joinedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination>
        <PaginationContent>
          <PaginationItem
            className={
              isFirstPage ? "pointer-events-none opacity-50" : undefined
            }
            aria-disabled={isFirstPage}
          >
            <PaginationPrevious onClick={() => setPage(page - 1)} />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink isActive>{page}</PaginationLink>
          </PaginationItem>

          <PaginationItem
            className={
              isLastPage ? "pointer-events-none opacity-50" : undefined
            }
            aria-disabled={isLastPage}
          >
            <PaginationNext onClick={() => setPage(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
