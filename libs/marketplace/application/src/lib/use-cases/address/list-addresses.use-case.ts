import { Inject, Injectable } from '@nestjs/common';
import { Address, IAddressRepository } from '@afri-market/marketplace-domain';
import { ADDRESS_REPOSITORY } from '../../tokens';

@Injectable()
export class ListAddressesUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepo: IAddressRepository,
  ) {}

  public async execute(userId: string): Promise<Address[]> {
    return this.addressRepo.findByUserId(userId);
  }
}
