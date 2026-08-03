import { validate } from 'class-validator';
import { NominateSuccessionCandidateDto } from './nominate-succession-candidate.dto';

function validDto(
  overrides: Partial<NominateSuccessionCandidateDto> = {},
): NominateSuccessionCandidateDto {
  const dto = new NominateSuccessionCandidateDto();
  dto.readinessLevel = 'READY_1_2_YEARS';
  return Object.assign(dto, overrides);
}

describe('NominateSuccessionCandidateDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid readinessLevel', async () => {
    const errors = await validate(
      validDto({ readinessLevel: 'MADE_UP' as NominateSuccessionCandidateDto['readinessLevel'] }),
    );

    expect(errors.some((error) => error.property === 'readinessLevel')).toBe(true);
  });
});
