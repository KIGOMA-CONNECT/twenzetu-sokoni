import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('defaults to page 1 and limit 20 when nothing is provided', async () => {
    const dto = plainToInstance(PaginationQueryDto, {});
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.skip).toBe(0);
  });

  it('coerces string query params into numbers', async () => {
    const dto = plainToInstance(PaginationQueryDto, { page: '3', limit: '10' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(10);
    expect(dto.skip).toBe(20);
  });

  it('rejects a limit above the maximum', async () => {
    const dto = plainToInstance(PaginationQueryDto, { limit: '500' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('rejects a non-integer page', async () => {
    const dto = plainToInstance(PaginationQueryDto, { page: 'abc' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });
});
