import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IVehicleRepository } from '@afri-market/marketplace-domain';
import { VEHICLE_REPOSITORY } from '../../tokens';

@Injectable()
export class UpdateVehicleLocationUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicleRepo: IVehicleRepository,
  ) {}

  public async execute(
    vehicleId: string,
    latitude: number,
    longitude: number,
  ): Promise<{ id: string; latitude: number; longitude: number }> {
    const vehicle = await this.vehicleRepo.findById(EntityId.from(vehicleId));
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }

    vehicle.updateLocation(latitude, longitude);
    await this.vehicleRepo.save(vehicle);

    return { id: vehicle.id.value, latitude, longitude };
  }
}
