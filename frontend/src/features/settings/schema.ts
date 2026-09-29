import { isValidTimeZone } from "@/utils/timezone";
import { z } from "zod";
export const settingsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(50, "Must be at most 50 characters")
    .optional(),
  specialty: z
    .string()
    .trim()
    .max(50, "Must be at most 50 characters")
    .optional(),
  lastName: z
    .string()
    .trim()
    .max(50, "Must be at most 50 characters")
    .optional(),
  timezone: z.string().refine((tz) => tz === "" || isValidTimeZone(tz), {
    error: "Invalid timezone",
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
