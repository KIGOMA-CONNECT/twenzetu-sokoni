import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IVehicleRepository } from '@afri-market/marketplace-domain';
import { VEHICLE_REPOSITORY } from '../../tokens';

@Injectable()
export class ToggleDriverAvailabilityUseCase {
  constructor(@Inject(VEHICLE_REPOSITORY) private readonly vehicleRepo: IVehicleRepository) {}

  public async execute(tenantId: string, vehicleId: string, driverId: string, isOnline: boolean): Promise<{ vehicleId: string; isOnline: boolean }> {
    const vehicle = await this.vehicleRepo.findByIdAndTenant(vehicleId, tenantId);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.driverId.value !== driverId) throw new NotFoundException('Vehicle does not belong to you');

    if (isOnline) vehicle.goOnline();
    else vehicle.goOffline();

    await this.vehicleRepo.save(vehicle);
    return { vehicleId: vehicle.id.value, isOnline: vehicle.isOnline };
  }
}
