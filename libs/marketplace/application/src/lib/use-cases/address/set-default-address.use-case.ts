import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IAddressRepository } from '@afri-market/marketplace-domain';
import { ADDRESS_REPOSITORY } from '../../tokens';

@Injectable()
export class SetDefaultAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepo: IAddressRepository,
  ) {}

  public async execute(addressId: string, userId: string): Promise<{ addressId: string; isDefault: boolean }> {
    const address = await this.addressRepo.findById(EntityId.from(addressId));
    if (!address || address.userId.value !== userId) {
      return { addressId, isDefault: false };
    }
    await this.addressRepo.clearDefault(userId);
    address.setDefault();
    await this.addressRepo.save(address);
    return { addressId: address.id.value, isDefault: true };
  }
}
