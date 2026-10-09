import type { SortState } from "../../teams/types";

export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "lists"] as const,
  list: (page: number, search: string, sort: SortState) =>
    [...teamKeys.lists(), "list", page, search, sort] as const,
  detail: (id: string) => [...teamKeys.all, "detail", id] as const,
  stats: (id: string) => [...teamKeys.detail(id), "stats"] as const,
};

export const memberKeys = {
  all: ["members"] as const,
  detail: (id: string) => [...memberKeys.all, "detail", id] as const,
  preview: (id: string) => [...memberKeys.detail(id), "preview"] as const,
};

export const unavailabilityKeys = {
  all: ["unavailabilities"] as const,
  detail: (id: string) => [...unavailabilityKeys.all, "detail", id] as const,
  preview: (id: string) =>
    [...unavailabilityKeys.detail(id), "preview"] as const,
};

export const onCallKeys = {
  all: ["oncall"] as const,
  detail: (id: string) => [...onCallKeys.all, "detail", id] as const,
};

export const upcomingRotationKeys = {
  all: ["upcoming-rotation"] as const,
  detail: (id: string) => [...upcomingRotationKeys.all, "detail", id] as const,
};

export const teamMetricsKeys = {
  all: ["teams-metrics"] as const,
};
