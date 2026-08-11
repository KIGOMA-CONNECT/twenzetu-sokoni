import { CargoFareCalculator, CARGO_VEHICLE_RATES } from '@afri-market/marketplace-domain';

describe('CargoFareCalculator', () => {
  it('computes base + distance + weight, floored at the vehicle minimum fare', () => {
    const result = CargoFareCalculator.calculate({
      distanceKm: 10,
      weightKg: 2,
      vehicleType: 'boda',
      currency: 'TZS',
    });

    expect(result.totalFare).toBe(2000 + 10 * 500 + 2 * 200);
    expect(result.vehicleName).toBe('Bodaboda');
    expect(result.currency).toBe('TZS');
  });

  it('floors short trips at the minimum fare', () => {
    const result = CargoFareCalculator.calculate({
      distanceKm: 0.2,
      weightKg: 1,
      vehicleType: 'carry',
      currency: 'TZS',
    });

    expect(result.totalFare).toBe(CARGO_VEHICLE_RATES.carry.minFare);
  });

  it('throws when weight exceeds the vehicle capacity', () => {
    expect(() =>
      CargoFareCalculator.calculate({
        distanceKm: 5,
        weightKg: 50,
        vehicleType: 'boda',
        currency: 'TZS',
      }),
    ).toThrow(/unazidi uwezo/);
  });

  it('throws on negative weight', () => {
    expect(() =>
      CargoFareCalculator.calculate({
        distanceKm: 5,
        weightKg: -1,
        vehicleType: 'boda',
        currency: 'TZS',
      }),
    ).toThrow(/hasi/);
  });

  it('throws on an unknown vehicle type', () => {
    expect(() =>
      CargoFareCalculator.calculate({
        distanceKm: 5,
        weightKg: 1,
        vehicleType: 'tank' as never,
        currency: 'TZS',
      }),
    ).toThrow(/Unknown vehicle/);
  });

  it('adds insurance of 0.5% of cargo value, floored at 500 TZS', () => {
    const lowValue = CargoFareCalculator.calculate({
      distanceKm: 5,
      weightKg: 2,
      vehicleType: 'van',
      insured: true,
      cargoValue: 50000,
      currency: 'TZS',
    });
    const highValue = CargoFareCalculator.calculate({
      distanceKm: 5,
      weightKg: 2,
      vehicleType: 'van',
      insured: true,
      cargoValue: 2_000_000,
      currency: 'TZS',
    });

    expect(lowValue.insuranceFee).toBe(500);
    expect(highValue.insuranceFee).toBe(10000);
    expect(highValue.totalFare).toBe(highValue.subtotal + highValue.insuranceFee);
  });

  it('applies a 10% scheduled discount, never below 90% of the minimum fare', () => {
    const result = CargoFareCalculator.calculate({
      distanceKm: 0.2,
      weightKg: 1,
      vehicleType: 'fuso',
      tripType: 'scheduled',
      currency: 'TZS',
    });

    expect(result.scheduledDiscount).toBe(Math.round(CARGO_VEHICLE_RATES.fuso.minFare * 0.1));
    expect(result.totalFare).toBe(Math.round(CARGO_VEHICLE_RATES.fuso.minFare * 0.9));
  });

  it('returns a Swahili breakdown for display', () => {
    const result = CargoFareCalculator.calculate({
      distanceKm: 8,
      weightKg: 100,
      vehicleType: 'guta',
      insured: true,
      cargoValue: 1_000_000,
      tripType: 'scheduled',
      currency: 'TZS',
    });

    const labels = result.breakdown.map((b) => b.label);
    expect(labels.some((l) => l.includes('Base ya'))).toBe(true);
    expect(labels.some((l) => l.includes('Umbali'))).toBe(true);
    expect(labels.some((l) => l.includes('Uzito'))).toBe(true);
    expect(labels.some((l) => l.includes('Bima'))).toBe(true);
    expect(labels.some((l) => l.includes('Punguzo'))).toBe(true);
  });
});
