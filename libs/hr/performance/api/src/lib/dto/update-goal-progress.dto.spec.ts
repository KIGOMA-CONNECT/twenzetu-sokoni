import { validate } from 'class-validator';
import { UpdateGoalProgressDto } from './update-goal-progress.dto';

function validDto(overrides: Partial<UpdateGoalProgressDto> = {}): UpdateGoalProgressDto {
  const dto = new UpdateGoalProgressDto();
  dto.progressPercent = 50;
  return Object.assign(dto, overrides);
}

describe('UpdateGoalProgressDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a progressPercent above 100', async () => {
    const errors = await validate(validDto({ progressPercent: 101 }));

    expect(errors.some((error) => error.property === 'progressPercent')).toBe(true);
  });

  it('rejects a negative progressPercent', async () => {
    const errors = await validate(validDto({ progressPercent: -1 }));

    expect(errors.some((error) => error.property === 'progressPercent')).toBe(true);
  });
});
