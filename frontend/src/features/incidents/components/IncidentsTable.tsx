import { FullPageSpinner } from "@/components/FullPageSpinner";
import { SeverityCell } from "@/components/SeverityCell";
import { StatusDot } from "@/components/StatusDot";
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
import type { IncidentStatus } from "../types";

export function IncidentsTable({ status }: { status?: IncidentStatus }) {
  const { data, isError, isPending } = useQuery({
    queryKey: ["incidentTable", status],
    queryFn: () => fetchIncidents(status),
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
              <SeverityCell className={severityColor[incident.severity]}>
                {incident.severity}
              </SeverityCell>
              <TableCell className="font-medium">{incident.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {incident.service}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {incident.team?.name ?? "-"}
              </TableCell>
              <TableCell>
                <StatusDot className={statusColor[incident.status]}>
                  {incident.status}
                </StatusDot>
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
