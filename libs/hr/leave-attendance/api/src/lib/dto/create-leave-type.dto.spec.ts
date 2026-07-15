import { validate } from 'class-validator';
import { CreateLeaveTypeDto } from './create-leave-type.dto';

function validDto(overrides: Partial<CreateLeaveTypeDto> = {}): CreateLeaveTypeDto {
  const dto = new CreateLeaveTypeDto();
  dto.code = 'ANNUAL';
  dto.name = 'Annual Leave';
  dto.defaultDaysPerYear = 21;
  dto.requiresApproval = true;
  return Object.assign(dto, overrides);
}

describe('CreateLeaveTypeDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty code', async () => {
    const errors = await validate(validDto({ code: '' }));

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('rejects defaultDaysPerYear above 365', async () => {
    const errors = await validate(validDto({ defaultDaysPerYear: 400 }));

    expect(errors.some((error) => error.property === 'defaultDaysPerYear')).toBe(true);
  });

  it('rejects a non-boolean requiresApproval', async () => {
    const errors = await validate(validDto({ requiresApproval: 'yes' as unknown as boolean }));

    expect(errors.some((error) => error.property === 'requiresApproval')).toBe(true);
  });
});
