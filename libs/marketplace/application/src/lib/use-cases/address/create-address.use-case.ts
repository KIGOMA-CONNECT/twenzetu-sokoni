import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Address, IAddressRepository } from '@afri-market/marketplace-domain';
import { ADDRESS_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepo: IAddressRepository,
  ) {}

  public async execute(
    tenantId: string,
    dto: {
      userId: string;
      label: string;
      fullAddress: string;
      latitude: number;
      longitude: number;
      isDefault?: boolean;
    },
  ): Promise<{ addressId: string }> {
    if (dto.isDefault) {
      await this.addressRepo.clearDefault(dto.userId);
    }

    const address = Address.create({
      tenantId: TenantId.create(tenantId),
      userId: EntityId.from(dto.userId),
      label: dto.label,
      fullAddress: dto.fullAddress,
      latitude: dto.latitude,
      longitude: dto.longitude,
      isDefault: dto.isDefault,
    });

    await this.addressRepo.save(address);

    return { addressId: address.id.value };
  }
}
