type IndicatorStatus = { status: "up" | "down"; message?: string };

export type HealthResponse = {
  status: "ok" | "error";
  details: Record<string, IndicatorStatus>;
};

export type Status = "operational" | "outage" | "unknown";
