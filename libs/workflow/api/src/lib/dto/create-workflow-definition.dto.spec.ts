import { validate } from 'class-validator';
import { CreateWorkflowDefinitionDto } from './create-workflow-definition.dto';

function validDto(overrides: Partial<CreateWorkflowDefinitionDto> = {}): CreateWorkflowDefinitionDto {
  const dto = new CreateWorkflowDefinitionDto();
  dto.code = 'ORG_UNIT_APPROVAL';
  dto.name = 'Org Unit Approval';
  dto.approverRoles = ['PROJECT_MANAGER', 'CEO'];
  return Object.assign(dto, overrides);
}

describe('CreateWorkflowDefinitionDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty code', async () => {
    const errors = await validate(validDto({ code: '' }));

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('rejects an empty name', async () => {
    const errors = await validate(validDto({ name: '' }));

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects zero approver roles', async () => {
    const errors = await validate(validDto({ approverRoles: [] }));

    expect(errors.some((error) => error.property === 'approverRoles')).toBe(true);
  });

  it('rejects a non-string approver role entry', async () => {
    const errors = await validate(validDto({ approverRoles: [1 as unknown as string] }));

    expect(errors.some((error) => error.property === 'approverRoles')).toBe(true);
  });
});
