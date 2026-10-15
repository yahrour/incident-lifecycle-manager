import type { SortOrder } from "@/types";
import type { User } from "../../shared/types";

export type Metrics = {
  organization: {
    totalTeams: number;
    teamsMembersCounts: {
      id: string;
      name: string;
      count: number;
    }[];
    teamsCurrentOnCall: {
      id: string;
      name: string;
      onCall: User[];
    }[];
    totalUnavailabilities: number;
    activeUnavailabilities: number;
  };
};

export type Stats = {
  memberCount: number;
  openIncidentCount: number;
  activeUnavailabilityCount: number;
};

type OnCallPosition = "PRIMARY" | "SECONDARY";
export type ChainUser = User & {
  position: OnCallPosition;
};

export type OnCall = {
  teamId: string;
  escalationTimeoutMinutes: number;
  chain: ChainUser[];
} | null;

type SortField = "name" | "rotationPeriodDays" | "createdAt";
export type SortState = { field: SortField; order: SortOrder };

export type UpcomingRotation = User & { startDate: string; endDate: string };
