import z from "zod";

export const createApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must not exceed 50 characters"),
  expiresInDays: z.union([
    z.literal(7),
    z.literal(30),
    z.literal(90),
    z.literal(180),
    z.literal(365),
  ]),
});
