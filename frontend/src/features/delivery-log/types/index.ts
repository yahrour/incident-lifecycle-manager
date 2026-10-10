export type Alert = {
  id: string;
  provider: string;
  title: string;
  service: string | null;
  message: string | null;
  severity: "critical" | "warning" | "info";
  status: "firing" | "resolved";
  occurredAt: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
};
