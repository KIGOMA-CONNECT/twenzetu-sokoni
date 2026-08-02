import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import { ServiceQuote, IServiceRequestRepository, IServiceQuoteRepository } from '@afri-market/marketplace-domain';
import { SERVICE_REQUEST_REPOSITORY, SERVICE_QUOTE_REPOSITORY } from '../../tokens';
import { SubmitServiceQuoteCommand } from '../../commands/submit-service-quote.command';

@Injectable()
export class SubmitServiceQuoteUseCase {
  constructor(
    @Inject(SERVICE_QUOTE_REPOSITORY) private readonly quoteRepo: IServiceQuoteRepository,
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
  ) {}

  public async execute(tenantId: string, command: SubmitServiceQuoteCommand): Promise<{ quoteId: string }> {
    const request = await this.requestRepo.findById(EntityId.from(command.requestId));
    if (!request) {
      throw new Error('Service request not found');
    }
    if (request.vendorId.value !== command.vendorId) {
      throw new Error('You can only quote on requests assigned to your shop');
    }
    if (request.status === 'ORDERED' || request.status === 'CANCELLED') {
      throw new Error('Request is no longer accepting quotes');
    }
    if (command.price < 0) {
      throw new Error('Price cannot be negative');
    }

    const quote = ServiceQuote.create({
      tenantId: request.tenantId,
      requestId: EntityId.from(command.requestId),
      vendorId: EntityId.from(command.vendorId),
      price: Money.create(command.price, command.currency),
      message: command.message,
    });

    await this.quoteRepo.save(quote);
    request.receiveQuote();
    await this.requestRepo.save(request);

    return { quoteId: quote.id.value };
  }
}
