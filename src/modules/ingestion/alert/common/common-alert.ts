export type AlertSeverity = "critical" | "warning" | "info";

export interface CommonAlert {
  provider: string;
  title: string;
  message?: string;
  severity: AlertSeverity;
  occurredAt: Date;
}
