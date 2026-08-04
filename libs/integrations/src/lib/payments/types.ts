export type MobileMoneyProvider =
  | 'mpesa'
  | 'mixx_by_yas'
  | 'tigo_money'
  | 'tigo_pesa'
  | 'airtel_money'
  | 'halotel'
  | 'azampesa';

export type PaymentChannel = MobileMoneyProvider | 'card' | 'bank' | 'cash';

export interface PaymentInitiationParams {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  description: string;
  provider?: string;
  currency?: string;
  tenantId?: string;
  callbackUrl?: string;
}

export interface PaymentInitiationResult {
  reference: string;
  success: boolean;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED';
  message?: string;
  provider?: string;
  raw?: unknown;
}

export interface PaymentStatusResponse {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionId?: string;
  receiptNumber?: string;
}

export interface ReversePaymentResult {
  success: boolean;
  message?: string;
}

export interface IPaymentProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  checkPaymentStatus(reference: string): Promise<PaymentStatusResponse>;
  reversePayment(transactionId: string, amount: number, reason: string): Promise<ReversePaymentResult>;
}

export const MNO_PROVIDERS: MobileMoneyProvider[] = [
  'mpesa',
  'mixx_by_yas',
  'tigo_money',
  'tigo_pesa',
  'airtel_money',
  'halotel',
  'azampesa',
];

export const PROVIDER_LABELS: Record<string, string> = {
  mpesa: 'M-Pesa',
  mixx_by_yas: 'Mixx by Yas',
  tigo_money: 'Tigo Pesa',
  tigo_pesa: 'Tigo Pesa',
  airtel_money: 'Airtel Money',
  halotel: 'HaloPesa',
  azampesa: 'AzamPesa',
  card: 'Card',
  bank: 'Bank',
  cash: 'Cash',
};

export const AZAMPAY_PROVIDER_MAP: Record<string, string> = {
  mpesa: 'Mpesa',
  mixx_by_yas: 'Mpesa',
  tigo_money: 'Tigo',
  tigo_pesa: 'Tigo',
  airtel_money: 'Airtel',
  halotel: 'Halopesa',
  azampesa: 'Azampesa',
};

export function normalizeProvider(provider?: string): MobileMoneyProvider {
  const value = (provider || 'mpesa').toLowerCase().trim() as string;
  return (MNO_PROVIDERS as string[]).includes(value) ? (value as MobileMoneyProvider) : 'mpesa';
}

export function providerLabel(provider?: string): string {
  return PROVIDER_LABELS[provider ?? ''] ?? provider ?? 'M-Pesa';
}

export function isAzamPayRoutable(provider?: string): boolean {
  return AZAMPAY_PROVIDER_MAP[normalizeProvider(provider)] !== undefined;
}
