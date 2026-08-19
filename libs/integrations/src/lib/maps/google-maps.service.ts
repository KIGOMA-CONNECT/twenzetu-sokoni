import { Injectable } from '@nestjs/common';
import { httpRequest } from '../payments/http';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteEstimate {
  distanceKm: number;
  durationMinutes: number;
}

/**
 * Google Maps helpers used by the marketplace (Distance Matrix for delivery
 * distance/ETA). Reads GOOGLE_MAPS_API_KEY from the environment; every method
 * degrades gracefully to null when the key is missing or the request fails so
 * the calling flow never breaks without Maps configured.
 */
@Injectable()
export class GoogleMapsService {
  private readonly apiKey: string = process.env.GOOGLE_MAPS_API_KEY ?? '';

  public get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  public async routeDistanceKm(
    origin: LatLng,
    destination: LatLng,
  ): Promise<RouteEstimate | null> {
    if (!this.isConfigured) {
      return null;
    }
    try {
      const url =
        'https://maps.googleapis.com/maps/api/distancematrix/json' +
        `?units=metric&origins=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}` +
        `&destinations=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}` +
        `&key=${this.apiKey}`;
      const res = await httpRequest<{
        status?: string;
        rows?: { elements?: { status?: string; distance?: { value?: number }; duration?: { value?: number } }[] }[];
      }>({ method: 'GET', url, timeoutMs: 10000 });
      const element = res.rows?.[0]?.elements?.[0];
      if (
        res.status === 'OK' &&
        element?.status === 'OK' &&
        element.distance?.value !== undefined &&
        element.duration?.value !== undefined
      ) {
        return {
          distanceKm: Math.round((element.distance.value / 1000) * 100) / 100,
          durationMinutes: Math.max(1, Math.round(element.duration.value / 60)),
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}