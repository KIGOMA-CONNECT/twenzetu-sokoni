import { EntityId, IRepository } from '@afri-market/kernel';
import { MicroLoan } from './micro-loan.aggregate';

export interface IMicroLoanRepository extends IRepository<MicroLoan, EntityId> {
  findByBorrowerId(borrowerId: string): Promise<MicroLoan[]>;
  findActiveByTenant(tenantId: string): Promise<MicroLoan[]>;
}
