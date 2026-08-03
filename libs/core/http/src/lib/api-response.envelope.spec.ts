import { createApiErrorResponse, createApiResponse } from './api-response.envelope';

describe('createApiResponse', () => {
  it('wraps data in a success envelope with a timestamp', () => {
    const response = createApiResponse({ id: 1 });

    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: 1 });
    expect(response.meta.timestamp).toEqual(expect.any(String));
  });

  it('merges extra meta fields', () => {
    const response = createApiResponse({ id: 1 }, { requestId: 'req-1' });

    expect(response.meta['requestId']).toBe('req-1');
  });
});

describe('createApiErrorResponse', () => {
  it('wraps an error body in a failure envelope', () => {
    const response = createApiErrorResponse({ code: 'DOMAIN.NOT_FOUND', message: 'Not found' });

    expect(response.success).toBe(false);
    expect(response.error).toEqual({ code: 'DOMAIN.NOT_FOUND', message: 'Not found' });
    expect(response.meta.timestamp).toEqual(expect.any(String));
  });
});
