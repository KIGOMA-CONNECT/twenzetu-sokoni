import { Inject, Injectable } from '@nestjs/common';
import { Advert, IAdvertRepository } from '@afri-market/marketplace-domain';
import { ADVERT_REPOSITORY } from '../../tokens';

@Injectable()
export class ListActiveAdsUseCase {
  constructor(
    @Inject(ADVERT_REPOSITORY) private readonly advertRepo: IAdvertRepository,
  ) {}

  public async execute(tenantId: string): Promise<Advert[]> {
    return this.advertRepo.findActive(tenantId);
  }
}
