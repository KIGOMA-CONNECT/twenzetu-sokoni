export interface ApiResponseMeta {
  readonly timestamp: string;
  readonly [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: ApiResponseMeta;
}

export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorBody;
  readonly meta: ApiResponseMeta;
}

export function createApiResponse<T>(
  data: T,
  meta: Record<string, unknown> = {},
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta: { timestamp: new Date().toISOString(), ...meta },
  };
}

export function createApiErrorResponse(
  error: ApiErrorBody,
  meta: Record<string, unknown> = {},
): ApiErrorResponse {
  return {
    success: false,
    error,
    meta: { timestamp: new Date().toISOString(), ...meta },
  };
}
