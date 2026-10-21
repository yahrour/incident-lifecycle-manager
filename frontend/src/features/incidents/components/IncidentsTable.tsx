import { FullPageSpinner } from "@/components/FullPageSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useErrorToast } from "@/hooks/use-error-toast";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fetchIncidents } from "../api/incidents";
import { severityColor, statusColor } from "../constants";
import { formatMetricDuration } from "../utils";

export function IncidentsTable() {
  const { data, isError, isPending } = useQuery({
    queryKey: ["incidentTable"],
    queryFn: fetchIncidents,
  });
  //todolater : change to ErrorState
  useErrorToast(isError, "something went wrong fetching the incidents");

  if (isPending) {
    return <FullPageSpinner />;
  }

  const incidents = data?.data ?? [];

  if (incidents.length === 0)
    return <div className="text-center">No incidents yet</div>;

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Incidents</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Age</TableHead>
            <TableHead className="text-center">MTTA</TableHead>
            <TableHead className="text-center">MTTR</TableHead>
            <TableHead className="capitalize">escalation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell
                className={`text-xs text-center capitalize ${severityColor[incident.severity]}`}
              >
                {incident.severity}
              </TableCell>
              <TableCell className="font-medium">{incident.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {incident.service}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {incident.team?.name ?? "-"}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs capitalize ${statusColor[incident.status]}`}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {incident.status}
                </span>
              </TableCell>
              <TableCell>
                {incident.assignedTo
                  ? `${incident.assignedTo.firstName} ${incident.assignedTo.lastName}`
                  : "Unassigned"}
              </TableCell>
              <TableCell>{formatDistanceToNow(incident.createdAt)}</TableCell>
              <TableCell className="text-center">
                {incident.mttaSeconds
                  ? formatMetricDuration(incident.mttaSeconds)
                  : "-"}
              </TableCell>
              <TableCell className="text-center">
                {incident.mttrSeconds
                  ? formatMetricDuration(incident.mttrSeconds)
                  : "-"}
              </TableCell>
              <TableCell className="text-center">
                {incident.escalatedAt ? "Escalated" : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
