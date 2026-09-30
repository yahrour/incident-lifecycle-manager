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
  unavailabilities: Omit<Unavailability, "teamMember">[];
};

export type Unavailability = {
  id: number;
  memberId: number;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
  confirmed: boolean;
  teamMember: {
    id: number;
    user: User;
  };
};
