export interface PricingInput {
  baseFare: number;
  distanceKm: number;
  perKmRate: number;
  durationMinutes: number;
  perMinuteRate: number;
  surgeMultiplier: number;
  currency: string;
}

export interface PricingBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  subtotal: number;
  surgeAmount: number;
  totalFare: number;
  currency: string;
}

export class PricingCalculator {
  public static calculate(input: PricingInput): PricingBreakdown {
    const baseFare = input.baseFare;
    const distanceCharge = input.distanceKm * input.perKmRate;
    const timeCharge = input.durationMinutes * input.perMinuteRate;
    const subtotal = baseFare + distanceCharge + timeCharge;
    const surgeAmount = subtotal * (input.surgeMultiplier - 1);
    const totalFare = Math.round(subtotal * input.surgeMultiplier);

    return {
      baseFare,
      distanceCharge,
      timeCharge,
      subtotal,
      surgeAmount,
      totalFare,
      currency: input.currency,
    };
  }
}
