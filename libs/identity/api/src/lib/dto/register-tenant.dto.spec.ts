import { validate } from 'class-validator';
import { RegisterTenantDto } from './register-tenant.dto';

function validDto(overrides: Partial<RegisterTenantDto> = {}): RegisterTenantDto {
  const dto = new RegisterTenantDto();
  dto.name = 'Afribiz Holdings Ltd';
  return Object.assign(dto, overrides);
}

describe('RegisterTenantDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const errors = await validate(validDto({ name: '' }));

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects a non-string name', async () => {
    const errors = await validate(validDto({ name: 42 as unknown as string }));

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });
});
