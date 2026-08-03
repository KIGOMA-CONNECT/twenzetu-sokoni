import { validate } from 'class-validator';
import { CreateCourseDto } from './create-course.dto';

function validDto(overrides: Partial<CreateCourseDto> = {}): CreateCourseDto {
  const dto = new CreateCourseDto();
  dto.title = 'Workplace Safety';
  dto.durationHours = 4;
  dto.category = 'COMPLIANCE';
  return Object.assign(dto, overrides);
}

describe('CreateCourseDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty title', async () => {
    const errors = await validate(validDto({ title: '' }));

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('rejects a durationHours above 1000', async () => {
    const errors = await validate(validDto({ durationHours: 1001 }));

    expect(errors.some((error) => error.property === 'durationHours')).toBe(true);
  });

  it('rejects an invalid category', async () => {
    const errors = await validate(validDto({ category: 'MADE_UP' as CreateCourseDto['category'] }));

    expect(errors.some((error) => error.property === 'category')).toBe(true);
  });
});
