export const Role = {
  SRE: "SRE",
  ENGINEER: "ENGINEER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatarInitials: string;
  email: string;
  role: Role;
};

export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  error: string;
  message: string | string[];
  statusCode: number;
};
