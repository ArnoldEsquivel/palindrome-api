import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().optional(),
  DATABASE_URL: Joi.string().required(),
  AUTO_SEED: Joi.boolean().default(false),
});
