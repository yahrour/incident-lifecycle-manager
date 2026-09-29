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

export type Member = {
  user: User;
  teamId: string;
  id: number;
  joinedAt: Date;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string | null;
};

export type UserWithRole = User & { role: typeof Role.ENGINEER };

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
