import { EntityId, IRepository } from '@afri-market/kernel';
import { CustomProcurement } from './custom-procurement.aggregate';

export interface ICustomProcurementRepository extends IRepository<CustomProcurement, EntityId> {
  findByCustomerId(customerId: string): Promise<CustomProcurement[]>;
}
