export type PaymentStatus = 'PENDING' | 'ESCROW_HELD' | 'RELEASED' | 'REFUNDED' | 'FAILED';
export type PaymentMethod =
  | 'mpesa'
  | 'tigo_money'
  | 'tigo_pesa'
  | 'airtel_money'
  | 'halotel'
  | 'azampesa'
  | 'cash';
