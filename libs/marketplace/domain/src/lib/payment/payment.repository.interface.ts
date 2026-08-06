import { EntityId, IRepository } from '@afri-market/kernel';
import { Payment } from './payment.aggregate';

export interface PaymentSearchFilters {
  status?: string;
  vendorId?: string;
  limit?: number;
  offset?: number;
}

export interface PaymentRevenueFilters {
  status?: string;
  since?: Date;
}

export interface IPaymentRepository extends IRepository<Payment, EntityId> {
  findByOrderId(orderId: string): Promise<Payment | null>;
  findPendingOlderThan(cutoff: Date, limit?: number): Promise<Payment[]>;
  search(tenantId: string, filters: PaymentSearchFilters): Promise<{ data: Payment[]; total: number }>;
  sumRevenue(tenantId: string, filters?: PaymentRevenueFilters): Promise<{ total: number; count: number }>;
  sumVendorNet(tenantId: string, filters?: PaymentRevenueFilters): Promise<number>;
  findByTransactionRef(transactionRef: string): Promise<Payment | null>;
  transitionStatus(
    id: string,
    fromStatus: string,
    toStatus: string,
    extra?: Partial<Pick<Payment, 'transactionRef' | 'confirmedAt'>>,
  ): Promise<boolean>;
}
