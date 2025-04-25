import {
  DeleteMessageCommand,
  DeleteMessageCommandOutput,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsumerService } from '../../../../src/modules/queue/consumers/consumer.service';
import { ProcessorService } from '../../../../src/modules/video/services/processor.service';

jest.mock('@aws-sdk/client-sqs', () => {
  const mockSend = jest.fn();
  const mockSQSClient = jest.fn(() => ({
    send: mockSend,
  }));
  mockSQSClient.prototype.send = mockSend;
  return {
    ...jest.requireActual('@aws-sdk/client-sqs'),
    SQSClient: mockSQSClient,
    ReceiveMessageCommand: jest.fn(),
    DeleteMessageCommand: jest.fn(),
  };
});

describe('ConsumerService', () => {
  let service: ConsumerService;
  let mockProcessorService: jest.Mocked<ProcessorService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockSQSClient: jest.Mocked<SQSClient>;
  let mockLogger: jest.Mocked<Logger>;
  let mockQueueConfig: any;

  beforeEach(async () => {
    mockQueueConfig = {
      inputQueueUrl: 'test-queue-url',
      maxConcurrentProcessing: 10,
      waitTimeSeconds: 20,
      visibilityTimeout: 30,
      retryDelay: 1000,
      region: 'us-east-1',
    };

    mockSQSClient = {
      send: jest
        .fn()
        .mockImplementation(
          (
            command,
          ): Promise<
            ReceiveMessageCommandOutput | DeleteMessageCommandOutput
          > => {
            if (command instanceof ReceiveMessageCommand) {
              return Promise.resolve({
                Messages: [],
                $metadata: {},
              } as ReceiveMessageCommandOutput);
            }
            return Promise.resolve({
              $metadata: {},
            } as DeleteMessageCommandOutput);
          },
        ),
      config: {} as any,
      destroy: jest.fn(),
      middlewareStack: {} as any,
    } as unknown as jest.Mocked<SQSClient>;

    mockProcessorService = {
      handleMessage: jest.fn(),
      logger: {} as any,
      s3Client: {} as any,
      configService: {} as any,
      videoService: {} as any,
    } as unknown as jest.Mocked<ProcessorService>;

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'queue') {
          return mockQueueConfig;
        }
        return null;
      }),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      localInstance: {} as any,
    } as unknown as jest.Mocked<Logger>;

    (SQSClient as jest.Mock).mockImplementation(() => mockSQSClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumerService,
        {
          provide: ProcessorService,
          useValue: mockProcessorService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: SQSClient,
          useValue: mockSQSClient,
        },
      ],
    }).compile();

    service = module.get<ConsumerService>(ConsumerService);
    // @ts-expect-error - Replace SQS client with mock
    service['sqs'] = mockSQSClient;
    // @ts-expect-error - Replace logger with mock
    service['logger'] = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should start polling the queue', async () => {
      const pollQueueSpy = jest
        .spyOn(service as any, 'pollQueue')
        .mockImplementation(async () => {
          // Mock implementation that doesn't loop
          const command = new ReceiveMessageCommand({
            QueueUrl: mockQueueConfig.inputQueueUrl,
            MaxNumberOfMessages: mockQueueConfig.maxConcurrentProcessing,
            WaitTimeSeconds: mockQueueConfig.waitTimeSeconds,
            VisibilityTimeout: mockQueueConfig.visibilityTimeout,
          });

          const response = await mockSQSClient.send(command);
          return response.Messages ?? [];
        });

      await service.onModuleInit();
      expect(pollQueueSpy).toHaveBeenCalled();
    });

    it('should handle initialization error', async () => {
      const error = new Error('Initialization error');
      jest.spyOn(service as any, 'pollQueue').mockRejectedValue(error);

      await service.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao inicializar o consumidor: Initialization error',
        error.stack,
      );
    });

    it('should stop processing when module is destroyed', async () => {
      // Set isProcessing to true
      Object.defineProperty(service, 'isProcessing', {
        value: true,
        writable: true,
      });

      await service.onModuleDestroy();

      // Check isProcessing value
      expect(service['isProcessing']).toBe(false);
    });
  });

  describe('message processing', () => {
    it('should process messages from SQS queue successfully', async () => {
      const mockMessages = [
        {
          MessageId: '1',
          Body: JSON.stringify({ id: '123', type: 'video' }),
          ReceiptHandle: 'receipt1',
        },
      ];

      mockSQSClient.send = jest
        .fn()
        .mockImplementation(
          (
            command,
          ): Promise<
            ReceiveMessageCommandOutput | DeleteMessageCommandOutput
          > => {
            if (command instanceof ReceiveMessageCommand) {
              return Promise.resolve({
                Messages: mockMessages,
                $metadata: {},
              } as ReceiveMessageCommandOutput);
            }
            return Promise.resolve({
              $metadata: {},
            } as DeleteMessageCommandOutput);
          },
        );

      // Mock the pollQueue method to avoid infinite loop
      jest.spyOn(service as any, 'pollQueue').mockImplementation(async () => {
        const messages = await service['receiveMessages']();
        if (messages.length > 0) {
          mockLogger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map((msg) => service['processMessage'](msg)),
          );
        }
      });

      await service.onModuleInit();

      expect(mockProcessorService.handleMessage).toHaveBeenCalledWith({
        id: '123',
        type: 'video',
      });
      expect(mockSQSClient.send).toHaveBeenCalledTimes(2); // Once for receive, once for delete
      expect(mockLogger.log).toHaveBeenCalledWith('Processando 1 mensagens');
    });

    it('should handle empty response from SQS', async () => {
      mockSQSClient.send = jest
        .fn()
        .mockImplementation(
          (
            command,
          ): Promise<
            ReceiveMessageCommandOutput | DeleteMessageCommandOutput
          > => {
            if (command instanceof ReceiveMessageCommand) {
              return Promise.resolve({
                Messages: [],
                $metadata: {},
              } as ReceiveMessageCommandOutput);
            }
            return Promise.resolve({
              $metadata: {},
            } as DeleteMessageCommandOutput);
          },
        );

      // Mock the pollQueue method to avoid infinite loop
      jest.spyOn(service as any, 'pollQueue').mockImplementation(async () => {
        const messages = await service['receiveMessages']();
        if (messages.length > 0) {
          mockLogger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map((msg) => service['processMessage'](msg)),
          );
        }
      });

      await service.onModuleInit();

      expect(mockProcessorService.handleMessage).not.toHaveBeenCalled();
      expect(mockSQSClient.send).toHaveBeenCalledTimes(1); // Only for receive
    });

    it('should handle errors when polling queue and retry after delay', async () => {
      const mockError = new Error('SQS error');
      mockSQSClient.send = jest.fn().mockRejectedValue(mockError);

      // Mock the pollQueue method to avoid infinite loop
      jest.spyOn(service as any, 'pollQueue').mockImplementation(async () => {
        try {
          const messages = await service['receiveMessages']();
          if (messages.length > 0) {
            mockLogger.log(`Processando ${messages.length} mensagens`);
            await Promise.all(
              messages.map((msg) => service['processMessage'](msg)),
            );
          }
        } catch (err) {
          mockLogger.error(
            `Erro ao consumir mensagens da fila: ${err.message}`,
            err.stack,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, mockQueueConfig.retryDelay),
          );
        }
      });

      await service.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao consumir mensagens da fila: SQS error',
        mockError.stack,
      );
    });

    it('should handle invalid JSON in message body', async () => {
      const mockMessages = [
        {
          MessageId: '1',
          Body: 'invalid json',
          ReceiptHandle: 'receipt1',
        },
      ];

      mockSQSClient.send = jest
        .fn()
        .mockImplementation(
          (
            command,
          ): Promise<
            ReceiveMessageCommandOutput | DeleteMessageCommandOutput
          > => {
            if (command instanceof ReceiveMessageCommand) {
              return Promise.resolve({
                Messages: mockMessages,
                $metadata: {},
              } as ReceiveMessageCommandOutput);
            }
            return Promise.resolve({
              $metadata: {},
            } as DeleteMessageCommandOutput);
          },
        );

      // Mock the pollQueue method to avoid infinite loop
      jest.spyOn(service as any, 'pollQueue').mockImplementation(async () => {
        const messages = await service['receiveMessages']();
        if (messages.length > 0) {
          mockLogger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map((msg) => service['processMessage'](msg)),
          );
        }
      });

      await service.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockProcessorService.handleMessage).not.toHaveBeenCalled();
    });

    it('should handle processing errors for individual messages', async () => {
      const mockMessages = [
        {
          MessageId: '1',
          Body: JSON.stringify({ id: '123', type: 'video' }),
          ReceiptHandle: 'receipt1',
        },
      ];

      const processingError = new Error('Processing failed');
      mockProcessorService.handleMessage.mockRejectedValue(processingError);

      mockSQSClient.send = jest
        .fn()
        .mockImplementation(
          (
            command,
          ): Promise<
            ReceiveMessageCommandOutput | DeleteMessageCommandOutput
          > => {
            if (command instanceof ReceiveMessageCommand) {
              return Promise.resolve({
                Messages: mockMessages,
                $metadata: {},
              } as ReceiveMessageCommandOutput);
            }
            return Promise.resolve({
              $metadata: {},
            } as DeleteMessageCommandOutput);
          },
        );

      // Mock the pollQueue method to avoid infinite loop
      jest.spyOn(service as any, 'pollQueue').mockImplementation(async () => {
        const messages = await service['receiveMessages']();
        if (messages.length > 0) {
          mockLogger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map((msg) => service['processMessage'](msg)),
          );
        }
      });

      await service.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Falha ao processar mensagem 1: Processing failed',
        processingError.stack,
      );
      expect(mockSQSClient.send).toHaveBeenCalledTimes(1); // Only for receive, not for delete
    });

    it('should handle multiple messages in batch', async () => {
      const mockMessages = [
        {
          MessageId: '1',
          Body: JSON.stringify({ id: '123', type: 'video' }),
          ReceiptHandle: 'receipt1',
        },
        {
          MessageId: '2',
          Body: JSON.stringify({ id: '456', type: 'video' }),
          ReceiptHandle: 'receipt2',
        },
      ];

      mockSQSClient.send = jest
        .fn()
        .mockImplementation(
          (
            command,
          ): Promise<
            ReceiveMessageCommandOutput | DeleteMessageCommandOutput
          > => {
            if (command instanceof ReceiveMessageCommand) {
              return Promise.resolve({
                Messages: mockMessages,
                $metadata: {},
              } as ReceiveMessageCommandOutput);
            }
            return Promise.resolve({
              $metadata: {},
            } as DeleteMessageCommandOutput);
          },
        );

      // Mock the pollQueue method to avoid infinite loop
      jest.spyOn(service as any, 'pollQueue').mockImplementation(async () => {
        const messages = await service['receiveMessages']();
        if (messages.length > 0) {
          mockLogger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map((msg) => service['processMessage'](msg)),
          );
        }
      });

      await service.onModuleInit();

      expect(mockProcessorService.handleMessage).toHaveBeenCalledTimes(2);
      expect(mockSQSClient.send).toHaveBeenCalledTimes(3); // Once for receive, twice for delete
      expect(mockLogger.log).toHaveBeenCalledWith('Processando 2 mensagens');
    });

    it('should handle delete message failure', async () => {
      const mockMessages = [
        {
          MessageId: '1',
          Body: JSON.stringify({ id: '123', type: 'video' }),
          ReceiptHandle: 'receipt1',
        },
      ];

      let callCount = 0;
      mockSQSClient.send = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            Messages: mockMessages,
            $metadata: {},
          });
        }
        if (callCount === 2) {
          return Promise.reject(new Error('Delete message failed'));
        }
        // Simula parada do consumidor após a falha
        Object.defineProperty(service, 'isProcessing', {
          value: false,
          writable: true,
        });
        return Promise.resolve({ Messages: [], $metadata: {} });
      });

      // Mock do processamento para garantir que ele seja executado
      mockProcessorService.handleMessage = jest
        .fn()
        .mockResolvedValue(undefined);

      await service['pollQueue']();

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Falha ao processar mensagem 1: Delete message failed`,
        expect.any(String),
      );
      expect(mockProcessorService.handleMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined message body', async () => {
      const mockMessages = [
        {
          MessageId: '1',
          ReceiptHandle: 'receipt1',
        },
      ];

      mockSQSClient.send = jest
        .fn()
        .mockImplementation(
          (
            command,
          ): Promise<
            ReceiveMessageCommandOutput | DeleteMessageCommandOutput
          > => {
            if (command instanceof ReceiveMessageCommand) {
              return Promise.resolve({
                Messages: mockMessages,
                $metadata: {},
              } as ReceiveMessageCommandOutput);
            }
            return Promise.resolve({
              $metadata: {},
            } as DeleteMessageCommandOutput);
          },
        );

      // Mock the pollQueue method to avoid infinite loop
      jest.spyOn(service as any, 'pollQueue').mockImplementation(async () => {
        const messages = await service['receiveMessages']();
        if (messages.length > 0) {
          mockLogger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map((msg) => service['processMessage'](msg)),
          );
        }
      });

      await service.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockProcessorService.handleMessage).not.toHaveBeenCalled();
    });
  });

  describe('pollQueue', () => {
    it('should continue processing while isProcessing is true', async () => {
      const mockMessages = [
        {
          MessageId: '1',
          Body: JSON.stringify({ id: '123', type: 'video' }),
          ReceiptHandle: 'receipt1',
        },
        {
          MessageId: '2',
          Body: JSON.stringify({ id: '456', type: 'video' }),
          ReceiptHandle: 'receipt2',
        },
      ];

      let callCount = 0;
      mockSQSClient.send = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            Messages: mockMessages,
            $metadata: {},
          });
        }
        // Simula parada do consumidor após primeira batch
        Object.defineProperty(service, 'isProcessing', {
          value: false,
          writable: true,
        });
        return Promise.resolve({ Messages: [], $metadata: {} });
      });

      await service['pollQueue']();

      expect(mockLogger.log).toHaveBeenCalledWith('Processando 2 mensagens');
      expect(mockProcessorService.handleMessage).toHaveBeenCalledTimes(2);
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(DeleteMessageCommand),
      );
    });

    it('should retry after error with delay', async () => {
      const error = new Error('Network error');
      const mockMessages = [
        {
          MessageId: '1',
          Body: JSON.stringify({ id: '123', type: 'video' }),
          ReceiptHandle: 'receipt1',
        },
      ];

      let callCount = 0;
      mockSQSClient.send = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw error;
        }
        // Simula parada do consumidor após primeira tentativa
        Object.defineProperty(service, 'isProcessing', {
          value: false,
          writable: true,
        });
        return Promise.resolve({
          Messages: mockMessages,
          $metadata: {},
        });
      });

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      await service['pollQueue']();

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Erro ao consumir mensagens da fila: ${error.message}`,
        error.stack,
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        mockQueueConfig.retryDelay,
      );
    });

    it('should process multiple messages concurrently', async () => {
      const mockMessages = Array.from({ length: 5 }, (_, i) => ({
        MessageId: `${i + 1}`,
        Body: JSON.stringify({ id: `${i + 1}`, type: 'video' }),
        ReceiptHandle: `receipt${i + 1}`,
      }));

      let callCount = 0;
      mockSQSClient.send = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            Messages: mockMessages,
            $metadata: {},
          });
        }
        // Simula parada do consumidor após primeira batch
        Object.defineProperty(service, 'isProcessing', {
          value: false,
          writable: true,
        });
        return Promise.resolve({ Messages: [], $metadata: {} });
      });

      // Simula processamento assíncrono com diferentes tempos
      mockProcessorService.handleMessage = jest.fn().mockImplementation(() => {
        return new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100),
        );
      });

      await service['pollQueue']();

      expect(mockLogger.log).toHaveBeenCalledWith('Processando 5 mensagens');
      expect(mockProcessorService.handleMessage).toHaveBeenCalledTimes(5);
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(DeleteMessageCommand),
      );
    });
  });
});
