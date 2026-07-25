import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Vehicle, IVehicleRepository, VehicleType } from '@afri-market/marketplace-domain';
import { VEHICLE_REPOSITORY } from '../../tokens';

@Injectable()
export class RegisterVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicleRepo: IVehicleRepository,
  ) {}

  public async execute(
    tenantId: string,
    dto: { driverId: string; vehicleType: string; plateNumber: string; capacityKg: number },
  ): Promise<{ id: string; vehicleType: string; plateNumber: string }> {
    const vehicle = Vehicle.create({
      tenantId: TenantId.create(tenantId),
      driverId: EntityId.from(dto.driverId),
      vehicleType: dto.vehicleType as VehicleType,
      plateNumber: dto.plateNumber,
      capacityKg: dto.capacityKg,
    });

    await this.vehicleRepo.save(vehicle);

    return { id: vehicle.id.value, vehicleType: vehicle.vehicleType, plateNumber: vehicle.plateNumber };
  }
}
