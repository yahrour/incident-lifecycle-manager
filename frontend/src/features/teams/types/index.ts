import { Role } from "@/types";

export type Team = {
  id: string;
  name: string;
  services: string[];
  description: string | null;
  rotationPeriodDays: number;
  rotationStartDate: Date;
  escalationTimeoutMinutes: number;
  webhookUrl: string | null;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string | null;
};

export type UserWithRole = User & { role: typeof Role.ENGINEER };

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

export type Member = {
  user: User;
  teamId: string;
  id: number;
  joinedAt: Date;
};

export type Unavailability = {
  id: number;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  confirmed: boolean;
  createdAt: Date;
  memberId: number;
  teamMember: {
    id: number;
    user: User;
  };
};

export type OnCall = {
  teamId: string;
  escalationTimeoutMinutes: number;
  chain: UserWithRole[];
} | null;

export type Engineer = UserWithRole;
