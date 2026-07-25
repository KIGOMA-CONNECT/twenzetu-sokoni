import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IAddressRepository } from '@afri-market/marketplace-domain';
import { ADDRESS_REPOSITORY } from '../../tokens';

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepo: IAddressRepository,
  ) {}

  public async execute(addressId: string, userId: string): Promise<{ deleted: boolean }> {
    const address = await this.addressRepo.findById(EntityId.from(addressId));
    if (!address || address.userId.value !== userId) {
      return { deleted: false };
    }
    await this.addressRepo.delete(EntityId.from(addressId));
    return { deleted: true };
  }
}
