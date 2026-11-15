export type AlertSeverity = "critical" | "warning" | "info";

export interface CommonAlert {
  provider: string;
  serviceName?: string;
  title: string;
  message?: string;
  severity: AlertSeverity;
  occurredAt: Date;
  status?: string;
}
