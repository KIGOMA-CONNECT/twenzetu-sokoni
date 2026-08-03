export interface TripReadModel {
  readonly id: string;
  readonly customerPhone: string;
  readonly pickupLocation: string;
  readonly destinationLocation: string;
  readonly requestChannel: string;
  readonly status: string;
  readonly driverId: string | null;
  readonly vehicleId: string | null;
  readonly fareAmount: string | null;
  readonly commissionAmount: string | null;
  readonly driverEarning: string | null;
  readonly cancelledReason: string | null;
}
