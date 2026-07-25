import { parsePagination, paginatedResult } from './pagination.util';

describe('parsePagination', () => {
  it('should return default values when no params provided', () => {
    const result = parsePagination({});
    expect(result).toEqual({ limit: 20, offset: 0 });
  });

  it('should use provided values when within range', () => {
    const result = parsePagination({ limit: 10, offset: 5 });
    expect(result).toEqual({ limit: 10, offset: 5 });
  });

  it('should clamp limit to max 100', () => {
    const result = parsePagination({ limit: 200 });
    expect(result.limit).toBe(100);
  });

  it('should clamp limit to min 1', () => {
    const result = parsePagination({ limit: 0 });
    expect(result.limit).toBe(1);
  });

  it('should clamp negative limit to 1', () => {
    const result = parsePagination({ limit: -5 });
    expect(result.limit).toBe(1);
  });

  it('should clamp offset to min 0', () => {
    const result = parsePagination({ offset: -10 });
    expect(result.offset).toBe(0);
  });

  it('should use custom defaults when provided', () => {
    const result = parsePagination({}, { limit: 50, offset: 10 });
    expect(result).toEqual({ limit: 50, offset: 10 });
  });

  it('should prefer explicit params over custom defaults', () => {
    const result = parsePagination({ limit: 5 }, { limit: 50, offset: 10 });
    expect(result).toEqual({ limit: 5, offset: 10 });
  });
});

describe('paginatedResult', () => {
  it('should return correct shape with hasMore=true when more results exist', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = paginatedResult(data, 10, 2, 0);
    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      total: 10,
      limit: 2,
      offset: 0,
      hasMore: true,
    });
  });

  it('should return hasMore=false when at the end of results', () => {
    const data = [{ id: 9 }, { id: 10 }];
    const result = paginatedResult(data, 10, 2, 8);
    expect(result).toEqual({
      data: [{ id: 9 }, { id: 10 }],
      total: 10,
      limit: 2,
      offset: 8,
      hasMore: false,
    });
  });

  it('should return hasMore=false when offset+limit equals total', () => {
    const result = paginatedResult([], 5, 5, 0);
    expect(result.hasMore).toBe(false);
  });

  it('should return hasMore=true when offset+limit is less than total', () => {
    const result = paginatedResult([], 100, 10, 0);
    expect(result.hasMore).toBe(true);
  });
});
