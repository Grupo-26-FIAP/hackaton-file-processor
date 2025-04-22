import { Message } from '@aws-sdk/client-sqs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NotifierConsumerService } from '../../../../src/modules/queue/consumers/notifier-consumer.service';

interface NotificationMessage {
  type: 'INFO' | 'ERROR';
  message: string;
  timestamp: string;
  stack?: string;
}

describe('NotifierConsumerService', () => {
  let service: NotifierConsumerService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockSQSClient: { send: jest.Mock };
  let mockLogger: jest.Mocked<Logger>;

  const mockQueueConfig = {
    region: 'us-east-1',
    queueUrl: 'https://sqs.test.com/notification-queue',
    maxConcurrentProcessing: 5,
    waitTimeSeconds: 10,
    visibilityTimeout: 300,
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'AWS_REGION':
            return mockQueueConfig.region;
          case 'AWS_SQS_QUEUE_URL':
            return mockQueueConfig.queueUrl;
          case 'AWS_SQS_MAX_CONCURRENT_PROCESSING':
            return mockQueueConfig.maxConcurrentProcessing;
          case 'AWS_SQS_WAIT_TIME_SECONDS':
            return mockQueueConfig.waitTimeSeconds;
          case 'AWS_SQS_VISIBILITY_TIMEOUT':
            return mockQueueConfig.visibilityTimeout;
          default:
            return undefined;
        }
      }),
    } as unknown as jest.Mocked<ConfigService>;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockSQSClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifierConsumerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<NotifierConsumerService>(NotifierConsumerService);
    // Substituir o SQSClient interno do serviço pelo mock
    (service as any).sqsClient = mockSQSClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startConsuming', () => {
    it('should log that it started consuming messages', async () => {
      // Mock the receiveMessages method to throw an error immediately
      // This will cause the startConsuming method to exit the loop
      jest
        .spyOn(service as any, 'receiveMessages')
        .mockRejectedValueOnce(new Error('Test error to exit loop'));

      // Start consuming and wait for it to complete
      await expect(service.startConsuming()).rejects.toThrow(
        'Test error to exit loop',
      );

      // Verify that the service logged that it started consuming
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Iniciando consumo de mensagens da fila',
      );
    });
  });

  describe('receiveMessages', () => {
    it('should receive messages successfully', async () => {
      const mockMessage: NotificationMessage = {
        type: 'INFO',
        message: 'Test notification',
        timestamp: new Date().toISOString(),
      };

      const mockMessages: Message[] = [
        {
          MessageId: '1',
          Body: JSON.stringify(mockMessage),
          ReceiptHandle: 'receipt-1',
        },
      ];

      mockSQSClient.send.mockResolvedValueOnce({
        Messages: mockMessages,
        $metadata: {},
      });

      const result = await (service as any).receiveMessages();

      expect(result).toEqual(mockMessages);
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            QueueUrl: mockQueueConfig.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
          },
        }),
      );
    });

    it('should handle empty message response', async () => {
      mockSQSClient.send.mockResolvedValueOnce({
        Messages: [],
        $metadata: {},
      });

      const result = await (service as any).receiveMessages();

      expect(result).toEqual([]);
    });

    it('should handle queue polling errors', async () => {
      const queueError = new Error('Queue error');
      mockSQSClient.send.mockRejectedValueOnce(queueError);

      const result = await (service as any).receiveMessages();

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao receber mensagens da fila: Queue error',
        queueError.stack,
      );
    });
  });

  describe('processMessage', () => {
    it('should process info message successfully', async () => {
      const mockMessage: NotificationMessage = {
        type: 'INFO',
        message: 'Test notification',
        timestamp: new Date().toISOString(),
      };

      const sqsMessage: Message = {
        MessageId: '1',
        Body: JSON.stringify(mockMessage),
        ReceiptHandle: 'receipt-1',
      };

      mockSQSClient.send.mockResolvedValueOnce({
        $metadata: {},
      });

      await (service as any).processMessage(sqsMessage);

      expect(mockLogger.log).toHaveBeenCalledWith('Processando mensagem: 1');
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Notificação recebida: ${JSON.stringify(mockMessage)}`,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Mensagem processada com sucesso: 1',
      );
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            QueueUrl: mockQueueConfig.queueUrl,
            ReceiptHandle: sqsMessage.ReceiptHandle,
          },
        }),
      );
    });

    it('should process error message successfully', async () => {
      const mockMessage: NotificationMessage = {
        type: 'ERROR',
        message: 'Test error',
        stack: 'Error stack trace',
        timestamp: new Date().toISOString(),
      };

      const sqsMessage: Message = {
        MessageId: '1',
        Body: JSON.stringify(mockMessage),
        ReceiptHandle: 'receipt-1',
      };

      mockSQSClient.send.mockResolvedValueOnce({
        $metadata: {},
      });

      await (service as any).processMessage(sqsMessage);

      expect(mockLogger.log).toHaveBeenCalledWith('Processando mensagem: 1');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro recebido via fila: Test error',
        'Error stack trace',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Mensagem processada com sucesso: 1',
      );
    });

    it('should handle invalid message format', async () => {
      const sqsMessage: Message = {
        MessageId: '1',
        Body: 'invalid json',
        ReceiptHandle: 'receipt-1',
      };

      await (service as any).processMessage(sqsMessage);

      expect(mockLogger.log).toHaveBeenCalledWith('Processando mensagem: 1');
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Erro ao processar mensagem 1: Unexpected token 'i', "invalid json" is not valid JSON`,
        expect.any(String),
      );
    });

    it('should handle delete message errors', async () => {
      const mockMessage: NotificationMessage = {
        type: 'INFO',
        message: 'Test notification',
        timestamp: new Date().toISOString(),
      };

      const sqsMessage: Message = {
        MessageId: '1',
        Body: JSON.stringify(mockMessage),
        ReceiptHandle: 'receipt-1',
      };

      const deleteError = new Error('Delete failed');
      mockSQSClient.send.mockRejectedValueOnce(deleteError);

      await (service as any).processMessage(sqsMessage);

      expect(mockLogger.log).toHaveBeenCalledWith('Processando mensagem: 1');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao deletar mensagem: Delete failed',
        deleteError.stack,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao processar mensagem 1: Delete failed',
        deleteError.stack,
      );
    });
  });
});
