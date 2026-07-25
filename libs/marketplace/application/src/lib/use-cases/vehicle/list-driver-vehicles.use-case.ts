import { Inject, Injectable } from '@nestjs/common';
import { IVehicleRepository, Vehicle } from '@afri-market/marketplace-domain';
import { VEHICLE_REPOSITORY } from '../../tokens';

@Injectable()
export class ListDriverVehiclesUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicleRepo: IVehicleRepository,
  ) {}

  public async execute(driverId: string): Promise<Vehicle[]> {
    return this.vehicleRepo.findByDriverId(driverId);
  }
}
