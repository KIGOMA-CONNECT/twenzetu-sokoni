import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GoogleMapsService } from '@afri-market/integrations';
import { haversineKm } from '@afri-market/marketplace-domain';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

/**
 * Estimates a delivery route's distance and ETA (Google Maps Distance Matrix
 * with a straight-line fallback) and persists the result onto the delivery.
 * Never throws: when Maps is unavailable it falls back to haversine, and if no
 * coordinates are given it simply leaves the columns untouched.
 */
@Injectable()
export class DeliveryRouteEstimator {
  constructor(
    private readonly dataSource: DataSource,
    private readonly maps: GoogleMapsService,
  ) {}

  public async estimateAndPersist(
    deliveryId: string,
    origin: RoutePoint,
    destination: RoutePoint,
  ): Promise<void> {
    if (
      !origin ||
      !destination ||
      !Number.isFinite(origin.latitude) ||
      !Number.isFinite(origin.longitude) ||
      !Number.isFinite(destination.latitude) ||
      !Number.isFinite(destination.longitude)
    ) {
      return;
    }

    let distanceKm: number;
    let durationMinutes: number;

    let google: Awaited<ReturnType<GoogleMapsService['routeDistanceKm']>> = null;
    try {
      google = await this.maps.routeDistanceKm(origin, destination);
    } catch {
      google = null;
    }
    if (google) {
      distanceKm = google.distanceKm;
      durationMinutes = google.durationMinutes;
    } else {
      distanceKm =
        Math.round(
          haversineKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude) * 100,
        ) / 100;
      durationMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
    }

    await this.dataSource.query(
      'UPDATE deliveries SET distance_km = $1, estimated_time_minutes = $2, updated_at = NOW() WHERE id = $3',
      [distanceKm, durationMinutes, deliveryId],
    );
  }
}