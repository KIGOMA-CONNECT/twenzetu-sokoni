import { Injectable } from '@nestjs/common';
import { EnvConfig, envSchema } from './env.schema';

@Injectable()
export class AppConfigService {
  private readonly config: EnvConfig;

  constructor() {
    this.config = envSchema.parse(process.env);
  }

  public get app() {
    return {
      port: this.config.APP_PORT,
      name: this.config.APP_NAME,
      env: this.config.APP_ENV,
    };
  }

  public get db() {
    return {
      host: this.config.DB_HOST,
      port: this.config.DB_PORT,
      bootstrapUser: this.config.DB_BOOTSTRAP_USER,
      bootstrapPassword: this.config.DB_BOOTSTRAP_PASSWORD,
      name: this.config.DB_NAME,
      ownerUser: this.config.DB_OWNER_USER,
      ownerPassword: this.config.DB_OWNER_PASSWORD,
      runtimeUser: this.config.DB_RUNTIME_USER,
      runtimePassword: this.config.DB_RUNTIME_PASSWORD,
    };
  }

  public get jwt() {
    return {
      secret: this.config.JWT_SECRET,
      expiry: this.config.JWT_EXPIRY,
      refreshExpiry: this.config.JWT_REFRESH_EXPIRY,
    };
  }

  public get sms() {
    return {
      defaultCountry: this.config.SMS_DEFAULT_COUNTRY,
    };
  }

  public get currency() {
    return {
      defaultCurrency: this.config.DEFAULT_CURRENCY,
    };
  }

  public get otp() {
    return {
      expiryMinutes: this.config.OTP_EXPIRY_MINUTES,
      length: this.config.OTP_LENGTH,
    };
  }

  public get cors() {
    return {
      origins: this.config.CORS_ORIGINS.split(',').map((s) => s.trim()),
    };
  }

  public get push() {
    return {
      publicKey: this.config.VAPID_PUBLIC_KEY,
      privateKey: this.config.VAPID_PRIVATE_KEY,
      subject: this.config.VAPID_SUBJECT,
    };
  }

  public get ussd() {
    const force = this.config.USSD_SIMULATE_ENABLED.trim().toLowerCase();
    const envDefault = this.config.APP_ENV !== 'production';
    return {
      callbackSecret: this.config.USSD_CALLBACK_SECRET,
      simulateEnabled: force === '' ? envDefault : force === 'true' || force === '1',
    };
  }

  public get beem() {
    return {
      apiKey: this.config.BEEM_API_KEY,
      secretKey: this.config.BEEM_SECRET_KEY,
      ussdCode: this.config.BEEM_USSD_CODE,
      callbackSecret: this.config.BEEM_CALLBACK_SECRET,
      payments: {
        apiKey: this.config.BEEM_PAYMENT_API_KEY,
        secretKey: this.config.BEEM_PAYMENT_SECRET_KEY,
      },
    };
  }

  public get googleMaps() {
    return {
      apiKey: this.config.GOOGLE_MAPS_API_KEY,
    };
  }

  public get fcm() {
    return {
      serverKey: this.config.GOOGLE_FCM_SERVER_KEY,
    };
  }

  public get ai() {
    return {
      provider: this.config.AI_PROVIDER,
      keys: {
        gemini: this.config.GEMINI_API_KEY,
        openai: this.config.OPENAI_API_KEY,
        anthropic: this.config.ANTHROPIC_API_KEY,
      },
      models: {
        gemini: this.config.GEMINI_MODEL,
        openai: this.config.OPENAI_MODEL,
        anthropic: this.config.ANTHROPIC_MODEL,
      },
      geminiBaseUrl: this.config.GEMINI_BASE_URL,
      temperature: this.config.AI_TEMPERATURE,
      maxOutputTokens: this.config.AI_MAX_TOKENS,
      timeoutMs: this.config.AI_TIMEOUT_MS,
    };
  }
}
