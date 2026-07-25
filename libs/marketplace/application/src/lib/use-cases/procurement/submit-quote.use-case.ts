import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import {
  VendorQuote,
  ICustomProcurementRepository,
  IVendorQuoteRepository,
  ItemCondition,
} from '@afri-market/marketplace-domain';
import {
  PROCUREMENT_REPOSITORY,
  VENDOR_QUOTE_REPOSITORY,
} from '../../tokens';
import { SubmitVendorQuoteCommand } from '../../commands/submit-vendor-quote.command';

@Injectable()
export class SubmitQuoteUseCase {
  constructor(
    @Inject(VENDOR_QUOTE_REPOSITORY)
    private readonly quoteRepo: IVendorQuoteRepository,
    @Inject(PROCUREMENT_REPOSITORY)
    private readonly procurementRepo: ICustomProcurementRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: SubmitVendorQuoteCommand,
  ): Promise<{ quoteId: string }> {
    const procurement = await this.procurementRepo.findById(
      EntityId.from(command.procurementId),
    );
    if (!procurement) {
      throw new Error('Procurement request not found');
    }
    if (procurement.status !== 'searching') {
      throw new Error('Procurement is no longer accepting quotes');
    }

    const quote = VendorQuote.create({
      procurementId: EntityId.from(command.procurementId),
      vendorId: EntityId.from(command.vendorId),
      price: Money.create(command.price, command.currency),
      itemCondition: command.itemCondition as ItemCondition,
      warrantyPeriodDays: command.warrantyPeriodDays,
    });

    await this.quoteRepo.save(quote);

    const existingQuotes = await this.quoteRepo.findByProcurementId(
      command.procurementId,
    );
    if (existingQuotes.length > 0 && procurement.status === 'searching') {
      procurement.receivedQuotes();
      await this.procurementRepo.save(procurement);
    }

    return { quoteId: quote.id.value };
  }
}
