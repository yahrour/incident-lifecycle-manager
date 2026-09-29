import { isValidTimeZone } from "@/utils/timezone";
import { z } from "zod";

export const settingsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name can't be empty.")
    .max(50, "First name must be at most 50 characters."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name can't be empty.")
    .max(50, "Last name must be at most 50 characters."),
  specialty: z
    .string()
    .trim()
    .min(1, "Specialty can't be empty.")
    .max(100, "Specialty must be at most 100 characters."),
  timezone: z.string().refine((tz) => isValidTimeZone(tz), {
    error: "Invalid IANA time zone format.",
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
