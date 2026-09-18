export type Role = "SRE" | "ENGINEER";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatarInitials: string;
  email: string;
  role: Role;
};
