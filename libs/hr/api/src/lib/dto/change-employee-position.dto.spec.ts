import { validate } from 'class-validator';
import { ChangeEmployeePositionDto } from './change-employee-position.dto';

describe('ChangeEmployeePositionDto', () => {
  it('passes validation with no newPositionId (clearing the position)', async () => {
    const errors = await validate(new ChangeEmployeePositionDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a valid uuid', async () => {
    const dto = new ChangeEmployeePositionDto();
    dto.newPositionId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-uuid newPositionId', async () => {
    const dto = new ChangeEmployeePositionDto();
    dto.newPositionId = 'not-a-uuid';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'newPositionId')).toBe(true);
  });
});
