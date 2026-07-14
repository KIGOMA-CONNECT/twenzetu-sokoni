import { validate } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

function validDto(overrides: Partial<CreateEmployeeDto> = {}): CreateEmployeeDto {
  const dto = new CreateEmployeeDto();
  dto.employeeNumber = 'EMP-0001';
  dto.firstName = 'Jane';
  dto.lastName = 'Doe';
  dto.email = 'jane.doe@example.com';
  dto.hireDate = '2026-01-01';
  dto.employmentType = 'FULL_TIME';
  return Object.assign(dto, overrides);
}

describe('CreateEmployeeDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const errors = await validate(validDto({ email: 'not-an-email' }));

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('rejects an invalid employmentType', async () => {
    const errors = await validate(validDto({ employmentType: 'FREELANCE' as CreateEmployeeDto['employmentType'] }));

    expect(errors.some((error) => error.property === 'employmentType')).toBe(true);
  });

  it('rejects a non-ISO-date hireDate', async () => {
    const errors = await validate(validDto({ hireDate: 'not-a-date' }));

    expect(errors.some((error) => error.property === 'hireDate')).toBe(true);
  });

  it('rejects a non-UUID positionId', async () => {
    const errors = await validate(validDto({ positionId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'positionId')).toBe(true);
  });

  it('allows omitting all optional fields', async () => {
    const dto = validDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
