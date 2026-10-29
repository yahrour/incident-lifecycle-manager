import Joi from "joi";

type Team = {
  name: string;
  description?: string | null;
  rotationPeriodDays: number;
  escalationTimeoutMinutes: number;
  services: string[];
};
const teamSchema = Joi.object<Team>({
  name: Joi.string().trim().min(1).max(50).required(),
  description: Joi.string().trim().max(255).allow(null, "").optional(),
  rotationPeriodDays: Joi.number().integer().min(1).max(30).required(),
  escalationTimeoutMinutes: Joi.number().integer().min(1).max(1440).required(),
  services: Joi.array()
    .items(Joi.string().trim().min(1).max(25))
    .min(1)
    .max(20)
    .unique((a: string, b: string) => a.toLowerCase() === b.toLowerCase())
    .required(),
});

export const importTeamsSchema = Joi.array()
  .items(teamSchema)
  .min(1)
  .unique((a: Team, b: Team) => a.name === b.name)
  .messages({ "array.unique": "Duplicate team name in file" })
  .required();
