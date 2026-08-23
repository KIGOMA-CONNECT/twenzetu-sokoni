import { Inject, Injectable } from '@nestjs/common';
import { IPosShiftRepository } from '@afri-market/marketplace-domain';
import { POS_SHIFT_REPOSITORY } from '../../tokens';
import { parseDateInput, startOfLocalDay, endOfLocalDay } from './pos-dates';

export interface ListPosShiftsInput {
  readonly vendorId: string;
  readonly date?: string;
}

@Injectable()
export class ListPosShiftsUseCase {
  constructor(
    @Inject(POS_SHIFT_REPOSITORY) private readonly shiftRepo: IPosShiftRepository,
  ) {}

  public async execute(input: ListPosShiftsInput) {
    const selected = parseDateInput(input.date);
    const shifts = await this.shiftRepo.findByVendorAndDate(
      input.vendorId,
      startOfLocalDay(selected),
      endOfLocalDay(selected),
    );
    return { data: shifts.map((s) => s.toDto()) };
  }
}
