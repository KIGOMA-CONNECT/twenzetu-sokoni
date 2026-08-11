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

// ─────────────────────────────────────────────────────────────
// Cargo, Express & Logistics — binding fare engine
//
// World-class cargo pricing (weight-aware, distance-aware) while
// staying rooted in the local foundation: Tanzanian vehicle types,
// TZS pricing, Swahili breakdown labels, mobile-money-first
// (wallet / AzamPay MNO / card / cash) payment channels.
// ─────────────────────────────────────────────────────────────

export type CargoVehicleKey = 'boda' | 'bajaji' | 'carry' | 'van' | 'guta' | 'fuso';
export type CargoTripType = 'instant' | 'scheduled';

export interface CargoVehicleRate {
  key: CargoVehicleKey;
  name: string;
  emoji: string;
  baseFare: number;
  perKmRate: number;
  perKgRate: number;
  minFare: number;
  capacityKg: number;
}

export const CARGO_VEHICLE_RATES: Record<CargoVehicleKey, CargoVehicleRate> = {
  boda:   { key: 'boda',   name: 'Bodaboda', emoji: '🏍️', baseFare: 2000,  perKmRate: 500,  perKgRate: 200, minFare: 2000,  capacityKg: 5 },
  bajaji: { key: 'bajaji', name: 'TukTuk',   emoji: '🛺', baseFare: 3000,  perKmRate: 800,  perKgRate: 150, minFare: 5000,  capacityKg: 20 },
  carry:  { key: 'carry',  name: 'Pickup',   emoji: '🛻', baseFare: 10000, perKmRate: 2000, perKgRate: 50,  minFare: 20000, capacityKg: 500 },
  van:    { key: 'van',    name: 'Van',      emoji: '🚐', baseFare: 5000,  perKmRate: 1200, perKgRate: 80,  minFare: 10000, capacityKg: 100 },
  guta:   { key: 'guta',   name: 'Guta',     emoji: '🚚', baseFare: 15000, perKmRate: 3000, perKgRate: 30,  minFare: 30000, capacityKg: 2000 },
  fuso:   { key: 'fuso',   name: 'Lori',     emoji: '🚛', baseFare: 50000, perKmRate: 5000, perKgRate: 10,  minFare: 100000, capacityKg: 8000 },
};

export const CARGO_VEHICLE_KEYS: CargoVehicleKey[] = Object.keys(CARGO_VEHICLE_RATES) as CargoVehicleKey[];

export interface CargoFareInput {
  distanceKm: number;
  weightKg: number;
  vehicleType: CargoVehicleKey;
  tripType?: CargoTripType;
  insured?: boolean;
  cargoValue?: number;
  currency: string;
}

export interface CargoFareBreakdown {
  label: string;
  amount: number;
}

export interface CargoFareResult {
  distanceKm: number;
  baseFare: number;
  distanceCharge: number;
  weightCharge: number;
  insuranceFee: number;
  scheduledDiscount: number;
  subtotal: number;
  totalFare: number;
  vehicleType: CargoVehicleKey;
  vehicleName: string;
  emoji: string;
  capacityKg: number;
  currency: string;
  breakdown: CargoFareBreakdown[];
}

/**
 * Binding cargo fare: base + distance + weight, floored at the vehicle's
 * minimum fare. Optional cargo insurance (max 500 TZS, else 0.5% of cargo
 * value) and a 10% scheduled-pickup discount. The fare is ALWAYS computed
 * server-side so a client can never dictate the price it is charged.
 */
export class CargoFareCalculator {
  public static calculate(input: CargoFareInput): CargoFareResult {
    const vehicle = CARGO_VEHICLE_RATES[input.vehicleType];
    if (!vehicle) {
      throw new Error(`Unknown vehicle type: ${input.vehicleType}`);
    }
    if (input.weightKg < 0) {
      throw new Error('Uzito hauwezi kuwa hasi');
    }
    if (input.weightKg > vehicle.capacityKg) {
      throw new Error(`Uzito unazidi uwezo wa ${vehicle.name} (max ${vehicle.capacityKg} kg)`);
    }

    const distanceKm = Math.max(0.5, Math.round(input.distanceKm * 100) / 100);
    const baseFare = vehicle.baseFare;
    const distanceCharge = Math.round(distanceKm * vehicle.perKmRate);
    const weightCharge = Math.round(input.weightKg * vehicle.perKgRate);
    const subtotal = Math.max(baseFare + distanceCharge + weightCharge, vehicle.minFare);

    const insuranceFee =
      input.insured === true && (input.cargoValue ?? 0) > 0
        ? Math.max(500, Math.round((input.cargoValue ?? 0) * 0.005))
        : 0;

    const scheduledDiscount =
      input.tripType === 'scheduled' ? Math.round(subtotal * 0.1) : 0;

    const totalFare =
      Math.max(subtotal - scheduledDiscount, Math.round(vehicle.minFare * 0.9)) + insuranceFee;

    const breakdown: CargoFareBreakdown[] = [
      { label: `Base ya ${vehicle.name}`, amount: baseFare },
      { label: `Umbali (${distanceKm} km)`, amount: distanceCharge },
      { label: `Uzito (${input.weightKg} kg)`, amount: weightCharge },
    ];
    if (insuranceFee > 0) {
      breakdown.push({ label: 'Bima ya mzigo', amount: insuranceFee });
    }
    if (scheduledDiscount > 0) {
      breakdown.push({ label: 'Punguzo la mpango (10%)', amount: -scheduledDiscount });
    }

    return {
      distanceKm,
      baseFare,
      distanceCharge,
      weightCharge,
      insuranceFee,
      scheduledDiscount,
      subtotal,
      totalFare,
      vehicleType: vehicle.key,
      vehicleName: vehicle.name,
      emoji: vehicle.emoji,
      capacityKg: vehicle.capacityKg,
      currency: input.currency,
      breakdown,
    };
  }
}
