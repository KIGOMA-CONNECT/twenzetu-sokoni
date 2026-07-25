import { Injectable, Inject } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IDisputeRepository } from '@afri-market/marketplace-domain';
import { DISPUTE_REPOSITORY } from '../../tokens';

@Injectable()
export class FindMyDisputesUseCase {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: IDisputeRepository,
  ) {}

  public async execute(customerId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: Record<string, unknown>[] }> {
    const disputes = await this.disputeRepo.findByCustomerId(customerId);
    const mapped = disputes.map(d => ({
      id: d.id.value,
      orderId: d.orderId.value,
      status: d.status,
      reason: d.reason,
      description: d.description,
      claimAmount: d.claimAmount.amount,
    }));
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? mapped.length;
    return {
      data: mapped.slice(offset, offset + limit),
    };
  }
}

@Injectable()
export class GetDisputeDetailUseCase {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: IDisputeRepository,
  ) {}

  public async execute(disputeId: string): Promise<{ data: Record<string, unknown> | null }> {
    const dispute = await this.disputeRepo.findById(EntityId.from(disputeId));
    if (!dispute) {
      return { data: null };
    }
    return {
      data: {
        id: dispute.id.value,
        orderId: dispute.orderId.value,
        status: dispute.status,
        reason: dispute.reason,
        description: dispute.description,
        claimAmount: dispute.claimAmount.amount,
        resolvedAmount: dispute.resolvedAmount?.amount ?? null,
        resolutionType: dispute.resolutionType,
      },
    };
  }
}
