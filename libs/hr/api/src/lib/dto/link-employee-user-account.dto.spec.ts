import { validate } from 'class-validator';
import { LinkEmployeeUserAccountDto } from './link-employee-user-account.dto';

describe('LinkEmployeeUserAccountDto', () => {
  it('passes validation with a valid uuid', async () => {
    const dto = new LinkEmployeeUserAccountDto();
    dto.userId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-uuid userId', async () => {
    const dto = new LinkEmployeeUserAccountDto();
    dto.userId = 'not-a-uuid';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'userId')).toBe(true);
  });
});
