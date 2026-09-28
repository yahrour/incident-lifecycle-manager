export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export type SortState = { field: string; order: SortOrder };

export type InviteEngineer = { inviteLink: string };

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string | null;
};

export type Member = {
  user: User;
  teamId: string;
  id: number;
  joinedAt: Date;
};

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
