import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { PosShift, IPosShiftRepository } from '@afri-market/marketplace-domain';
import { POS_SHIFT_REPOSITORY } from '../../tokens';

export interface OpenPosShiftInput {
  readonly tenantId: string;
  readonly vendorId: string;
  readonly operatorId: string;
  readonly openingFloat?: number;
}

@Injectable()
export class OpenPosShiftUseCase {
  constructor(
    @Inject(POS_SHIFT_REPOSITORY) private readonly repo: IPosShiftRepository,
  ) {}

  public async execute(input: OpenPosShiftInput): Promise<{ shift: PosShift }> {
    const existing = await this.repo.findOpenByVendor(input.vendorId);
    if (existing) {
      throw new ConflictException('A shift is already open. Close it before opening a new one.');
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.repo.countByVendorAndDay(
      input.vendorId,
      new Date(new Date().setHours(0, 0, 0, 0)),
      new Date(new Date().setHours(23, 59, 59, 999)),
    );
    const shiftNumber = `SHIFT-${today}-${String(count + 1).padStart(3, '0')}`;

    const shift = PosShift.create({
      tenantId: TenantId.create(input.tenantId),
      vendorId: EntityId.from(input.vendorId),
      operatorId: EntityId.from(input.operatorId),
      shiftNumber,
      openingFloat: input.openingFloat ?? 0,
    });

    await this.repo.save(shift);
    return { shift };
  }
}