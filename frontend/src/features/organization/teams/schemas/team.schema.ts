import { isValidTimeZone } from "@/utils/timezone";
import z from "zod";
import { isBefore, startOfDay } from "date-fns";
import { servicesSchema } from "./service.schema";

export const createTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Team name is required")
      .max(50, "name must not exceed 50 characters"),

    services: servicesSchema,

    description: z
      .string()
      .trim()
      .max(255, "description must not exceed 255 characters")
      .optional(),

    rotationPeriodDays: z
      .number({ error: "Rotation period must be a number" })
      .int("Rotation period must be a whole number")
      .max(30, "Rotation period must not exceed 30 days")
      .positive("Rotation period must be at least 1 day")
      .optional(),

    rotationStartDate: z.date().optional(),

    timezone: z
      .string()
      .refine((tz) => tz === "" || isValidTimeZone(tz), {
        error: "Invalid IANA timezone",
      })
      .optional(),

    escalationTimeoutMinutes: z
      .number({ error: "Escalation timeout must be a number" })
      .int("Escalation timeout must be a whole number")
      .max(1440, "Escalation timeout must not exceed 1440 minutes (24 hours)")
      .positive("Escalation timeout must be at least 1 minute")
      .optional(),
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

export const updateTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Team name is required")
      .max(50, "Name must not exceed 50 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(255, "Description must not exceed 255 characters")
      .optional()
      .nullable(),

    services: servicesSchema.optional(),

    rotationPeriodDays: z
      .number({ error: "Rotation period must be a number" })
      .int("Rotation period must be a whole number")
      .max(30, "Rotation period must not exceed 30 days")
      .positive("Rotation period must be at least 1 day")
      .optional(),

    escalationTimeoutMinutes: z
      .number({ error: "Escalation timeout must be a number" })
      .int("Escalation timeout must be a whole number")
      .max(1440, "Escalation timeout must not exceed 1440 minutes (24 hours)")
      .positive("Escalation timeout must be at least 1 minute")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const providedFields = Object.values(data).filter((v) => v !== undefined);
    if (providedFields.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: [],
        message: "At least one field must be provided to update the team.",
      });
    }
  });
