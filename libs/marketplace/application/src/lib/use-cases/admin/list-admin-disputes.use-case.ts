import { Injectable, Inject } from '@nestjs/common';
import { IDisputeRepository } from '@afri-market/marketplace-domain';
import { DISPUTE_REPOSITORY } from '../../tokens';

@Injectable()
export class ListAdminDisputesUseCase {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: IDisputeRepository,
  ) {}

  public async execute(tenantId: string, opts?: { status?: string; limit?: number; offset?: number }) {
    const result = await this.disputeRepo.search(tenantId, {
      status: opts?.status,
      limit: opts?.limit ?? 50,
      offset: opts?.offset ?? 0,
    });
    return {
      data: result.data.map(d => ({
        id: d.id.value,
        orderId: d.orderId.value,
        customerId: d.customerId.value,
        vendorId: d.vendorId.value,
        status: d.status,
        reason: d.reason,
        description: d.description,
        claimAmount: d.claimAmount.amount,
        severity: d.severity,
        resolutionType: d.resolutionType,
        resolvedAmount: d.resolvedAmount?.amount ?? null,
      })),
      total: result.total,
    };
  }
}
