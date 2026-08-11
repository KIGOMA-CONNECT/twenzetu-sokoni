import { Inject, Injectable } from '@nestjs/common';
import { Advert, IAdvertRepository } from '@afri-market/marketplace-domain';
import { ADVERT_REPOSITORY } from '../../tokens';

@Injectable()
export class ListAdvertsUseCase {
  constructor(
    @Inject(ADVERT_REPOSITORY) private readonly advertRepo: IAdvertRepository,
  ) {}

  public async execute(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: Advert[]; total: number }> {
    return this.advertRepo.findByTenant(tenantId, opts);
  }
}
