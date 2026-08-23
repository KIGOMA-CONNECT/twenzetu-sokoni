import { Inject, Injectable } from '@nestjs/common';
import { PosShift, IPosShiftRepository } from '@afri-market/marketplace-domain';
import { POS_SHIFT_REPOSITORY } from '../../tokens';

@Injectable()
export class GetCurrentPosShiftUseCase {
  constructor(
    @Inject(POS_SHIFT_REPOSITORY) private readonly repo: IPosShiftRepository,
  ) {}

  public async execute(vendorId: string): Promise<{ shift: PosShift | null }> {
    const shift = await this.repo.findOpenByVendor(vendorId);
    return { shift };
  }
}