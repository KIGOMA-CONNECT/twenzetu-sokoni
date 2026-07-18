import { validate } from 'class-validator';
import { HireCandidateDto } from './hire-candidate.dto';

function validDto(overrides: Partial<HireCandidateDto> = {}): HireCandidateDto {
  const dto = new HireCandidateDto();
  dto.employeeNumber = 'EMP-0100';
  dto.hireDate = '2026-08-01';
  dto.employmentType = 'FULL_TIME';
  return Object.assign(dto, overrides);
}

describe('HireCandidateDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO-date hireDate', async () => {
    const errors = await validate(validDto({ hireDate: 'not-a-date' }));

    expect(errors.some((error) => error.property === 'hireDate')).toBe(true);
  });

  it('rejects an invalid employmentType', async () => {
    const errors = await validate(validDto({ employmentType: 'FREELANCE' as HireCandidateDto['employmentType'] }));

    expect(errors.some((error) => error.property === 'employmentType')).toBe(true);
  });

  it('rejects a non-UUID orgUnitId', async () => {
    const errors = await validate(validDto({ orgUnitId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'orgUnitId')).toBe(true);
  });

  it('allows omitting the optional orgUnitId', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });
});
