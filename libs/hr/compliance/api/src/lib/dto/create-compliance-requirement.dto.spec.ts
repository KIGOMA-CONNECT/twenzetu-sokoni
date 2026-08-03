import { validate } from 'class-validator';
import { CreateComplianceRequirementDto } from './create-compliance-requirement.dto';

function validDto(overrides: Partial<CreateComplianceRequirementDto> = {}): CreateComplianceRequirementDto {
  const dto = new CreateComplianceRequirementDto();
  dto.name = 'Annual Fire Safety Certification';
  dto.category = 'SAFETY';
  dto.recurrence = 'ANNUAL';
  return Object.assign(dto, overrides);
}

describe('CreateComplianceRequirementDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const errors = await validate(validDto({ name: '' }));

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects an invalid category', async () => {
    const errors = await validate(
      validDto({ category: 'MADE_UP' as CreateComplianceRequirementDto['category'] }),
    );

    expect(errors.some((error) => error.property === 'category')).toBe(true);
  });

  it('rejects an invalid recurrence', async () => {
    const errors = await validate(
      validDto({ recurrence: 'MADE_UP' as CreateComplianceRequirementDto['recurrence'] }),
    );

    expect(errors.some((error) => error.property === 'recurrence')).toBe(true);
  });
});
