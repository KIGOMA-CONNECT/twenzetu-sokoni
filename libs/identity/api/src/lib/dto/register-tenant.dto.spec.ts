import { validate } from 'class-validator';
import { RegisterTenantDto } from './register-tenant.dto';

function validDto(overrides: Partial<RegisterTenantDto> = {}): RegisterTenantDto {
  const dto = new RegisterTenantDto();
  dto.businessName = 'Afribiz Holdings Ltd';
  dto.ceoEmail = 'ceo@afribiz.co.tz';
  dto.ceoPassword = 'StrongPass1';
  return Object.assign(dto, overrides);
}

describe('RegisterTenantDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const errors = await validate(validDto({ ceoEmail: 'not-an-email' }));

    expect(errors.some((error) => error.property === 'ceoEmail')).toBe(true);
  });

  it('rejects a weak password', async () => {
    const errors = await validate(validDto({ ceoPassword: 'weak' }));

    expect(errors.some((error) => error.property === 'ceoPassword')).toBe(true);
  });

  it('rejects an empty businessName', async () => {
    const errors = await validate(validDto({ businessName: '' }));

    expect(errors.some((error) => error.property === 'businessName')).toBe(true);
  });
});
