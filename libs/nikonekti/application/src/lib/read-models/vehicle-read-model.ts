export interface VehicleReadModel {
  readonly id: string;
  readonly fleetOwnerId: string | null;
  readonly plateNumber: string;
  readonly category: string;
  readonly capacityKg: number;
  readonly status: string;
}
