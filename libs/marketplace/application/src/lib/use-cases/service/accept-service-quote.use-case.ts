import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import {
  IServiceRequestRepository,
  IServiceQuoteRepository,
  IServiceListingRepository,
} from '@afri-market/marketplace-domain';
import {
  SERVICE_REQUEST_REPOSITORY,
  SERVICE_QUOTE_REPOSITORY,
  SERVICE_LISTING_REPOSITORY,
} from '../../tokens';
import { AcceptServiceQuoteCommand } from '../../commands/accept-service-quote.command';
import { CreateOrderUseCase } from '../order/create-order.use-case';
import { CreateOrderCommand } from '../../commands/create-order.command';

@Injectable()
export class AcceptServiceQuoteUseCase {
  constructor(
    @Inject(SERVICE_QUOTE_REPOSITORY) private readonly quoteRepo: IServiceQuoteRepository,
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
    private readonly createOrder: CreateOrderUseCase,
  ) {}

  public async execute(
    tenantId: string,
    command: AcceptServiceQuoteCommand,
    paymentMethod: string,
    customerPhone?: string,
    customerEmail?: string,
    deliveryAddress?: string,
    specialInstructions?: string,
  ): Promise<{
    requestId: string;
    orderId: string;
    status: string;
    total: number;
    commission: number;
    vendorNet: number;
    paymentId: string;
    paymentStatus: string;
    otpCode: string;
  }> {
    const quote = await this.quoteRepo.findById(EntityId.from(command.quoteId));
    if (!quote) {
      throw new Error('Quote not found');
    }
    if (quote.status !== 'OPEN') {
      throw new Error('Quote is no longer open');
    }

    const request = await this.requestRepo.findById(quote.requestId);
    if (!request) {
      throw new Error('Service request not found');
    }
    if (request.customerId.value !== command.customerId) {
      throw new Error('You can only accept quotes on your own requests');
    }
    if (request.status === 'ORDERED' || request.status === 'CANCELLED') {
      throw new Error('Request is already closed');
    }

    request.agree(quote.price);
    await this.requestRepo.save(request);

    const listingName = request.listingId
      ? (await this.listingRepo.findById(request.listingId))?.name
      : undefined;

    const orderResult = await this.createOrder.execute(tenantId, new CreateOrderCommand(
      request.customerId.value,
      request.vendorId.value,
      'service',
      deliveryAddress ?? request.details ?? 'Service delivery',
      [{
        productId: request.id.value,
        productName: listingName ?? request.title,
        quantity: 1,
        unitPrice: quote.price.amount,
      }],
      paymentMethod,
      undefined,
      undefined,
      specialInstructions,
      customerPhone,
      customerEmail,
      quote.price.currency,
    ));

    request.markOrdered();
    await this.requestRepo.save(request);

    return {
      requestId: request.id.value,
      orderId: orderResult.orderId,
      status: orderResult.status,
      total: orderResult.total,
      commission: orderResult.commission,
      vendorNet: orderResult.vendorNet,
      paymentId: orderResult.paymentId,
      paymentStatus: orderResult.paymentStatus,
      otpCode: orderResult.otpCode,
    };
  }
}
