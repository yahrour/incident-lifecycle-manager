import { Role, type Unavailability } from "@/types";

export type Team = {
  id: string;
  name: string;
  services: string[];
  description: string | null;
  rotationPeriodDays: number;
  rotationStartDate: Date;
  escalationTimeoutMinutes: number;
  createdAt: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string | null;
  role: typeof Role.ENGINEER;
};

export type Member = {
  user: User;
  teamId: string;
  id: number;
  joinedAt: Date;
  unavailabilities: Unavailability[];
  team?: {
    id: string;
    name: string;
  };
};

type TeamMember = {
  id: number;
  user: User;
  team: {
    id: string;
    name: string;
  };
};

export type UnavailabilityWithTeamMember = Unavailability & {
  teamMember: TeamMember;
};
