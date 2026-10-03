import { z } from "zod";

export const registerViaInviteSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  specialty: z
    .string()
    .trim()
    .min(1, "Specialty is required")
    .max(50, "Specialty is too long"),
});

export type RegisterViaInviteValues = z.infer<typeof registerViaInviteSchema>;

export type RegisterViaInvitePayload = RegisterViaInviteValues & {
  token: string;
};
