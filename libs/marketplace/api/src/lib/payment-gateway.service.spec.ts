import { MobileMoneyService } from '@afri-market/integrations';

const originalEnv = process.env;

function cleanEnv(): void {
  process.env = { ...originalEnv };
  delete process.env.AZAMPAY_APP_NAME;
  delete process.env.AZAMPAY_CLIENT_ID;
  delete process.env.AZAMPAY_CLIENT_SECRET;
  delete process.env.AZAMPAY_API_KEY;
  delete process.env.MPESA_CONSUMER_KEY;
  delete process.env.MPESA_CONSUMER_SECRET;
}

const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as never;

describe('MobileMoneyService (payment gateway dispatcher)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanEnv();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('falls back to sandbox when no credentials are configured', async () => {
    const service = new MobileMoneyService(mockLogger);
    const result = await service.initiateStkPush({
      phoneNumber: '0712345678',
      amount: 5000,
      accountReference: 'order-1',
      description: 'test',
      provider: 'tigo_pesa',
    });

    expect(result.responseCode).toBe('0');
    expect(result.checkoutRequestId).toMatch(/^ws_/);
  });

  it('routes Tanzanian providers to AzamPay when configured', async () => {
    process.env.AZAMPAY_APP_NAME = 'AfriMarket';
    process.env.AZAMPAY_CLIENT_ID = 'client-id';
    process.env.AZAMPAY_CLIENT_SECRET = 'client-secret';

    const service = new MobileMoneyService(mockLogger);
    const azamPay = (service as unknown as { azamPay: { initiatePayment: jest.Mock } }).azamPay;
    azamPay.initiatePayment = jest.fn().mockResolvedValue({
      reference: 'azp-123',
      success: true,
      status: 'INITIATED',
      provider: 'TigoPesa',
      message: 'Checkout initiated',
    });

    const result = await service.initiateStkPush({
      phoneNumber: '255712345678',
      amount: 5000,
      accountReference: 'order-1',
      description: 'test',
      provider: 'tigo_pesa',
      currency: 'TZS',
    });

    expect(azamPay.initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'tigo_pesa', currency: 'TZS' }),
    );
    expect(result.responseCode).toBe('0');
    expect(result.checkoutRequestId).toBe('azp-123');
  });

  it('uses M-Pesa provider when AzamPay is not configured and M-Pesa credentials are set', async () => {
    process.env.MPESA_CONSUMER_KEY = 'key';
    process.env.MPESA_CONSUMER_SECRET = 'secret';

    const service = new MobileMoneyService(mockLogger);
    const mpesa = (service as unknown as { mpesa: { initiatePayment: jest.Mock } }).mpesa;
    mpesa.initiatePayment = jest.fn().mockResolvedValue({
      reference: 'mpesa-ref',
      success: true,
      status: 'INITIATED',
      provider: 'mpesa',
    });

    const result = await service.initiateStkPush({
      phoneNumber: '0712345678',
      amount: 1000,
      accountReference: 'order-2',
      description: 'test',
    });

    expect(mpesa.initiatePayment).toHaveBeenCalled();
    expect(result.checkoutRequestId).toBe('mpesa-ref');
  });

  it('returns a failed response code when initiation fails', async () => {
    process.env.AZAMPAY_APP_NAME = 'AfriMarket';
    process.env.AZAMPAY_CLIENT_ID = 'client-id';
    process.env.AZAMPAY_CLIENT_SECRET = 'client-secret';

    const service = new MobileMoneyService(mockLogger);
    const azamPay = (service as unknown as { azamPay: { initiatePayment: jest.Mock } }).azamPay;
    azamPay.initiatePayment = jest.fn().mockResolvedValue({
      reference: 'order-3',
      success: false,
      status: 'FAILED',
      message: 'Insufficient funds',
    });

    const result = await service.initiateStkPush({
      phoneNumber: '0712345678',
      amount: 1000,
      accountReference: 'order-3',
      description: 'test',
      provider: 'airtel_money',
    });

    expect(result.responseCode).toBe('1');
    expect(result.responseDescription).toBe('Insufficient funds');
  });

  it('verifies callbacks for AzamPay against the configured API key', () => {
    process.env.AZAMPAY_API_KEY = 'secret-key';
    const service = new MobileMoneyService(mockLogger);

    expect(service.verifyCallback('azampay', { 'x-api-key': 'secret-key' })).toBe(true);
    expect(service.verifyCallback('azampay', { 'x-api-key': 'wrong-key' })).toBe(false);
    expect(service.verifyCallback('azampay', {}, { password: 'secret-key' })).toBe(true);
    expect(service.verifyCallback('azampay', {}, { password: 'wrong-key' })).toBe(false);
    expect(service.verifyCallback('mpesa', {})).toBe(true);
  });
});
