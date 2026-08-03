import { validate } from 'class-validator';
import { AllocateLeaveBalanceDto } from './allocate-leave-balance.dto';

function validDto(overrides: Partial<AllocateLeaveBalanceDto> = {}): AllocateLeaveBalanceDto {
  const dto = new AllocateLeaveBalanceDto();
  dto.leaveTypeId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  dto.year = 2026;
  dto.allocatedDays = 21;
  return Object.assign(dto, overrides);
}

describe('AllocateLeaveBalanceDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID leaveTypeId', async () => {
    const errors = await validate(validDto({ leaveTypeId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'leaveTypeId')).toBe(true);
  });

  it('rejects a year out of range', async () => {
    const errors = await validate(validDto({ year: 1900 }));

    expect(errors.some((error) => error.property === 'year')).toBe(true);
  });

  it('rejects allocatedDays above 365', async () => {
    const errors = await validate(validDto({ allocatedDays: 400 }));

    expect(errors.some((error) => error.property === 'allocatedDays')).toBe(true);
  });
});
