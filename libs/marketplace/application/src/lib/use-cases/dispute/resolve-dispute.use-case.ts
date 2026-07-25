import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import { IDisputeRepository, DisputeResolutionType } from '@afri-market/marketplace-domain';
import { DISPUTE_REPOSITORY } from '../../tokens';

@Injectable()
export class ResolveDisputeUseCase {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: IDisputeRepository,
  ) {}

  public async execute(params: {
    disputeId: string;
    resolutionType: DisputeResolutionType;
    resolvedAmount: number;
    notes: string;
  }): Promise<{ disputeId: string; status: string }> {
    const dispute = await this.disputeRepo.findById(EntityId.from(params.disputeId));
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.resolve(
      params.resolutionType,
      Money.create(params.resolvedAmount),
      params.notes,
    );
    await this.disputeRepo.save(dispute);

    return { disputeId: dispute.id.value, status: dispute.status };
  }
}
