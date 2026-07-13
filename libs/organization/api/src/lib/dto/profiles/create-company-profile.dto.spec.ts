import { validate } from 'class-validator';
import { CreateCompanyProfileDto } from './create-company-profile.dto';

function validDto(overrides: Partial<CreateCompanyProfileDto> = {}): CreateCompanyProfileDto {
  const dto = new CreateCompanyProfileDto();
  dto.legalName = 'Afribiz Holdings Ltd';
  dto.registrationNumber = 'REG-001';
  dto.taxCountryCode = 'TZ';
  dto.taxNumber = '123-456-789';
  dto.functionalCurrency = 'TZS';
  dto.fiscalYearStartMonth = 7;
  return Object.assign(dto, overrides);
}

describe('CreateCompanyProfileDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid ISO country code', async () => {
    const errors = await validate(validDto({ taxCountryCode: 'ZZ' }));

    expect(errors.some((error) => error.property === 'taxCountryCode')).toBe(true);
  });

  it('rejects an invalid ISO currency code', async () => {
    const errors = await validate(validDto({ functionalCurrency: 'ZZZ' }));

    expect(errors.some((error) => error.property === 'functionalCurrency')).toBe(true);
  });

  it('rejects a fiscalYearStartMonth outside 1-12', async () => {
    const errors = await validate(validDto({ fiscalYearStartMonth: 13 }));

    expect(errors.some((error) => error.property === 'fiscalYearStartMonth')).toBe(true);
  });

  it('rejects an empty legalName', async () => {
    const errors = await validate(validDto({ legalName: '' }));

    expect(errors.some((error) => error.property === 'legalName')).toBe(true);
  });
});
