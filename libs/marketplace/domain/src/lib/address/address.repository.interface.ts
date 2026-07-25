import { EntityId, IRepository } from '@afri-market/kernel';
import { Address } from './address.aggregate';

export interface IAddressRepository extends IRepository<Address, EntityId> {
  findByUserId(userId: string): Promise<Address[]>;
  findDefaultByUserId(userId: string): Promise<Address | null>;
  clearDefault(userId: string): Promise<void>;
}
