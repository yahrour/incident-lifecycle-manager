import type { SortState as MemberState } from "../../members/types";
import type { SortState as TeamSortState } from "../../teams/types";
import type { SortState as UnavailabilitySortState } from "../../unavailabilities/types";

export const teamKeys = {
  all: ["teams"] as const,

  lists: () => [...teamKeys.all, "list"] as const,
  list: (page: number, search: string, sort: TeamSortState) =>
    [...teamKeys.lists(), page, search, sort] as const,
  metrics: () => [...teamKeys.all, "metrics"] as const,

  detail: (teamId: string) => [...teamKeys.all, teamId] as const,
  stats: (teamId: string) => [...teamKeys.detail(teamId), "stats"] as const,
  onCall: (teamId: string) => [...teamKeys.detail(teamId), "on-call"] as const,
  upcomingRotations: (teamId: string) =>
    [...teamKeys.detail(teamId), "upcoming-rotations"] as const,
  members: (teamId: string) => [...teamKeys.detail(teamId), "members"] as const,
  membersList: (teamId: string, page: number, sort: MemberState) =>
    [...teamKeys.members(teamId), page, sort] as const,
  unavailabilities: (teamId: string) =>
    [...teamKeys.detail(teamId), "unavailabilities"] as const,
  unavailabilitiesList: (
    teamId: string,
    page: number,
    sort: UnavailabilitySortState,
    filter: string
  ) => [...teamKeys.unavailabilities(teamId), page, sort, filter] as const,
};

export const memberKeys = {
  all: ["members"] as const,
  list: (page: number, sort: MemberState) =>
    [...memberKeys.all, page, sort] as const,
};

export const unavailabilityKeys = {
  all: ["unavailabilities"] as const,
  list: (page: number, sort: UnavailabilitySortState, filter: string) =>
    [...unavailabilityKeys.all, page, sort, filter] as const,
};
