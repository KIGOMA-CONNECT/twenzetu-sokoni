import { EntityId, IRepository } from '@afri-market/kernel';
import { Menu } from './menu.aggregate';

export interface IMenuRepository extends IRepository<Menu, EntityId> {
  findByVendorId(vendorId: string): Promise<Menu[]>;
  findActive(vendorId: string): Promise<Menu[]>;
}
