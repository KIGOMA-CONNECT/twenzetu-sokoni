import { z } from 'zod';

export const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default('afriMarket'),
  APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_BOOTSTRAP_USER: z.string().default('postgres'),
  DB_BOOTSTRAP_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('afri_market'),
  DB_OWNER_USER: z.string().default('afri_owner'),
  DB_OWNER_PASSWORD: z.string().default('afri_owner_dev_password'),
  DB_RUNTIME_USER: z.string().default('afri_runtime'),
  DB_RUNTIME_PASSWORD: z.string().default('afri_runtime_dev_password'),
  JWT_SECRET: z.string().default('dev-jwt-secret'),
  JWT_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(5),
  OTP_LENGTH: z.coerce.number().default(6),
  SMS_DEFAULT_COUNTRY: z.string().default('TZ'),
  DEFAULT_CURRENCY: z.string().default('TZS'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;
