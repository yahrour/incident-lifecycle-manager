import type { Filter, SortState } from "../types";

export const membershipKeys = {
  all: ["membership"],
};

export const unavailabilityKeys = {
  all: ["my-unavailabilities"],
  detail: ({
    teamId,
    memberId,
    sort,
    page,
    filter,
  }: {
    teamId: string;
    memberId: number;
    sort: SortState;
    page: number;
    filter: Filter;
  }) => [...unavailabilityKeys.all, teamId, memberId, sort, page, filter],
};
