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
  });

  describe('pollQueue', () => {
    const mockPollQueueImplementation = async () => {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: mockQueueConfig.inputQueueUrl,
          MaxNumberOfMessages: mockQueueConfig.maxConcurrentProcessing,
          WaitTimeSeconds: mockQueueConfig.waitTimeSeconds,
          VisibilityTimeout: mockQueueConfig.visibilityTimeout,
        });

        const response = await mockSQSClient.send(command);
        const messages = response.Messages ?? [];

        if (messages.length > 0) {
          mockLogger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map(async (msg) => {
              try {
                const body = JSON.parse(msg.Body!);
                await mockProcessorService.handleMessage(body);

                await mockSQSClient.send(
                  new DeleteMessageCommand({
                    QueueUrl: mockQueueConfig.inputQueueUrl,
                    ReceiptHandle: msg.ReceiptHandle!,
                  }),
                );
                mockLogger.log(
                  `Mensagem processada com sucesso: ${msg.MessageId}`,
                );
              } catch (err) {
                mockLogger.error(
                  `Falha ao processar mensagem ${msg.MessageId}: ${err.message}`,
                  err.stack,
                );
              }
            }),
          );
        }
      } catch (err) {
        mockLogger.error(
          `Erro ao consumir mensagens da fila: ${err.message}`,
          err.stack,
        );
      }
    };

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
      jest
        .spyOn(service as any, 'pollQueue')
        .mockImplementation(mockPollQueueImplementation);
      await service.pollQueue();

      expect(mockProcessorService.handleMessage).toHaveBeenCalledWith({
        id: '123',
        type: 'video',
      });
      expect(mockSQSClient.send).toHaveBeenCalledTimes(2); // Once for receive, once for delete
      expect(mockLogger.log).toHaveBeenCalled();
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
      jest
        .spyOn(service as any, 'pollQueue')
        .mockImplementation(mockPollQueueImplementation);
      await service.pollQueue();

      expect(mockProcessorService.handleMessage).not.toHaveBeenCalled();
      expect(mockSQSClient.send).toHaveBeenCalledTimes(1); // Only for receive
    });

    it('should handle errors when polling queue and retry after delay', async () => {
      const mockError = new Error('SQS error');
      mockSQSClient.send = jest.fn().mockRejectedValue(mockError);

      // Mock the pollQueue method to avoid infinite loop
      jest
        .spyOn(service as any, 'pollQueue')
        .mockImplementation(mockPollQueueImplementation);
      await service.pollQueue();

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
      jest
        .spyOn(service as any, 'pollQueue')
        .mockImplementation(mockPollQueueImplementation);
      await service.pollQueue();

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
      jest
        .spyOn(service as any, 'pollQueue')
        .mockImplementation(mockPollQueueImplementation);
      await service.pollQueue();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Falha ao processar mensagem 1: Processing failed',
        processingError.stack,
      );
      expect(mockSQSClient.send).toHaveBeenCalledTimes(1); // Only for receive, not for delete
    });
  });
});
