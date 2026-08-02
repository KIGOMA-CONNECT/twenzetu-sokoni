import { Inject, Injectable } from '@nestjs/common';
import { IServiceRequestRepository, IServiceQuoteRepository } from '@afri-market/marketplace-domain';
import { SERVICE_REQUEST_REPOSITORY, SERVICE_QUOTE_REPOSITORY } from '../../tokens';

@Injectable()
export class ListServiceRequestsUseCase {
  constructor(
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
    @Inject(SERVICE_QUOTE_REPOSITORY) private readonly quoteRepo: IServiceQuoteRepository,
  ) {}

  public async execute(
    tenantId: string,
    role: string,
    userId: string,
    opts: { status?: string } = {},
  ) {
    const requests = role === 'vendor'
      ? await this.requestRepo.findByVendorId(tenantId, userId, opts)
      : await this.requestRepo.findByCustomerId(tenantId, userId);

    const data = [];
    for (const r of requests) {
      const quotes = await this.quoteRepo.findByRequestId(r.id.value);
      data.push({
        ...r.toDto(),
        quotes: quotes.map((q) => q.toDto()),
      });
    }
    return { data, total: data.length };
  }
}
