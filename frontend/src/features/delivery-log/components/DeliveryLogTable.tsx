import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { useErrorToast } from "@/hooks/use-error-toast";
import { TablePagination } from "@/features/organization/shared/components/TablePagination";
import { fetchAlerts } from "../api/alerts";
import type { Alert } from "../types";
import { NoAlertsState } from "./empty-states/NoAlertsState";

const severityVariant: Record<
  Alert["severity"],
  "destructive" | "warning" | "secondary"
> = {
  critical: "destructive",
  warning: "warning",
  info: "secondary",
};

const statusVariant: Record<Alert["status"], "warning" | "success"> = {
  firing: "warning",
  resolved: "success",
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
  });

  useErrorToast(isError, "failed to load alerts");

  const alerts = data?.data;
  const totalAlerts = data?.meta?.total ?? 0;

  useEffect(() => {
    if (alerts && alerts.length === 0 && page > 1) {
      setPage(page - 1);
    }
  }, [alerts, page, setPage]);

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
          <TableRow className="uppercase hover:bg-transparent">
            <TableHead className="w-2/5">Alert</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id} className="w-full">
              <TableCell>
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {alert.provider}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {alert.service ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={severityVariant[alert.severity]}
                  className="uppercase"
                >
                  {alert.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={statusVariant[alert.status]}
                  className="uppercase"
                >
                  {alert.status}
                </Badge>
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
