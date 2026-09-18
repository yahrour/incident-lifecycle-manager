import { isValidTimeZone } from "@/utils/timezone";
import z from "zod";
import {
  DEFAULT_ESCALATION_TIMEOUT_MINUTES,
  DEFAULT_ROTATION_PERIOD_DAYS,
} from "../constants";
import { isBefore, startOfDay } from "date-fns";

export const createTeamSchema = z
  .object({
    name: z
      .string()
      .min(1, "Team name is required")
      .max(50, "name must not exceed 50 characters"),
    description: z
      .string()
      .max(255, "description must not exceed 255 characters")
      .optional()
      .transform((val) => (val?.trim() === "" ? undefined : val)),
    rotationPeriodDays: z
      .number({ error: "Rotation period must be a number" })
      .int("Rotation period must be a whole number")
      .positive("Rotation period must be at least 1 day")
      .default(DEFAULT_ROTATION_PERIOD_DAYS),

    rotationStartDate: z.date().optional(),
    timezone: z
      .string()
      .refine((tz) => tz === "" || isValidTimeZone(tz), {
        error: "Invalid IANA timezone",
      })
      .optional()
      .transform((val) => (val?.trim() === "" ? undefined : val)),

    escalationTimeoutMinutes: z
      .number({ error: "Escalation timeout must be a number" })
      .int("Escalation timeout must be a whole number")
      .positive("Escalation timeout must be at least 1 minute")
      .default(DEFAULT_ESCALATION_TIMEOUT_MINUTES),

    webhookUrl: z
      .union([
        z
          .url("Enter a valid Discord webhook URL")
          .max(255, "webhook URL must not exceed 255 characters"),
        z.literal(""),
      ])
      .optional()
      .transform((val) => (val?.trim() === "" ? undefined : val)),
  })
  .superRefine((data, ctx) => {
    const hasStartDate = data.rotationStartDate !== undefined;
    const hasTimezone = data.timezone !== undefined && data.timezone !== "";

    if (hasStartDate !== hasTimezone) {
      if (hasStartDate) {
        ctx.addIssue({
          code: "custom",
          path: ["timezone"],
          message: "Timezone is required with a rotation start date.",
        });
      } else {
        ctx.addIssue({
          code: "custom",
          path: ["rotationStartDate"],
          message: "Rotation start date is required with a timezone.",
        });
      }
    }

    if (
      data.rotationStartDate &&
      isBefore(data.rotationStartDate, startOfDay(new Date()))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rotationStartDate"],
        message: "Rotation start date must be in the future.",
      });
    }
  });
