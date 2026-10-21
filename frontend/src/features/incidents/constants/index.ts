import type { IncidentSeverity, IncidentStatus } from "../types";

export const statusColor: Record<IncidentStatus, string> = {
  open: "text-red-600 dark:text-red-400",
  acknowledged: "text-amber-600 dark:text-amber-400",
  resolved: "text-emerald-600 dark:text-emerald-400",
};

export const severityColor: Record<IncidentSeverity, string> = {
  critical: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200",
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  medium:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
};
