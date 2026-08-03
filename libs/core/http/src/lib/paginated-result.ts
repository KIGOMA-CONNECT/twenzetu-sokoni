export interface PaginatedResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export function createPaginatedResult<T>(
  items: ReadonlyArray<T>,
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
