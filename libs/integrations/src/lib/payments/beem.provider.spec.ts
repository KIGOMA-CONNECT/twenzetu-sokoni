import { AppLoggerService } from '@afri-market/core-logger';
import { BeemPaymentProvider } from './beem.provider';
import { httpRequest } from './http';

jest.mock('./http', () => ({
  httpRequest: jest.fn(),
}));

const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;

describe('BeemPaymentProvider', () => {
  let provider: BeemPaymentProvider;
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService;

  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env['BEEM_PAYMENT_API_KEY'];
    delete process.env['BEEM_PAYMENT_SECRET_KEY'];
    provider = new BeemPaymentProvider(logger);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reports not configured when payment credentials are missing', () => {
    expect(provider.isConfigured).toBe(false);
  });

  it('fails closed when not configured instead of simulating a checkout', async () => {
    const result = await provider.initiatePayment({
      phoneNumber: '255754100003',
      amount: 5000,
      accountReference: 'order-1',
      description: 'Payment',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });

  it('creates a hosted checkout and returns the redirect URL', async () => {
    process.env['BEEM_PAYMENT_API_KEY'] = 'pay-key';
    process.env['BEEM_PAYMENT_SECRET_KEY'] = 'pay-secret';
    provider = new BeemPaymentProvider(logger);

    mockHttpRequest.mockResolvedValue({
      src: 'https://checkout.beem.africa/pay/abc123',
      message: 'ok',
    } as never);

    const result = await provider.initiateCardCheckout({
      amount: 25000,
      accountReference: 'order-42',
      description: 'Grocery order',
    });

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBe('https://checkout.beem.africa/pay/abc123');
    expect(result.reference).toBeDefined();

    const [call] = mockHttpRequest.mock.calls[0];
    expect(call.method).toBe('GET');
    expect(call.url).toContain('/v1/checkout');
    expect(call.url).toContain('amount=25000');
    expect(call.url).toContain('reference_number=order-42');
    expect(call.url).toContain('sendSource=true');
    expect(call.headers?.Authorization).toMatch(/^Basic /);
  });

  it('returns FAILED when the checkout response lacks a redirect URL', async () => {
    process.env['BEEM_PAYMENT_API_KEY'] = 'pay-key';
    process.env['BEEM_PAYMENT_SECRET_KEY'] = 'pay-secret';
    provider = new BeemPaymentProvider(logger);

    mockHttpRequest.mockResolvedValue({ message: 'invalid amount' } as never);

    const result = await provider.initiateCardCheckout({
      amount: 25000,
      accountReference: 'order-42',
      description: 'Grocery order',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('invalid amount');
  });

  it('returns FAILED when the checkout network call throws', async () => {
    process.env['BEEM_PAYMENT_API_KEY'] = 'pay-key';
    process.env['BEEM_PAYMENT_SECRET_KEY'] = 'pay-secret';
    provider = new BeemPaymentProvider(logger);

    mockHttpRequest.mockRejectedValue(new Error('connection refused'));

    const result = await provider.initiateCardCheckout({
      amount: 1000,
      accountReference: 'order-7',
      description: 'Payment',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('connection refused');
  });

  it('returns the credit balance for the BPAY app', async () => {
    process.env['BEEM_PAYMENT_API_KEY'] = 'pay-key';
    process.env['BEEM_PAYMENT_SECRET_KEY'] = 'pay-secret';
    provider = new BeemPaymentProvider(logger);

    mockHttpRequest.mockResolvedValue({
      balance_infos: [{ app_name: 'BPAY', balance: 150000 }],
    } as never);

    const result = await provider.getBalance();

    expect(result.success).toBe(true);
    expect(result.balance).toBe(150000);
    expect(result.appName).toBe('BPAY');
    expect(mockHttpRequest.mock.calls[0][0].url).toContain('app_name=BPAY');
  });

  it('returns FAILED balance when the balance check throws', async () => {
    process.env['BEEM_PAYMENT_API_KEY'] = 'pay-key';
    process.env['BEEM_PAYMENT_SECRET_KEY'] = 'pay-secret';
    provider = new BeemPaymentProvider(logger);

    mockHttpRequest.mockRejectedValue(new Error('timeout'));

    const result = await provider.getBalance('BPAY');

    expect(result.success).toBe(false);
    expect(result.message).toContain('timeout');
  });

  it('fails closed for reversal and disbursement since those APIs are not implemented', async () => {
    process.env['BEEM_PAYMENT_API_KEY'] = 'pay-key';
    process.env['BEEM_PAYMENT_SECRET_KEY'] = 'pay-secret';
    provider = new BeemPaymentProvider(logger);

    await expect(provider.reversePayment('txn-1', 1000, 'refund')).resolves.toMatchObject({
      success: false,
    });
    await expect(
      provider.disburse({ phoneNumber: '255754100003', amount: 1000, reference: 'r-1' }),
    ).resolves.toMatchObject({ success: false });
  });
});