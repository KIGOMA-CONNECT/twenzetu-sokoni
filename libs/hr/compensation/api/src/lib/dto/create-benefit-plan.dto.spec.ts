import { validate } from 'class-validator';
import { CreateBenefitPlanDto } from './create-benefit-plan.dto';

function validDto(overrides: Partial<CreateBenefitPlanDto> = {}): CreateBenefitPlanDto {
  const dto = new CreateBenefitPlanDto();
  dto.name = 'Gold Health Plan';
  dto.benefitType = 'HEALTH_INSURANCE';
  dto.employerContributionRateBasisPoints = 500;
  return Object.assign(dto, overrides);
}

describe('CreateBenefitPlanDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const errors = await validate(validDto({ name: '' }));

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects a contribution rate above 10000 basis points', async () => {
    const errors = await validate(validDto({ employerContributionRateBasisPoints: 10_001 }));

    expect(errors.some((error) => error.property === 'employerContributionRateBasisPoints')).toBe(true);
  });
});
