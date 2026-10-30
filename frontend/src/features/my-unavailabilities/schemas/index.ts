import { isValidTimeZone } from "@/utils/timezone";
import { isBefore, startOfDay } from "date-fns";
import z from "zod";

export const requestUnavailabilitySchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
    timezone: z.string().refine((tz) => isValidTimeZone(tz), {
      error: "Invalid IANA timezone",
    }),
    reason: z
      .string()
      .trim()
      .min(1)
      .max(255, "reason must not exceed 255 characters"),
  })
  .refine((d) => !isBefore(d.startDate, startOfDay(new Date())), {
    path: ["startDate"],
    error: "Start date can't be in the past",
  })
  .refine((d) => d.endDate >= d.startDate, {
    path: ["endDate"],
    error: "End date must be on or after the start date",
  });

export const updateUnavailabilitySchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
    timezone: z
      .string("Select a timezone")
      .refine((tz) => isValidTimeZone(tz), {
        error: "Invalid IANA timezone",
      }),
    reason: z
      .string()
      .trim()
      .min(1)
      .max(255, "reason must not exceed 255 characters"),
  })
  .refine((d) => !isBefore(d.startDate, startOfDay(new Date())), {
    path: ["startDate"],
    error: "Start date can't be in the past",
  })
  .refine((d) => d.endDate >= d.startDate, {
    path: ["endDate"],
    error: "End date must be on or after the start date",
  });
