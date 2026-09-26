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
      onCall: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        specialty: string | null;
        role: string;
      }[];
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
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialty: string | null;
  };
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
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      specialty: string | null;
    };
  };
};

export type OnCall = {
  teamId: string;
  escalationTimeoutMinutes: number;
  chain: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialty: string | null;
    role: string;
  }[];
} | null;

export type Engineer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string | null;
  role: string;
};
