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

export type Engineer = UserWithRole;

export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export type SortState = { field: string; order: SortOrder };

export type InviteEngineer = { inviteLink: string };
