import { validate } from 'class-validator';
import { SetGoalDto } from './set-goal.dto';

function validDto(overrides: Partial<SetGoalDto> = {}): SetGoalDto {
  const dto = new SetGoalDto();
  dto.title = 'Ship v1';
  dto.targetDate = '2026-12-31';
  return Object.assign(dto, overrides);
}

describe('SetGoalDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation without a description', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty title', async () => {
    const errors = await validate(validDto({ title: '' }));

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('rejects a non-date targetDate', async () => {
    const errors = await validate(validDto({ targetDate: 'not-a-date' }));

    expect(errors.some((error) => error.property === 'targetDate')).toBe(true);
  });
});
