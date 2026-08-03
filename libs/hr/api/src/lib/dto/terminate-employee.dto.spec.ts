import { validate } from 'class-validator';
import { TerminateEmployeeDto } from './terminate-employee.dto';

describe('TerminateEmployeeDto', () => {
  it('passes validation with a valid ISO date', async () => {
    const dto = new TerminateEmployeeDto();
    dto.terminationDate = '2026-06-01';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO-date terminationDate', async () => {
    const dto = new TerminateEmployeeDto();
    dto.terminationDate = 'not-a-date';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'terminationDate')).toBe(true);
  });
});
