import z from "zod";

export const inviteSchema = z.object({
  inviteEmail: z.email("Invalid email address"),
  teamId: z.uuid(),
  expiresIn: z
    .union([
      z.literal(1),
      z.literal(12),
      z.literal(24),
      z.literal(48),
      z.literal(72),
      z.literal(168),
    ])
    .optional(),
});
