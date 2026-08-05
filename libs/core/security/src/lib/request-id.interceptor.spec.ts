import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestIdInterceptor } from './request-id.interceptor';
import * as uuid from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('RequestIdInterceptor', () => {
  let interceptor: RequestIdInterceptor;
  let mockRequest: { headers: Record<string, string>; requestId?: string };
  let mockResponse: { setHeader: jest.Mock };
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new RequestIdInterceptor();

    mockRequest = { headers: {} };
    mockResponse = { setHeader: jest.fn() };
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(undefined)),
    };
  });

  it('should generate a UUID when no X-Request-Id header present', () => {
    interceptor.intercept(mockContext, mockCallHandler).subscribe();
    expect(uuid.v4).toHaveBeenCalled();
    expect(mockRequest.requestId).toBe('test-uuid-1234');
  });

  it('should use existing X-Request-Id header when provided', () => {
    mockRequest.headers['x-request-id'] = 'existing-id-abc';
    interceptor.intercept(mockContext, mockCallHandler).subscribe();
    expect(uuid.v4).not.toHaveBeenCalled();
    expect(mockRequest.requestId).toBe('existing-id-abc');
  });

  it('should set X-Request-Id on response', () => {
    interceptor.intercept(mockContext, mockCallHandler).subscribe();
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-Id', 'test-uuid-1234');
  });

  it('should pipe the call handler', () => {
    interceptor.intercept(mockContext, mockCallHandler).subscribe();
    expect(mockCallHandler.handle).toHaveBeenCalled();
  });
});
