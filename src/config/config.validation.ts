import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('NMSports API'),
  APP_VERSION: Joi.string().default('1.0.0'),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
  API_PREFIX: Joi.string().default('api/v1'),

  MONGODB_URI: Joi.string().required().messages({
    'any.required': 'MONGODB_URI is required — set it in your .env file',
    'string.empty': 'MONGODB_URI cannot be empty',
  }),

  JWT_ACCESS_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_ACCESS_SECRET is required',
    'string.min': 'JWT_ACCESS_SECRET must be at least 32 characters',
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_REFRESH_SECRET is required',
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters',
  }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  THROTTLE_AUTH_TTL: Joi.number().default(900000),
  THROTTLE_AUTH_LIMIT: Joi.number().default(10),
  THROTTLE_PUBLIC_TTL: Joi.number().default(60000),
  THROTTLE_PUBLIC_LIMIT: Joi.number().default(300),

  REQUEST_SIZE_LIMIT: Joi.string().default('10kb'),
  REQUEST_TIMEOUT_MS: Joi.number().default(30000),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),

  SUPER_ADMIN_EMAIL: Joi.string().email().required(),
  SUPER_ADMIN_USERNAME: Joi.string().min(3).required(),
  SUPER_ADMIN_PASSWORD: Joi.string().min(8).required(),

  UPLOAD_DEST: Joi.string().default('./uploads'),
  UPLOAD_MAX_SIZE_MB: Joi.number().default(5),
  ALLOWED_IMAGE_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/webp,image/svg+xml',
  ),

  ORG_LOGO_MAX_WIDTH: Joi.number().default(800),
  ORG_LOGO_MAX_HEIGHT: Joi.number().default(800),

  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_TITLE: Joi.string().default('NMSports API'),
  SWAGGER_DESCRIPTION: Joi.string().default('NMSports SaaS API'),
  SWAGGER_VERSION: Joi.string().default('1.0'),
  SWAGGER_PATH: Joi.string().default('api/docs'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),
  REDIS_TTL: Joi.number().default(300),
  REDIS_MAX_ITEMS: Joi.number().default(1000),
  REDIS_ENABLED: Joi.string().valid('true', 'false').default('true'),
});
