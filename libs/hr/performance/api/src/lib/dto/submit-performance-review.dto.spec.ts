import { validate } from 'class-validator';
import { SubmitPerformanceReviewDto } from './submit-performance-review.dto';

function validDto(overrides: Partial<SubmitPerformanceReviewDto> = {}): SubmitPerformanceReviewDto {
  const dto = new SubmitPerformanceReviewDto();
  dto.rating = 4;
  return Object.assign(dto, overrides);
}

describe('SubmitPerformanceReviewDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a rating above 5', async () => {
    const errors = await validate(validDto({ rating: 6 }));

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });

  it('rejects a rating below 1', async () => {
    const errors = await validate(validDto({ rating: 0 }));

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });
});
