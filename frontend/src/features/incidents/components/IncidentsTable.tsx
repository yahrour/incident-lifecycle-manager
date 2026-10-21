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
import type { IncidentStatus } from "../types";

function formatMetricDuration(s: number) {
  s = Math.round(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

const statusColor: Record<IncidentStatus, string> = {
  open: "text-red-600 dark:text-red-400",
  acknowledged: "text-amber-600 dark:text-amber-400",
  resolved: "text-emerald-600 dark:text-emerald-400",
};

const severityColor: Record<IncidentSeverity, string> = {
  critical: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200",
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  medium:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
};

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

  if (!incidents) {
    return <div>No incidents yet</div>;
  }

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
            <TableHead>escalation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {" "}
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
                  <span className="size-2 rounded-full bg-current" />{" "}
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
