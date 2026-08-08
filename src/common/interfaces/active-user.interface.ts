import { Role } from "@/generated/prisma/client";
export interface ActiveUserData {
  sub: string;
  role: Role;
}
