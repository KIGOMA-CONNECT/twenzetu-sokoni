import { EntityId } from '@afri-market/kernel';
import { ServiceQuote } from './service-quote.aggregate';

export interface IServiceQuoteRepository {
  findById(id: EntityId): Promise<ServiceQuote | null>;
  findByRequestId(requestId: string): Promise<ServiceQuote[]>;
  save(entity: ServiceQuote): Promise<void>;
}
