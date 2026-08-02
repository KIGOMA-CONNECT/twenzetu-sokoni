export interface DeliveryFareInput {
  pickupLatitude: number;
  pickupLongitude: number;
  dropLatitude: number;
  dropLongitude: number;
  vehicleType?: 'boda' | 'bajaji' | 'carry' | 'guta' | 'fuso';
  currency: string;
}

export interface DeliveryFareResult {
  distanceKm: number;
  baseFare: number;
  distanceCharge: number;
  totalFare: number;
  vehicleType: string;
  currency: string;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

const VEHICLE_RATES: Record<string, { baseFare: number; perKmRate: number }> = {
  boda: { baseFare: 1000, perKmRate: 500 },
  bajaji: { baseFare: 2000, perKmRate: 800 },
  carry: { baseFare: 5000, perKmRate: 1500 },
  guta: { baseFare: 10000, perKmRate: 2500 },
  fuso: { baseFare: 20000, perKmRate: 4000 },
};

/**
 * Bolt-style delivery fare: base fare + distance charge (per km), floored
 * at the base fare so short trips are never free. Uses boda rates by default.
 */
export class DeliveryFareCalculator {
  public static calculate(input: DeliveryFareInput): DeliveryFareResult {
    const distanceKm = Math.max(
      0.5,
      Math.round(
        haversineKm(
          input.pickupLatitude,
          input.pickupLongitude,
          input.dropLatitude,
          input.dropLongitude,
        ) * 100,
      ) / 100,
    );
    const vehicleType = input.vehicleType ?? 'boda';
    const rates = VEHICLE_RATES[vehicleType] ?? VEHICLE_RATES.boda;
    const distanceCharge = Math.round(distanceKm * rates.perKmRate);
    const totalFare = Math.max(rates.baseFare, rates.baseFare + distanceCharge);

    return {
      distanceKm,
      baseFare: rates.baseFare,
      distanceCharge,
      totalFare,
      vehicleType,
      currency: input.currency,
    };
  }
}
