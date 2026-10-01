import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { fetchUnavailabilities } from "../../api/unavailabilities";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { NoUnavailabilitiesState } from "../NoUnavailabilitiesState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "../../utils/time";

export function UnavailabilitiesTable({teamId}: {teamId: string}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["teams", "unavailabilities", teamId],
    queryFn: () => fetchUnavailabilities(teamId, {field: "confirmed", order: "desc"})
  })

    useErrorToast(isError, "failed to load members");

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const unavailabilities = data?.data;

  if (!unavailabilities || unavailabilities.length === 0) {
    return <NoUnavailabilitiesState />;
  }

  console.log("unavailabil: ", unavailabilities)


  return (
    <Table>
      <TableHeader>
        <TableRow className="uppercase hover:bg-transparent">
          <TableHead className="w-2/5">Engineer</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {
          unavailabilities.map((unavailability) => (
            <TableRow
                key={unavailability.id}
                className="w-full"
              >
                <TableCell className="font-medium text-sm flex-1">
                  {unavailability.teamMember.user.firstName + " " + unavailability.teamMember.user.lastName}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDuration(unavailability.startDate, unavailability.endDate)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {unavailability.reason}
                </TableCell>
                <TableCell>
                  {unavailability.status === "PENDING" ? <Badge variant="warning">PENDING</Badge> : unavailability.status === "APPROVED" ? <Badge variant="success">APPROVED</Badge> : <Badge variant="destructive">REJECTED</Badge>}
                </TableCell>
                <TableCell className="text-xs text-right text-muted-foreground space-x-2">
                  <Button size={"xs"} className="bg-success text-xs hover:bg-success/90">Confirm</Button>
                  <Button size={"xs"} variant="destructive" className="text-xs">Reject</Button>
                </TableCell>
              </TableRow>
          ))
        }
      </TableBody>
    </Table>
  );
}
