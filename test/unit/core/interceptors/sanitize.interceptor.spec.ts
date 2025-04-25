import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { SanitizeInterceptor } from '../../../../src/core/interceptors/sanitize.interceptor';

describe('SanitizeInterceptor', () => {
  let interceptor: SanitizeInterceptor;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    interceptor = new SanitizeInterceptor();
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should remove sensitive fields from response object', (done) => {
    const mockData = {
      id: 1,
      username: 'test',
      password: 'secret123',
      token: 'abc123',
      secret: 'mysecret',
      key: 'mykey',
      nested: {
        password: 'nestedSecret',
        token: 'nestedToken',
      },
    };

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          id: 1,
          username: 'test',
          nested: {},
        });
        expect(result.password).toBeUndefined();
        expect(result.token).toBeUndefined();
        expect(result.secret).toBeUndefined();
        expect(result.key).toBeUndefined();
        expect(result.nested.password).toBeUndefined();
        expect(result.nested.token).toBeUndefined();
        done();
      },
    });
  });

  it('should handle array of objects with sensitive data', (done) => {
    const mockData = [
      {
        id: 1,
        username: 'user1',
        password: 'pass1',
      },
      {
        id: 2,
        username: 'user2',
        token: 'token2',
      },
    ];

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual([
          {
            id: 1,
            username: 'user1',
          },
          {
            id: 2,
            username: 'user2',
          },
        ]);
        expect(result[0].password).toBeUndefined();
        expect(result[1].token).toBeUndefined();
        done();
      },
    });
  });

  it('should handle non-object response data', (done) => {
    const mockData = 'test string';

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe('test string');
        done();
      },
    });
  });

  it('should handle null response data', (done) => {
    const mockData = null;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBeNull();
        done();
      },
    });
  });

  it('should handle deeply nested sensitive data', (done) => {
    const mockData = {
      level1: {
        level2: {
          level3: {
            password: 'deeplyNested',
            token: 'secretToken',
            safe: 'data',
          },
        },
      },
    };

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          level1: {
            level2: {
              level3: {
                safe: 'data',
              },
            },
          },
        });
        expect(result.level1.level2.level3.password).toBeUndefined();
        expect(result.level1.level2.level3.token).toBeUndefined();
        done();
      },
    });
  });
});
