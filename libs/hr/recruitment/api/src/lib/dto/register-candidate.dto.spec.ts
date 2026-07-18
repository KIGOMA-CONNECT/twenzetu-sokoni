import { validate } from 'class-validator';
import { RegisterCandidateDto } from './register-candidate.dto';

function validDto(overrides: Partial<RegisterCandidateDto> = {}): RegisterCandidateDto {
  const dto = new RegisterCandidateDto();
  dto.firstName = 'Amina';
  dto.lastName = 'Juma';
  dto.email = 'amina.juma@example.com';
  return Object.assign(dto, overrides);
}

describe('RegisterCandidateDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const errors = await validate(validDto({ email: 'not-an-email' }));

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('rejects an invalid resumeUrl', async () => {
    const errors = await validate(validDto({ resumeUrl: 'not-a-url' }));

    expect(errors.some((error) => error.property === 'resumeUrl')).toBe(true);
  });

  it('allows omitting all optional fields', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });
});
