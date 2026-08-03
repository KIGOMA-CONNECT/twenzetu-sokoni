import { validate } from 'class-validator';
import { ApproveStepDto } from './approve-step.dto';

function validDto(overrides: Partial<ApproveStepDto> = {}): ApproveStepDto {
  const dto = new ApproveStepDto();
  dto.stepOrder = 1;
  return Object.assign(dto, overrides);
}

describe('ApproveStepDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with an optional comment', async () => {
    const errors = await validate(validDto({ comment: 'looks good' }));

    expect(errors).toHaveLength(0);
  });

  it('rejects stepOrder below 1', async () => {
    const errors = await validate(validDto({ stepOrder: 0 }));

    expect(errors.some((error) => error.property === 'stepOrder')).toBe(true);
  });

  it('rejects a non-integer stepOrder', async () => {
    const errors = await validate(validDto({ stepOrder: 1.5 }));

    expect(errors.some((error) => error.property === 'stepOrder')).toBe(true);
  });
});
