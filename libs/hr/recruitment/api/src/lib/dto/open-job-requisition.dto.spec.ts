import { validate } from 'class-validator';
import { OpenJobRequisitionDto } from './open-job-requisition.dto';

function validDto(overrides: Partial<OpenJobRequisitionDto> = {}): OpenJobRequisitionDto {
  const dto = new OpenJobRequisitionDto();
  dto.positionId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  dto.title = 'Software Engineer';
  dto.headcount = 2;
  return Object.assign(dto, overrides);
}

describe('OpenJobRequisitionDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID positionId', async () => {
    const errors = await validate(validDto({ positionId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'positionId')).toBe(true);
  });

  it('rejects a headcount of zero', async () => {
    const errors = await validate(validDto({ headcount: 0 }));

    expect(errors.some((error) => error.property === 'headcount')).toBe(true);
  });

  it('rejects an empty title', async () => {
    const errors = await validate(validDto({ title: '' }));

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });
});
