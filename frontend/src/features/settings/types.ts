import type { Role } from "@/types";

export type UserProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarInitials: string;
  email: string;
  role: Role;
  timezone: string | null;
  specialty: string | null;
};

export type ProfileFormProps = {
  user: UserProfile;
};
