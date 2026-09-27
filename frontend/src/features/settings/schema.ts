import { z } from "zod";
export const settingSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(50, "Must be at most 50 characters")
    .optional(),
  lastName: z
    .string()
    .trim()
    .max(50, "Must be at most 50 characters")
    .optional(),

  password: z
    .string()
    .min(8, "Must be at least 8 characters")
    .max(72, "Must be at most 72 characters"),
});
