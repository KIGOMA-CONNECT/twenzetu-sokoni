import { validate } from 'class-validator';
import { CreateBranchProfileDto } from './create-branch-profile.dto';

function validDto(overrides: Partial<CreateBranchProfileDto> = {}): CreateBranchProfileDto {
  const dto = new CreateBranchProfileDto();
  dto.addressLine1 = 'Moi Avenue';
  dto.addressCity = 'Nairobi';
  dto.addressCountryCode = 'KE';
  dto.operatingCurrency = 'KES';
  return Object.assign(dto, overrides);
}

describe('CreateBranchProfileDto', () => {
  it('passes validation with only required fields', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with all optional fields provided', async () => {
    const errors = await validate(
      validDto({ addressLine2: 'Suite 4B', contactPhone: '+254700000000', contactEmail: 'ops@example.com' }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid ISO country code', async () => {
    const errors = await validate(validDto({ addressCountryCode: 'ZZ' }));

    expect(errors.some((error) => error.property === 'addressCountryCode')).toBe(true);
  });

  it('rejects an invalid ISO currency code', async () => {
    const errors = await validate(validDto({ operatingCurrency: 'ZZZ' }));

    expect(errors.some((error) => error.property === 'operatingCurrency')).toBe(true);
  });

  it('rejects an invalid contactEmail', async () => {
    const errors = await validate(validDto({ contactEmail: 'not-an-email' }));

    expect(errors.some((error) => error.property === 'contactEmail')).toBe(true);
  });

  it('rejects an empty addressCity', async () => {
    const errors = await validate(validDto({ addressCity: '' }));

    expect(errors.some((error) => error.property === 'addressCity')).toBe(true);
  });
});
