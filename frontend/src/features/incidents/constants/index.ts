import type { IncidentSeverity, IncidentStatus } from "../types";

export const statusColor: Record<IncidentStatus, string> = {
  open: "text-status-open",
  acknowledged: "text-status-acknowledged",
  resolved: "text-status-resolved",
};

export const severityColor: Record<IncidentSeverity, string> = {
  critical: "bg-severity-critical-bg text-severity-critical-fg",
  high: "bg-severity-high-bg text-severity-high-fg",
  medium: "bg-severity-medium-bg text-severity-medium-fg",
  low: "bg-severity-low-bg text-severity-low-fg",
};
