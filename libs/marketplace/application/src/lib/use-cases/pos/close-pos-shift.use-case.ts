import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { PosShift, IPosShiftRepository } from '@afri-market/marketplace-domain';
import { POS_SHIFT_REPOSITORY } from '../../tokens';

export interface ClosePosShiftInput {
  readonly vendorId: string;
  readonly closedBy: string;
  readonly closingCash: number;
  readonly notes?: string;
}

@Injectable()
export class ClosePosShiftUseCase {
  constructor(
    @Inject(POS_SHIFT_REPOSITORY) private readonly repo: IPosShiftRepository,
  ) {}

  public async execute(input: ClosePosShiftInput): Promise<{ shift: PosShift }> {
    const shift = await this.repo.findOpenByVendor(input.vendorId);
    if (!shift) {
      throw new NotFoundException('No open shift found for this vendor.');
    }

    shift.close(input.closingCash, EntityId.from(input.closedBy), input.notes);
    await this.repo.save(shift);
    return { shift };
  }
}