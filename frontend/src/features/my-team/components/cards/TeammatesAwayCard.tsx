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

export function TeammatesAwayCard({
  teammatesAway,
}: Pick<MyTeam, "teammatesAway">) {
  return (
    <section className="flex-1 rounded-lg border border-border/50 bg-white">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 text-sm font-medium">
        <h2>Teammates away</h2>
      </div>

      {teammatesAway.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Nobody is away right now.
        </p>
      ) : (
        <Table containerClassName="border-none rounded-none rounded-b-lg">
          <TableHeader>
            <TableRow className="text-[11px] text-muted-foreground uppercase tracking-wide hover:bg-[#f2f4f7]">
              <TableHead>Engineer</TableHead>
              <TableHead className="text-right">Away</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* no ids are sent to teammates, so key by name */}
            {teammatesAway.map(({ user, unavailabilities }) => (
              <TableRow
                key={`${user.firstName}-${user.lastName}`}
                className="hover:bg-white"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] font-medium">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-[#2a2320]">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {unavailabilities.map((window) => (
                    <p key={window.startDate}>
                      {format(window.startDate, "MMM d")} -{" "}
                      {format(window.endDate, "MMM d")}
                    </p>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
