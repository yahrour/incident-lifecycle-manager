export type Role = "SRE" | "ENGINEER";

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
