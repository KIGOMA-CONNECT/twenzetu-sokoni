import { CountrySmsRouterService } from '@afri-market/integrations';
import { AppLoggerService } from '@afri-market/core-logger';

describe('CountrySmsRouterService', () => {
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as AppLoggerService;

  let router: CountrySmsRouterService;

  beforeEach(() => {
    delete process.env.SMS_PROVIDER_TZ;
    delete process.env.SMS_PROVIDER_NG;
    delete process.env.SMS_PROVIDER_DEFAULT;
    delete process.env.SMS_DEFAULT_COUNTRY;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM;
    delete process.env.TERMII_API_KEY;
    delete process.env.AT_API_KEY;
    router = new CountrySmsRouterService(logger);
  });

  describe('detectCountry', () => {
    it('detects the country from the number prefix', () => {
      expect(router.detectCountry('+254712345678')).toBe('KE');
      expect(router.detectCountry('+255754100003')).toBe('TZ');
      expect(router.detectCountry('+2348031234567')).toBe('NG');
    });
  });

  describe('normalize', () => {
    it('returns the E.164 form of the phone', () => {
      expect(router.normalize('0754100003')).toBe('+255754100003');
    });
  });

  describe('providerChainFor', () => {
    it('falls back to a simulated provider when none is configured', () => {
      const chain = router.providerChainFor('TZ');
      expect(chain.length).toBe(1);
      expect(chain[0].name).toBe('africastalking');
    });

    it('honours an explicit country override env var', () => {
      process.env.TERMII_API_KEY = 'test-key';
      process.env.SMS_PROVIDER_TZ = 'termii';
      const configured = new CountrySmsRouterService(logger);
      expect(configured.preferredProviderFor('TZ')?.name).toBe('termii');
    });

    it('honours the global default env var', () => {
      process.env.TWILIO_ACCOUNT_SID = 'ACxxx';
      process.env.TWILIO_AUTH_TOKEN = 'tok';
      process.env.TWILIO_FROM = '+1234';
      process.env.SMS_PROVIDER_DEFAULT = 'twilio';
      const configured = new CountrySmsRouterService(logger);
      expect(configured.preferredProviderFor('KE')?.name).toBe('twilio');
    });

    it('builds a fallback chain of all configured providers', () => {
      process.env.TWILIO_ACCOUNT_SID = 'ACxxx';
      process.env.TWILIO_AUTH_TOKEN = 'tok';
      process.env.TWILIO_FROM = '+1234';
      process.env.TERMII_API_KEY = 'test-key';
      const configured = new CountrySmsRouterService(logger);
      const chain = configured.providerChainFor('KE');
      expect(chain.map((p) => p.name)).toEqual(expect.arrayContaining(['twilio', 'termii']));
    });
  });

  describe('send', () => {
    it('simulates a successful send when no gateway is configured', async () => {
      const result = await router.send({ to: '0754100003', message: 'Test SMS' });
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.provider).toBeDefined();
    });

    it('routes a Kenyan number through the chain without throwing', async () => {
      const result = await router.send({ to: '+254712345678', message: 'Hello' });
      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
    });
  });
});
