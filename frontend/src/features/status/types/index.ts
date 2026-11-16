export type Status = "up" | "down";
type IndicatorStatus = { status: Status; message?: string };

export type HealthResponse = {
  status: "ok" | "error";
  details: Record<string, IndicatorStatus>;
};
