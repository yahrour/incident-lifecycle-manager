import { Role } from "src/generated/prisma/client";
export interface ActiveUserData {
  sub: string;
  email: string;
  role: Role;
}
