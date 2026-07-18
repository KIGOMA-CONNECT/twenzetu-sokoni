import { validate } from 'class-validator';
import { OpenPayrollPeriodDto } from './open-payroll-period.dto';

function validDto(overrides: Partial<OpenPayrollPeriodDto> = {}): OpenPayrollPeriodDto {
  const dto = new OpenPayrollPeriodDto();
  dto.year = 2026;
  dto.month = 8;
  return Object.assign(dto, overrides);
}

describe('OpenPayrollPeriodDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a month above 12', async () => {
    const errors = await validate(validDto({ month: 13 }));

    expect(errors.some((error) => error.property === 'month')).toBe(true);
  });

  it('rejects a month below 1', async () => {
    const errors = await validate(validDto({ month: 0 }));

    expect(errors.some((error) => error.property === 'month')).toBe(true);
  });

  it('rejects a year out of range', async () => {
    const errors = await validate(validDto({ year: 1900 }));

    expect(errors.some((error) => error.property === 'year')).toBe(true);
  });
});
