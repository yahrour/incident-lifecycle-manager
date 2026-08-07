export const INCIDENT_STATUS = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
} as const;

export type IncidentStatus =
  (typeof INCIDENT_STATUS)[keyof typeof INCIDENT_STATUS];

export const INCIDENT_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
