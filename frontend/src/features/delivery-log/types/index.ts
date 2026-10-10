import type { SortOrder } from "@/features/organization/shared/types";

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

export type AlertFilter = "all" | "firing" | "resolved";

type SortField = "receivedAt" | "occurredAt";
export type SortState = { field: SortField; order: SortOrder };
