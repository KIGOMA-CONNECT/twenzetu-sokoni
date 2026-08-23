import { EntityId, IRepository } from '@afri-market/kernel';
import { PosShift } from './pos-shift.aggregate';

export interface IPosShiftRepository extends IRepository<PosShift, EntityId> {
  findOpenByVendor(vendorId: string): Promise<PosShift | null>;
  findByVendorAndDate(vendorId: string, start: Date, end: Date): Promise<PosShift[]>;
  countByVendorAndDay(vendorId: string, start: Date, end: Date): Promise<number>;
}
