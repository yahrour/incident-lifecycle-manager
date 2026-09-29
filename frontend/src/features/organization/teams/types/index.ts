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
  incidentCount: number;
  activeUnavailabilityCount: number;
};

type OnCallRole = "PRIMARY" | "SECONDARY";
type ChainUser = Omit<User, "role"> & {
  role: OnCallRole;
};
export type OnCall = {
  teamId: string;
  escalationTimeoutMinutes: number;
  chain: ChainUser[];
} | null;

export type Engineer = User;
