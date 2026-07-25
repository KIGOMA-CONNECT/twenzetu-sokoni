import { Inject, Injectable } from '@nestjs/common';
import { HyperlocalPoi, IHyperlocalPoiRepository, PoiType } from '@afri-market/marketplace-domain';
import { HYPERLOCAL_POI_REPOSITORY } from '../../tokens';

interface NearbyPoiResult {
  poiId: string;
  name: string;
  localName: string | undefined;
  type: PoiType;
  latitude: number;
  longitude: number;
  streetAddress: string | undefined;
  landmarkDescription: string | undefined;
  verificationCount: number;
  distanceKm: number;
}

@Injectable()
export class FindNearbyPoiUseCase {
  constructor(
    @Inject(HYPERLOCAL_POI_REPOSITORY) private readonly poiRepo: IHyperlocalPoiRepository,
  ) {}

  public async execute(params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    type?: PoiType;
  }): Promise<NearbyPoiResult[]> {
    let pois: HyperlocalPoi[];

    if (params.type) {
      pois = await this.poiRepo.findByType(params.type);
    } else {
      pois = await this.poiRepo.findByProximity(
        params.latitude,
        params.longitude,
        params.radiusKm,
      );
    }

    return pois
      .map((poi) => ({
        poiId: poi.id.value,
        name: poi.name,
        localName: poi.localName,
        type: poi.type,
        latitude: poi.latitude,
        longitude: poi.longitude,
        streetAddress: poi.streetAddress,
        landmarkDescription: poi.landmarkDescription,
        verificationCount: poi.verificationCount,
        distanceKm: this.calculateDistance(
          params.latitude, params.longitude,
          poi.latitude, poi.longitude,
        ),
      }))
      .filter((poi) => poi.distanceKm <= params.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
