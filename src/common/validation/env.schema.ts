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
  JWT_AUDIENCE: Joi.string().required(),
  JWT_ISSUER: Joi.string().required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  // Mail (Mailtrap for now)
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().default(2525),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().email().default("no-reply@myapp.com"),
  MAIL_FROM_NAME: Joi.string().default("My NestJS App"),
});
