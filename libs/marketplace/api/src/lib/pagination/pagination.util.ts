export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function parsePagination(params: PaginationParams, defaults: { limit: number; offset: number } = { limit: 20, offset: 0 }): Required<PaginationParams> {
  const limit = Math.min(Math.max(params.limit ?? defaults.limit, 1), 100);
  const offset = Math.max(params.offset ?? defaults.offset, 0);
  return { limit, offset };
}

export function paginatedResult<T>(data: T[], total: number, limit: number, offset: number): PaginatedResult<T> {
  return { data, total, limit, offset, hasMore: offset + limit < total };
}
