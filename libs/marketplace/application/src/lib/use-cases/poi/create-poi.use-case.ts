import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { HyperlocalPoi, IHyperlocalPoiRepository, PoiType, PoiSource } from '@afri-market/marketplace-domain';
import { HYPERLOCAL_POI_REPOSITORY } from '../../tokens';

@Injectable()
export class CreatePoiUseCase {
  constructor(
    @Inject(HYPERLOCAL_POI_REPOSITORY) private readonly poiRepo: IHyperlocalPoiRepository,
  ) {}

  public async execute(tenantId: string, params: {
    name: string;
    localName?: string;
    description?: string;
    type: string;
    latitude: number;
    longitude: number;
    streetAddress?: string;
    landmarkDescription?: string;
    submittedBy: string;
    source: string;
  }): Promise<{ poiId: string; name: string }> {
    const poi = HyperlocalPoi.create({
      tenantId: TenantId.create(tenantId),
      name: params.name,
      localName: params.localName,
      description: params.description,
      type: params.type as PoiType,
      latitude: params.latitude,
      longitude: params.longitude,
      streetAddress: params.streetAddress,
      landmarkDescription: params.landmarkDescription,
      submittedBy: EntityId.from(params.submittedBy),
      source: params.source as PoiSource,
    });

    await this.poiRepo.save(poi);

    return { poiId: poi.id.value, name: poi.name };
  }
}
