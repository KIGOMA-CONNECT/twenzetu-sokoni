import { validate } from 'class-validator';
import { RejectStepDto } from './reject-step.dto';

function validDto(overrides: Partial<RejectStepDto> = {}): RejectStepDto {
  const dto = new RejectStepDto();
  dto.stepOrder = 1;
  return Object.assign(dto, overrides);
}

describe('RejectStepDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with an optional comment', async () => {
    const errors = await validate(validDto({ comment: 'not viable' }));

    expect(errors).toHaveLength(0);
  });

  it('rejects stepOrder below 1', async () => {
    const errors = await validate(validDto({ stepOrder: 0 }));

    expect(errors.some((error) => error.property === 'stepOrder')).toBe(true);
  });
});
