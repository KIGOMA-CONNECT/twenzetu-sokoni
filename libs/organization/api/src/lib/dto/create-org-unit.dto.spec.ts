import { validate } from 'class-validator';
import { CreateOrgUnitDto } from './create-org-unit.dto';

function validDto(overrides: Partial<CreateOrgUnitDto> = {}): CreateOrgUnitDto {
  const dto = new CreateOrgUnitDto();
  dto.orgUnitTypeId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  dto.code = 'HQ';
  dto.name = 'Headquarters';
  return Object.assign(dto, overrides);
}

describe('CreateOrgUnitDto', () => {
  it('passes validation with a valid payload and no parentId', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a valid parentId', async () => {
    const errors = await validate(
      validDto({ parentId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid orgUnitTypeId', async () => {
    const errors = await validate(validDto({ orgUnitTypeId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'orgUnitTypeId')).toBe(true);
  });

  it('rejects an invalid parentId', async () => {
    const errors = await validate(validDto({ parentId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'parentId')).toBe(true);
  });

  it('rejects an empty name', async () => {
    const errors = await validate(validDto({ name: '' }));

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });
});
