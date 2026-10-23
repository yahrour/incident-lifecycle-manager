import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MyTeam } from "../../types";

export function LatestMembersCard({ members }: Pick<MyTeam, "members">) {
  return (
    <section className="flex-1 rounded-lg border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 text-sm font-medium">
        <h2>Latest members</h2>
      </div>

      {members.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No engineers in this team yet.
        </p>
      ) : (
        <Table containerClassName="border-none rounded-none rounded-b-lg">
          <TableHeader>
            <TableRow className="text-[11px] text-muted-foreground uppercase tracking-wide hover:bg-muted">
              <TableHead>Engineer</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map(({ id, user, joinedAt }) => (
              <TableRow key={id} className="hover:bg-card">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] font-medium">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize text-muted-foreground">
                  {user.specialty ?? "—"}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {format(joinedAt, "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
