export type VehicleType = 'boda' | 'bajaji' | 'carry' | 'guta' | 'fuso';

export interface VehicleSpecs {
  type: VehicleType;
  maxPayloadKg: number;
  maxVolumeM3: number;
  baseFare: number;
  perKmRate: number;
}

export const VEHICLE_SPECS: Record<VehicleType, VehicleSpecs> = {
  boda: { type: 'boda', maxPayloadKg: 20, maxVolumeM3: 0.5, baseFare: 1000, perKmRate: 500 },
  bajaji: { type: 'bajaji', maxPayloadKg: 50, maxVolumeM3: 1.0, baseFare: 2000, perKmRate: 800 },
  carry: { type: 'carry', maxPayloadKg: 500, maxVolumeM3: 3.0, baseFare: 5000, perKmRate: 1500 },
  guta: { type: 'guta', maxPayloadKg: 1000, maxVolumeM3: 6.0, baseFare: 10000, perKmRate: 2500 },
  fuso: { type: 'fuso', maxPayloadKg: 5000, maxVolumeM3: 20.0, baseFare: 20000, perKmRate: 4000 },
};
