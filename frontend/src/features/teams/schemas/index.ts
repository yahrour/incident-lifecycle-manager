import { isValidTimeZone } from "@/utils/timezone";
import z from "zod";
import {
  DEFAULT_ESCALATION_TIMEOUT_MINUTES,
  DEFAULT_ROTATION_PERIOD_DAYS,
} from "../constants";

export const createTeamSchema = z
  .object({
    name: z.string().min(1, "set a name for the team"),
    description: z.string().optional(),
    rotationPeriodDays: z
      .number("rotation period must be a positive number")
      .positive()
      .default(DEFAULT_ROTATION_PERIOD_DAYS)
      .optional(),

    rotationStartDate: z.date().optional(),
    timezone: z
      .string()
      .refine((tz: unknown) => isValidTimeZone(tz), {
        error: "Invalid IANA timezone",
      })
      .nullable()
      .optional(),

    escalationTimeoutMinutes: z
      .number("escalation timeout must be a positive number")
      .positive()
      .default(DEFAULT_ESCALATION_TIMEOUT_MINUTES)
      .optional(),
    webhookUrl: z.url().optional(),
  })
  .superRefine((data, ctx) => {
    const hasStartDate =
      data.rotationStartDate !== undefined && data.rotationStartDate !== null;
    const hasTimezone = data.timezone !== undefined && data.timezone !== null;

    if (!hasStartDate && !hasTimezone) {
      return;
    }

    if (hasStartDate && !hasTimezone) {
      ctx.addIssue({
        code: "custom",
        path: ["timezone"],
        message: "timezone is required with rotation start date.",
      });
    }

    if (!hasStartDate && hasTimezone) {
      ctx.addIssue({
        code: "custom",
        path: ["rotationStartDate"],
        message: "rotation start date is required with timezone.",
      });
    }
  });
