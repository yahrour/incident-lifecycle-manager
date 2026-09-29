import type { UserWithRole } from "../../shared/types";

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
      onCall: UserWithRole[];
    }[];
    totalUnavailabilities: number;
    activeUnavailabilities: number;
  };
};

export type Stats = {
  memberCount: number;
  incidentCount: number;
  activeUnavailabilityCount: number;
};

export type OnCall = {
  teamId: string;
  escalationTimeoutMinutes: number;
  chain: UserWithRole[];
} | null;
