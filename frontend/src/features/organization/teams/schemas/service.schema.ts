import z from "zod";

export const servicesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Service name cannot be empty")
      .max(25, "service name must not exceed 25 characters")
  )
  .min(1, "At least one service is required")
  .max(20, "You can have a maximum of 20 services")
  .refine(
    (items) => new Set(items.map((s) => s.toLowerCase())).size === items.length,
    { error: "Services must be unique" }
  );
