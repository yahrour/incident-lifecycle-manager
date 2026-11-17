import Joi from "joi";

export const validationSchema = Joi.object({
  TZ: Joi.string().required().equal("UTC"),
  NODE_ENV: Joi.string()
    .valid(...["development", "production"])
    .required(),
  DATABASE_URL: Joi.string().uri().required(),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().default(3600),
  JWT_REFRESH_TOKEN_TTL: Joi.number().default(604800),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  IMPORT_MAX_FILE_BYTES: Joi.number().required(),
});
