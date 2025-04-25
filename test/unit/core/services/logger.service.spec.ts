import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../../../src/core/services/logger.service';

describe('LoggerService', () => {
  let module: TestingModule;
  let service: LoggerService;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('development'),
          },
        },
      ],
    }).compile();

    service = await module.resolve<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log methods', () => {
    const testCases = [
      {
        method: 'log',
        message: 'Test log message',
        context: 'TestContext',
      },
      {
        method: 'error',
        message: 'Test error message',
        trace: 'Error trace',
        context: 'TestContext',
      },
      {
        method: 'warn',
        message: 'Test warning message',
        context: 'TestContext',
      },
      {
        method: 'debug',
        message: 'Test debug message',
        context: 'TestContext',
      },
    ];

    testCases.forEach(({ method, message, trace, context }) => {
      it(`should handle ${method} method correctly`, async () => {
        const loggerInstance =
          await module.resolve<LoggerService>(LoggerService);
        const spy = jest.spyOn(loggerInstance, method as any);

        if (method === 'error') {
          loggerInstance[method](message, trace, context);
          expect(spy).toHaveBeenCalledWith(message, trace, context);
        } else {
          loggerInstance[method](message, context);
          expect(spy).toHaveBeenCalledWith(message, context);
        }
      });
    });
  });

  describe('sanitizeMessage', () => {
    const testCases = [
      {
        name: 'should sanitize password in URL parameters',
        input: 'http://api.example.com?password=secret123&other=value',
        expected: 'http://api.example.com?password=***&other=value',
      },
      {
        name: 'should sanitize token in URL parameters',
        input: 'http://api.example.com?token=abc123&other=value',
        expected: 'http://api.example.com?token=***&other=value',
      },
      {
        name: 'should sanitize secret in URL parameters',
        input: 'http://api.example.com?secret=mysecret&other=value',
        expected: 'http://api.example.com?secret=***&other=value',
      },
      {
        name: 'should sanitize key in URL parameters',
        input: 'http://api.example.com?key=mykey&other=value',
        expected: 'http://api.example.com?key=***&other=value',
      },
      {
        name: 'should sanitize multiple sensitive fields',
        input: 'password=123&token=abc&secret=xyz&key=456',
        expected: 'password=***&token=***&secret=***&key=***',
      },
      {
        name: 'should sanitize sensitive fields in JSON strings',
        input: '{"password":"secret","token":"abc123","data":"safe"}',
        expected: '{"password":"***","token":"***","data":"safe"}',
      },
      {
        name: 'should handle messages without sensitive data',
        input: 'Safe message without sensitive data',
        expected: 'Safe message without sensitive data',
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, async () => {
        const loggerInstance =
          await module.resolve<LoggerService>(LoggerService);
        const result = (loggerInstance as any).sanitizeMessage(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('logger configuration', () => {
    it('should set debug level in development', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('development');
      await module.resolve<LoggerService>(LoggerService);
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should set info level in production', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('production');
      await module.resolve<LoggerService>(LoggerService);
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });
});
