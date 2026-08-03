import { validate } from 'class-validator';
import { RecordSalaryRevisionDto } from './record-salary-revision.dto';

function validDto(overrides: Partial<RecordSalaryRevisionDto> = {}): RecordSalaryRevisionDto {
  const dto = new RecordSalaryRevisionDto();
  dto.reason = 'MERIT_INCREASE';
  dto.newBasicSalary = 550000;
  dto.effectiveDate = '2026-08-01';
  return Object.assign(dto, overrides);
}

describe('RecordSalaryRevisionDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid reason', async () => {
    const errors = await validate(
      validDto({ reason: 'MADE_UP_REASON' as RecordSalaryRevisionDto['reason'] }),
    );

    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });

  it('rejects a negative newBasicSalary', async () => {
    const errors = await validate(validDto({ newBasicSalary: -1 }));

    expect(errors.some((error) => error.property === 'newBasicSalary')).toBe(true);
  });
});
