import { Role } from "@prisma/client";
export interface ActiveUserData {
  sub: string | number;
  email: string;
  role: Role;
}
