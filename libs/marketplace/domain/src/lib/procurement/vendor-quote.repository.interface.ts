import { EntityId, IRepository } from '@afri-market/kernel';
import { VendorQuote } from './vendor-quote.aggregate';

export interface IVendorQuoteRepository extends IRepository<VendorQuote, EntityId> {
  findByProcurementId(procurementId: string): Promise<VendorQuote[]>;
}
