import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { CountryCode, normalizeE164 } from './phone-lookup';
import { SmsMessage, SendSmsResult, SmsProvider } from './sms-provider.interface';
import { AfricasTalkingProvider } from './providers/africas-talking.provider';
import { TwilioProvider } from './providers/twilio.provider';
import { TermiiProvider } from './providers/termii.provider';

export interface RoutedSms extends SmsMessage {
  readonly countryCode: CountryCode;
}

/**
 * Routes an outbound SMS to the best available provider for the recipient's
 * country, with a deterministic fallback chain so a single misconfigured or
 * failing gateway never blocks a message.
 *
 * Provider preference per country can be tuned with env vars:
 *   SMS_PROVIDER_TZ=twilio, SMS_PROVIDER_NG=termii, ...
 * Unset countries fall back to SMS_PROVIDER_DEFAULT (africastalking), then to
 * any configured provider, and finally to a simulated send (development).
 */
@Injectable()
export class CountrySmsRouterService {
  private readonly providers: Record<string, SmsProvider>;

  constructor(private readonly logger: AppLoggerService) {
    this.providers = {
      africastalking: new AfricasTalkingProvider(logger),
      twilio: new TwilioProvider(logger),
      termii: new TermiiProvider(logger),
    };
  }

  public get defaultCountry(): CountryCode {
    const raw = process.env.SMS_DEFAULT_COUNTRY || 'TZ';
    return raw.toUpperCase() as CountryCode;
  }

  public detectCountry(phone: string): CountryCode {
    return normalizeE164(phone, this.defaultCountry).countryCode;
  }

  public normalize(phone: string): string {
    return normalizeE164(phone, this.defaultCountry).e164;
  }

  public preferredProviderFor(country: CountryCode): SmsProvider | null {
    const explicit = process.env[`SMS_PROVIDER_${country.toUpperCase()}`];
    if (explicit && this.providers[explicit.toLowerCase()]?.isConfigured) {
      return this.providers[explicit.toLowerCase()];
    }
    const fallback = process.env.SMS_PROVIDER_DEFAULT || 'africastalking';
    if (this.providers[fallback.toLowerCase()]?.isConfigured) {
      return this.providers[fallback.toLowerCase()];
    }
    return this.firstConfiguredProvider();
  }

  public providerChainFor(country: CountryCode): SmsProvider[] {
    const preferred = this.preferredProviderFor(country);
    const chain: SmsProvider[] = [];
    if (preferred) chain.push(preferred);
    for (const provider of Object.values(this.providers)) {
      if (provider.isConfigured && !chain.includes(provider)) {
        chain.push(provider);
      }
    }
    if (chain.length === 0) {
      chain.push(this.providers.africastalking);
    }
    return chain;
  }

  public async send(message: SmsMessage): Promise<SendSmsResult> {
    const { e164, countryCode } = normalizeE164(message.to, this.defaultCountry);
    const routed: RoutedSms = { ...message, to: e164, countryCode };
    this.logger.log(
      `SMS to ${e164} [${countryCode}] via country router: ${message.message.substring(0, 50)}...`,
      'CountrySmsRouterService',
    );

    let lastResult: SendSmsResult = { success: false, provider: 'none' };
    for (const provider of this.providerChainFor(countryCode)) {
      lastResult = await provider.send(routed);
      if (lastResult.success) {
        return lastResult;
      }
    }
    return lastResult;
  }

  private firstConfiguredProvider(): SmsProvider | null {
    return Object.values(this.providers).find((p) => p.isConfigured) ?? null;
  }
}
