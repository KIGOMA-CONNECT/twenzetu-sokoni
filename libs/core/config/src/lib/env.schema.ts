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
  JWT_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(5),
  OTP_LENGTH: z.coerce.number().default(6),
  SMS_DEFAULT_COUNTRY: z.string().default('TZ'),
  DEFAULT_CURRENCY: z.string().default('TZS'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  VAPID_SUBJECT: z.string().default('mailto:support@afrimarket.co.tz'),
  USSD_CALLBACK_SECRET: z.string().default(''),
  USSD_SIMULATE_ENABLED: z.string().default(''),
  BEEM_API_KEY: z.string().default(''),
  BEEM_SECRET_KEY: z.string().default(''),
  BEEM_USSD_CODE: z.string().default(''),
  BEEM_CALLBACK_SECRET: z.string().default(''),
  BEEM_PAYMENT_API_KEY: z.string().default(''),
  BEEM_PAYMENT_SECRET_KEY: z.string().default(''),
  GOOGLE_MAPS_API_KEY: z.string().default(''),
  GOOGLE_FCM_SERVER_KEY: z.string().default(''),
}).superRefine((val, ctx) => {
  if (val.APP_ENV !== 'production') return;
  const defaults = new Set(['postgres', 'afri_owner_dev_password', 'afri_runtime_dev_password', 'dev-jwt-secret']);
  const checks: Array<[string, string]> = [
    ['DB_BOOTSTRAP_PASSWORD', val.DB_BOOTSTRAP_PASSWORD],
    ['DB_OWNER_PASSWORD', val.DB_OWNER_PASSWORD],
    ['DB_RUNTIME_PASSWORD', val.DB_RUNTIME_PASSWORD],
    ['JWT_SECRET', val.JWT_SECRET],
  ];
  for (const [key, value] of checks) {
    if (!value || defaults.has(value) || value.length < 12) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} must be a strong, non-default secret in production` });
    }
  }
});

export type EnvConfig = z.infer<typeof envSchema>;
