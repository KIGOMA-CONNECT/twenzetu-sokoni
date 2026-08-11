export type PosPaymentMethod =
  | 'cash'
  | 'mpesa'
  | 'tigo_pesa'
  | 'tigo_money'
  | 'airtel_money'
  | 'halotel'
  | 'azampesa'
  | 'card'
  | 'wallet';

export const POS_PAYMENT_METHODS: ReadonlyArray<PosPaymentMethod> = [
  'cash',
  'mpesa',
  'tigo_pesa',
  'tigo_money',
  'airtel_money',
  'halotel',
  'azampesa',
  'card',
  'wallet',
];

export function isPosPaymentMethod(value: string): value is PosPaymentMethod {
  return (POS_PAYMENT_METHODS as readonly string[]).includes(value);
}
