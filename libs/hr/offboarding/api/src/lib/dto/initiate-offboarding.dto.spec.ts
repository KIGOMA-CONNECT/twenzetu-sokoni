import { validate } from 'class-validator';
import { InitiateOffboardingDto } from './initiate-offboarding.dto';

function validDto(overrides: Partial<InitiateOffboardingDto> = {}): InitiateOffboardingDto {
  const dto = new InitiateOffboardingDto();
  dto.exitReason = 'RESIGNATION';
  dto.lastWorkingDay = '2026-08-15';
  return Object.assign(dto, overrides);
}

describe('InitiateOffboardingDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid exitReason', async () => {
    const errors = await validate(
      validDto({ exitReason: 'MADE_UP_REASON' as InitiateOffboardingDto['exitReason'] }),
    );

    expect(errors.some((error) => error.property === 'exitReason')).toBe(true);
  });

  it('rejects a non-date lastWorkingDay', async () => {
    const errors = await validate(validDto({ lastWorkingDay: 'not-a-date' }));

    expect(errors.some((error) => error.property === 'lastWorkingDay')).toBe(true);
  });
});
