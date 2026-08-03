import { validate } from 'class-validator';
import { SubmitLeaveRequestDto } from './submit-leave-request.dto';

function validDto(overrides: Partial<SubmitLeaveRequestDto> = {}): SubmitLeaveRequestDto {
  const dto = new SubmitLeaveRequestDto();
  dto.leaveTypeId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  dto.startDate = '2026-08-01';
  dto.endDate = '2026-08-05';
  dto.numberOfDays = 5;
  return Object.assign(dto, overrides);
}

describe('SubmitLeaveRequestDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO-date startDate', async () => {
    const errors = await validate(validDto({ startDate: 'not-a-date' }));

    expect(errors.some((error) => error.property === 'startDate')).toBe(true);
  });

  it('rejects numberOfDays below 0.5', async () => {
    const errors = await validate(validDto({ numberOfDays: 0 }));

    expect(errors.some((error) => error.property === 'numberOfDays')).toBe(true);
  });

  it('allows omitting the optional reason', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });
});
