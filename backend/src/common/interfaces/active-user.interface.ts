import type { Request } from "express";
import { Role } from "@/generated/prisma/client";
export interface ActiveUserData {
  sub: string;
  role: Role;
}

export type AuthRequest = Request & { user: ActiveUserData };
