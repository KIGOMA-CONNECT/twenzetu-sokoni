import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { Dispute, IDisputeRepository, IOrderRepository, DisputeReason } from '@afri-market/marketplace-domain';
import { DISPUTE_REPOSITORY, ORDER_REPOSITORY, MARKETPLACE_GATEWAY, EMAIL_SERVICE } from '../../tokens';
import { IEmailService } from '@afri-market/integrations';

@Injectable()
export class CreateDisputeUseCase {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: IDisputeRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyDisputeCreated(tenantId: string, dispute: Record<string, unknown>): void } | undefined,
    @Optional() @Inject(EMAIL_SERVICE) private readonly emailService?: IEmailService,
  ) {}

  public async execute(tenantId: string, params: {
    orderId: string; customerId: string; vendorId: string;
    reason: string; description: string; claimAmount: number;
    disputePhotoUrl?: string; customerEmail?: string;
  }): Promise<{ disputeId: string }> {
    const order = await this.orderRepo.findById(EntityId.from(params.orderId));
    if (!order) throw new NotFoundException('Order not found');
    Guard.assert(
      order.status === 'DELIVERED',
      'Disputes can only be opened for delivered orders',
    );

    const dispute = Dispute.create({
      tenantId: TenantId.create(tenantId),
      orderId: EntityId.from(params.orderId),
      customerId: EntityId.from(params.customerId),
      vendorId: EntityId.from(params.vendorId),
      reason: params.reason as DisputeReason,
      description: params.description,
      claimAmount: Money.create(params.claimAmount),
    });
    if (params.disputePhotoUrl) {
      dispute.attachPhotos(undefined, undefined, params.disputePhotoUrl);
    }
    await this.disputeRepo.save(dispute);

    if (params.customerEmail) {
      this.emailService?.send({
        to: params.customerEmail,
        subject: `Dispute Created: ${params.reason}`,
        html: `<p>Your dispute for order ${params.orderId} has been created. We'll review it shortly.</p>`,
      });
    }

    this.gateway?.notifyDisputeCreated(tenantId, {
      disputeId: dispute.id.value,
      orderId: params.orderId,
      reason: params.reason,
      severity: dispute.severity,
    });

    return { disputeId: dispute.id.value };
  }
}
