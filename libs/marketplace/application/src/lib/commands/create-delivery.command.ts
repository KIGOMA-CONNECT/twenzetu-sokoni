import { CommandBase } from '@afri-market/kernel';

export class CreateDeliveryCommand extends CommandBase {
  constructor(
    public readonly orderId: string,
    public readonly driverId: string,
    public readonly vehicleType: string,
    public readonly pickupAddress: string,
    public readonly deliveryAddress: string,
    public readonly pickupLatitude: number | undefined,
    public readonly pickupLongitude: number | undefined,
    public readonly deliveryLatitude: number | undefined,
    public readonly deliveryLongitude: number | undefined,
  ) {
    super();
  }
}
