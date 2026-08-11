import { Inject, Injectable } from '@nestjs/common';
import { TenantId } from '@afri-market/kernel';
import { Advert, IAdvertRepository } from '@afri-market/marketplace-domain';
import { ADVERT_REPOSITORY } from '../../tokens';

export interface CreateAdvertInput {
  title: string;
  body?: string;
  emoji?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sortOrder?: number;
  startsAt?: string;
  endsAt?: string;
}

@Injectable()
export class CreateAdvertUseCase {
  constructor(
    @Inject(ADVERT_REPOSITORY) private readonly advertRepo: IAdvertRepository,
  ) {}

  public async execute(tenantId: string, input: CreateAdvertInput): Promise<{ advertId: string }> {
    const advert = Advert.create({
      tenantId: TenantId.create(tenantId),
      title: input.title,
      body: input.body,
      emoji: input.emoji,
      imageUrl: input.imageUrl,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      sortOrder: input.sortOrder,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    });

    await this.advertRepo.save(advert);

    return { advertId: advert.id.value };
  }
}
