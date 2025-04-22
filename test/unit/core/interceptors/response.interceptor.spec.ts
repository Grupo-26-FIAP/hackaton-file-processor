import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from '../../../../src/core/interceptors/response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockRequest = {
      url: '/api/v1/test',
    };
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform the response data', (done) => {
    const mockData = { message: 'test' };
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (response) => {
        expect(response).toEqual({
          data: mockData,
          timestamp: expect.any(String),
          path: mockRequest.url,
        });
        expect(new Date(response.timestamp).getTime()).not.toBeNaN();
        done();
      },
    });
  });

  it('should handle different types of response data', (done) => {
    const mockData = ['item1', 'item2'];
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (response) => {
        expect(response.data).toEqual(mockData);
        expect(response.path).toBe(mockRequest.url);
        done();
      },
    });
  });

  it('should use the correct request URL', (done) => {
    const mockData = { message: 'test' };
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (response) => {
        expect(response.path).toBe(mockRequest.url);
        done();
      },
    });
  });
});
