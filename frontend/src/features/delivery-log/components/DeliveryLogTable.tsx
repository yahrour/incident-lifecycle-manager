import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityCell } from "@/components/SeverityCell";
import { StatusDot } from "@/components/StatusDot";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { useErrorToast } from "@/hooks/use-error-toast";
import { TablePagination } from "./AlertsPagination";
import { fetchAlerts } from "../api/alerts";
import type { Alert } from "../types";
import { NoAlertsState } from "./empty-states/NoAlertsState";
import { REFETCH_INTERVAL_MS } from "../constants";
import { cn } from "@/lib/utils";

const severityColor: Record<Alert["severity"], string> = {
  critical: "bg-severity-critical-bg text-severity-critical-fg",
  warning: "bg-severity-medium-bg text-severity-medium-fg",
  info: "bg-severity-low-bg text-severity-low-fg",
};

const statusColor: Record<Alert["status"], string> = {
  firing: "text-status-open",
  resolved: "text-status-resolved",
};

export function DeliveryLogTable({
  page,
  setPage,
}: {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { data, isError, isPending } = useQuery({
    queryKey: ["alerts", page],
    queryFn: () => fetchAlerts(page),
    placeholderData: keepPreviousData,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  useErrorToast(isError, "failed to load alerts");

  const alerts = data?.data;
  const totalAlerts = data?.meta?.total ?? 0;

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (!alerts || alerts.length === 0) {
    return <NoAlertsState />;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Alert</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <SeverityCell className={cn(severityColor[alert.severity], "w-[100px]")}>
                {alert.severity}
              </SeverityCell>
              <TableCell>
                <p className="font-medium">{alert.title}</p>
                {/* <p className="text-xs text-muted-foreground">{alert.message}</p> */}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {alert.provider}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {alert.service ?? "—"}
              </TableCell>
              <TableCell>
                <StatusDot className={statusColor[alert.status]}>
                  {alert.status}
                </StatusDot>
              </TableCell>
              <TableCell className="text-xs text-right text-muted-foreground">
                {format(alert.receivedAt, "PP p")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination page={page} setPage={setPage} total={totalAlerts} />
    </div>
  );
}
