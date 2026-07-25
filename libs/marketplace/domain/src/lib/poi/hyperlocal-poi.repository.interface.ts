import { EntityId, IRepository } from '@afri-market/kernel';
import { HyperlocalPoi } from './hyperlocal-poi.aggregate';
import { PoiType } from './poi-type';

export interface IHyperlocalPoiRepository extends IRepository<HyperlocalPoi, EntityId> {
  findByProximity(latitude: number, longitude: number, radiusKm: number): Promise<HyperlocalPoi[]>;
  findByType(type: PoiType): Promise<HyperlocalPoi[]>;
  findByTenant(tenantId: string): Promise<HyperlocalPoi[]>;
  findByDriver(driverId: string): Promise<HyperlocalPoi[]>;
}
