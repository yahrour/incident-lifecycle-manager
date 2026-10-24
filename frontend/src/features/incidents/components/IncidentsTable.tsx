import { FullPageSpinner } from "@/components/FullPageSpinner";
import { SeverityCell } from "@/components/SeverityCell";
import { StatusDot } from "@/components/StatusDot";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useErrorToast } from "@/hooks/use-error-toast";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { fetchIncidents } from "../api/incidents";
import { severityColor, statusColor } from "../constants";
import { formatMetricDuration } from "../utils";
import type { IncidentStatus } from "../types";

export function IncidentsTable({ status }: { status?: IncidentStatus }) {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const cursor = cursors[cursors.length - 1];
  const { data, isError, isPending, isFetching } = useQuery({
    queryKey: ["incidentTable", status, cursor],
    queryFn: () => fetchIncidents(status, cursor),
    placeholderData: keepPreviousData,
  });
  //todolater : change to ErrorState
  useErrorToast(isError, "something went wrong fetching the incidents");

  if (isPending) {
    return <FullPageSpinner />;
  }

  const incidents = data?.data ?? [];

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
          {incidents.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                {isError ? "Couldn't load incidents" : "No matching incidents"}
              </TableCell>
            </TableRow>
          )}
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
      <nav
        aria-label="Incidents pagination"
        className="flex items-center justify-end gap-3 mt-4"
      >
        <Button
          variant="outline"
          disabled={cursors.length === 1 || isFetching}
          onClick={() => setCursors((current) => current.slice(0, -1))}
        >
          Previous
        </Button>
        <span aria-live="polite">Page {cursors.length}</span>
        <Button
          variant="outline"
          disabled={!data?.meta?.nextCursor || isFetching || isError}
          onClick={() => {
            const next = data?.meta?.nextCursor;
            if (next) setCursors((current) => [...current, next]);
          }}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}
