import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "Must be at most 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Must be at most 50 characters"),
  email: z
    .email("Enter a valid email")
    .max(255, "Must be at most 255 characters"),
  password: z
    .string()
    .min(8, "Must be at least 8 characters")
    .max(70, "Must be at most 72 characters"),
});

export type SignUpCredentials = z.infer<typeof signUpSchema>;
