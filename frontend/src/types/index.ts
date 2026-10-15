export * from "./unavailabilities.types";
export * from "./sort.types";

export const Role = {
  SRE: "SRE",
  ENGINEER: "ENGINEER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  timezone: string;
  specialty: string;
  avatarInitials: string;
};

export type ApiResponse<T> = {
  data: T;
  meta?: {
    nextCursor?: string | null;
    total?: number;
  };
};

export type ApiError = {
  error: string;
  message: string | string[];
  statusCode: number;
};
