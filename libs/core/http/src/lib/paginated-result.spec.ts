import { createPaginatedResult } from './paginated-result';

describe('createPaginatedResult', () => {
  it('computes totalPages from total and limit', () => {
    const result = createPaginatedResult([1, 2, 3], 1, 20, 45);

    expect(result).toEqual({ items: [1, 2, 3], page: 1, limit: 20, total: 45, totalPages: 3 });
  });

  it('returns at least one page when total is zero', () => {
    const result = createPaginatedResult([], 1, 20, 0);

    expect(result.totalPages).toBe(1);
  });
});
