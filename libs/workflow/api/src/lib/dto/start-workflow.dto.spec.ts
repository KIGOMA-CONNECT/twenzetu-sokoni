import { validate } from 'class-validator';
import { StartWorkflowDto } from './start-workflow.dto';

function validDto(overrides: Partial<StartWorkflowDto> = {}): StartWorkflowDto {
  const dto = new StartWorkflowDto();
  dto.workflowDefinitionId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  dto.subjectType = 'ORG_UNIT';
  dto.subjectId = 'org-unit-1';
  return Object.assign(dto, overrides);
}

describe('StartWorkflowDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID workflowDefinitionId', async () => {
    const errors = await validate(validDto({ workflowDefinitionId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'workflowDefinitionId')).toBe(true);
  });

  it('rejects an empty subjectType', async () => {
    const errors = await validate(validDto({ subjectType: '' }));

    expect(errors.some((error) => error.property === 'subjectType')).toBe(true);
  });

  it('rejects an empty subjectId', async () => {
    const errors = await validate(validDto({ subjectId: '' }));

    expect(errors.some((error) => error.property === 'subjectId')).toBe(true);
  });
});
