import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

function validDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
  const dto = new CreateUserDto();
  dto.email = 'pm@afribiz.co.tz';
  dto.password = 'StrongPass1';
  dto.role = 'PROJECT_MANAGER';
  return Object.assign(dto, overrides);
}

describe('CreateUserDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a role outside the fixed set', async () => {
    const errors = await validate(validDto({ role: 'SUPERADMIN' as never }));

    expect(errors.some((error) => error.property === 'role')).toBe(true);
  });

  it('rejects an invalid email', async () => {
    const errors = await validate(validDto({ email: 'not-an-email' }));

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });
});
