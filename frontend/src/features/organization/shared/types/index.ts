import { Role } from "@/types";

export type Team = {
  id: string;
  name: string;
  services: string[];
  description: string | null;
  rotationPeriodDays: number;
  rotationStartDate: Date;
  escalationTimeoutMinutes: number;
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
  team?: {
    id: string;
    name: string;
  };
};

export type Unavailability = {
  id: number;
  memberId: number;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
  confirmed: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  teamMember: {
    id: number;
    user: User;
  };
};

export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
