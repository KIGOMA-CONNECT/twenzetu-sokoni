import { Injectable, Inject } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import { IDisputeRepository, DisputeResolutionType } from '@afri-market/marketplace-domain';
import { DISPUTE_REPOSITORY } from '../../tokens';

@Injectable()
export class ResolveDisputeAdminUseCase {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: IDisputeRepository,
  ) {}

  public async execute(disputeId: string, tenantId: string, dto: { resolutionType: string; resolvedAmount: number; resolutionNotes?: string }) {
    const dispute = await this.disputeRepo.findById(EntityId.from(disputeId));
    if (!dispute || dispute.tenantId.value !== tenantId) {
      return { error: 'Dispute not found' };
    }
    dispute.resolve(
      dto.resolutionType as DisputeResolutionType,
      Money.create(dto.resolvedAmount, dispute.claimAmount.currency),
      dto.resolutionNotes ?? '',
    );
    await this.disputeRepo.save(dispute);
    return { disputeId, resolutionType: dto.resolutionType, message: 'Dispute resolved' };
  }
}
