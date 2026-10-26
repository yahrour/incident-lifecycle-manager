export const INCIDENT_STATUS = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
} as const;

type IncidentStatus = "open" | "acknowledged" | "resolved";

export const INCIDENT_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

type IncidentSeverity = "low" | "medium" | "high" | "critical";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Team = {
  id: string;
  name: string;
};

type Incident = {
  id: string;
  teamId: string | null;
  team: Team | null;
  title: string;
  service: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedToId: string | null;
  assignedTo: User | null;
  createdAt: string;
  acknowledgedAt: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  mttaSeconds: number | null;
  mttrSeconds: number | null;
  updatedAt: string;
};

type IncidentDetails = Incident & {
  notes: {
    id: string;
    content: string;
    createdAt: string;
    author: User;
  }[];
  alerts: {
    id: string;
    provider: string;
    title: string;
    severity: string;
    status: string;
    occurredAt: string;
    receivedAt: string;
  }[];
  timeline: {
    type: string;
    at: string;
    noteId?: string;
    alertId?: string;
    actor?: User;
    status?: string;
  }[];
};

export type { Incident, IncidentDetails, IncidentSeverity, IncidentStatus };
