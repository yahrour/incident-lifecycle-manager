import { Role } from "@/generated/prisma/client";
export interface ActiveUserData {
  sub: string;
  email: string;
  role: Role;
}
