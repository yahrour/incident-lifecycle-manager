export type Shift = {
  isOnCall: boolean;
  currentShift: {
    team: {
      id: string;
      name: string;
      escalationTimeoutMinutes: number;
    };
    position: "PRIMARY" | "SECONDARY";
    startsAt: string;
    endsAt: string;
    incidents: {
      totalAssignedIncidents: number;
      totalUnacknowledgedIncidents: number;
    };
  } | null;
};

export type Membership = {
  memberId: number;
  team: {
    id: string;
    name: string;
  };
};

type Person = {
  firstName: string;
  lastName: string;
  specialty: string | null;
};

export type MyTeam = {
  team: {
    id: string;
    name: string;
    description: string | null;
    services: string[];
    rotationPeriodDays: number;
    escalationTimeoutMinutes: number;
  };
  membersCount: number;
  members: { id: number; joinedAt: string; user: Person }[];
  teamUpcomingRotations: {
    user: Person;
    shift: { startDate: string; endDate: string };
  }[];
  teammatesAway: {
    user: Person;
    unavailabilities: { startDate: string; endDate: string }[];
  }[];
};
