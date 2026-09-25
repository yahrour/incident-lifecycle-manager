import { useQuery } from "@tanstack/react-query";
import { fetchMembers } from "../../api/membersApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router";

const formatJoined = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function MembersPreview({ teamId }: { teamId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["members", teamId],
    queryFn: () => fetchMembers(teamId),
  });

  const members = data?.data ?? [];

  return (
    <section className="flex-1 rounded-lg border border-border/50  bg-white">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 text-sm font-medium">
        <h2>Members</h2>
        <Link
          to={`/manager/teams/${teamId}/members`}
          className="hover:underline hover:underline-offset-4"
        >
          Manage
        </Link>
      </div>

      {isError ? (
        <p className="px-4 py-6 text-center text-sm">
          Couldn't load members.{" "}
          <button
            onClick={() => void refetch()}
            className="text-[#e8742c] hover:underline"
          >
            Try again
          </button>
        </p>
      ) : !isPending && members.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No engineers in this team yet.
        </p>
      ) : (
        <Table containerClassName="border-none rounded-none rounded-b-lg">
          <TableHeader>
            <TableRow className="text-[11px] text-muted-foreground uppercase tracking-wide hover:bg-[#f2f4f7]">
              <TableHead className="">Engineer</TableHead>
              <TableHead className="">Specialty</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending
              ? [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}>
                      <div className="h-8 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              : members.map(({ id, user, joinedAt }) => (
                  <TableRow key={id} className="hover:bg-white">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px] font-medium">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-[#2a2320]">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {user.specialty ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatJoined(joinedAt)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
