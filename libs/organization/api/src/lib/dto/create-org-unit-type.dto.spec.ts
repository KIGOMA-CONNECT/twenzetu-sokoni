import { validate } from 'class-validator';
import { CreateOrgUnitTypeDto } from './create-org-unit-type.dto';

function validDto(overrides: Partial<CreateOrgUnitTypeDto> = {}): CreateOrgUnitTypeDto {
  const dto = new CreateOrgUnitTypeDto();
  dto.code = 'DEPARTMENT';
  dto.name = 'Department';
  dto.allowedParentTypeIds = ['3f2504e0-4f89-41d3-9a0c-0305e82c3301'];
  return Object.assign(dto, overrides);
}

describe('CreateOrgUnitTypeDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty code', async () => {
    const errors = await validate(validDto({ code: '' }));

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('rejects a non-UUID allowedParentTypeIds entry', async () => {
    const errors = await validate(validDto({ allowedParentTypeIds: ['not-a-uuid'] }));

    expect(errors.some((error) => error.property === 'allowedParentTypeIds')).toBe(true);
  });

  it('allows an empty allowedParentTypeIds array (a root type)', async () => {
    const errors = await validate(validDto({ allowedParentTypeIds: [] }));

    expect(errors).toHaveLength(0);
  });

  it('rejects a negative sortOrder', async () => {
    const errors = await validate(validDto({ sortOrder: -1 }));

    expect(errors.some((error) => error.property === 'sortOrder')).toBe(true);
  });
});
