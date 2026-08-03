import { validate } from 'class-validator';
import { SubmitApplicationDto } from './submit-application.dto';

function validDto(overrides: Partial<SubmitApplicationDto> = {}): SubmitApplicationDto {
  const dto = new SubmitApplicationDto();
  dto.candidateId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  dto.jobRequisitionId = '3f2504e0-4f89-41d3-9a0c-0305e82c3302';
  return Object.assign(dto, overrides);
}

describe('SubmitApplicationDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID candidateId', async () => {
    const errors = await validate(validDto({ candidateId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'candidateId')).toBe(true);
  });

  it('rejects a non-UUID jobRequisitionId', async () => {
    const errors = await validate(validDto({ jobRequisitionId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'jobRequisitionId')).toBe(true);
  });
});
