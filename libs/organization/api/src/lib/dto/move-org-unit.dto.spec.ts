import { validate } from 'class-validator';
import { MoveOrgUnitDto } from './move-org-unit.dto';

function validDto(overrides: Partial<MoveOrgUnitDto> = {}): MoveOrgUnitDto {
  const dto = new MoveOrgUnitDto();
  dto.expectedVersion = 1;
  return Object.assign(dto, overrides);
}

describe('MoveOrgUnitDto', () => {
  it('passes validation without a newParentId (move to root)', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a valid newParentId', async () => {
    const errors = await validate(
      validDto({ newParentId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid newParentId', async () => {
    const errors = await validate(validDto({ newParentId: 'not-a-uuid' }));

    expect(errors.some((error) => error.property === 'newParentId')).toBe(true);
  });

  it('rejects a non-positive expectedVersion', async () => {
    const errors = await validate(validDto({ expectedVersion: 0 }));

    expect(errors.some((error) => error.property === 'expectedVersion')).toBe(true);
  });
});
