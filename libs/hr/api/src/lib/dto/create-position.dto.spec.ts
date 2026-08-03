import { validate } from 'class-validator';
import { CreatePositionDto } from './create-position.dto';

function validDto(overrides: Partial<CreatePositionDto> = {}): CreatePositionDto {
  const dto = new CreatePositionDto();
  dto.code = 'SE';
  dto.title = 'Software Engineer';
  return Object.assign(dto, overrides);
}

describe('CreatePositionDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty code', async () => {
    const errors = await validate(validDto({ code: '' }));

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('rejects an empty title', async () => {
    const errors = await validate(validDto({ title: '' }));

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });
});
