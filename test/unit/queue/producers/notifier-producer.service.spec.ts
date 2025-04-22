import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NotifierProducerService } from 'src/modules/queue/producers/notifier-producer.service';

jest.mock('@aws-sdk/client-sqs', () => {
  const mockSendMessageCommand = jest.fn();
  mockSendMessageCommand.prototype.input = {};
  return {
    SQSClient: jest.fn(),
    SendMessageCommand: mockSendMessageCommand,
  };
});

describe('NotifierProducerService', () => {
  let service: NotifierProducerService;
  let mockSQSClient: jest.Mocked<SQSClient>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockSendMessageCommand: jest.Mock;

  const mockQueueUrl = 'https://sqs.test.com/queue';
  const mockRegion = 'us-east-1';

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'AWS_REGION':
            return mockRegion;
          case 'AWS_SQS_NOTIFICATION_QUEUE_URL':
            return mockQueueUrl;
          default:
            return undefined;
        }
      }),
    } as any;

    mockSQSClient = {
      send: jest.fn().mockImplementation(() => Promise.resolve()),
    } as any;

    mockSendMessageCommand = SendMessageCommand as unknown as jest.Mock;

    (SQSClient as jest.Mock).mockImplementation(() => mockSQSClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifierProducerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotifierProducerService>(NotifierProducerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize SQSClient with correct region', () => {
    expect(SQSClient).toHaveBeenCalledWith({
      region: mockRegion,
    });
  });

  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      const message = 'Test notification';
      const mockResponse: SendMessageCommandOutput = {
        MessageId: 'test-message-id',
        $metadata: {},
      };

      (mockSQSClient.send as jest.Mock).mockResolvedValueOnce(mockResponse);

      await service.sendNotification(message);

      expect(SendMessageCommand).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: message,
      });
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand),
      );
    });

    it('should handle errors when sending notification', async () => {
      const message = 'Test notification';
      const error = new Error('SQS error');

      (mockSQSClient.send as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.sendNotification(message)).rejects.toThrow(error);
    });
  });

  describe('sendErrorNotification', () => {
    it('should send an error notification successfully', async () => {
      const error = new Error('Test error');
      const mockResponse: SendMessageCommandOutput = {
        MessageId: 'test-message-id',
        $metadata: {},
      };

      (mockSQSClient.send as jest.Mock).mockResolvedValueOnce(mockResponse);

      await service.sendErrorNotification(error);

      const commandCall = mockSendMessageCommand.mock.calls[0][0];
      expect(commandCall.QueueUrl).toBe(mockQueueUrl);

      const sentBody = JSON.parse(commandCall.MessageBody);
      expect(sentBody).toEqual({
        type: 'ERROR',
        message: error.message,
        stack: error.stack,
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });

      // Verify timestamp is a valid ISO string
      expect(() => new Date(sentBody.timestamp).toISOString()).not.toThrow();
    });

    it('should handle errors when sending error notification', async () => {
      const error = new Error('Test error');
      const sqsError = new Error('SQS error');

      (mockSQSClient.send as jest.Mock).mockRejectedValueOnce(sqsError);

      await expect(service.sendErrorNotification(error)).rejects.toThrow(
        sqsError,
      );
    });

    it('should handle error without stack trace', async () => {
      const error = new Error('Test error');
      error.stack = undefined;
      const mockResponse: SendMessageCommandOutput = {
        MessageId: 'test-message-id',
        $metadata: {},
      };

      (mockSQSClient.send as jest.Mock).mockResolvedValueOnce(mockResponse);

      await service.sendErrorNotification(error);

      const commandCall = mockSendMessageCommand.mock.calls[0][0];
      expect(commandCall.QueueUrl).toBe(mockQueueUrl);

      const sentBody = JSON.parse(commandCall.MessageBody);
      expect(sentBody).toEqual({
        type: 'ERROR',
        message: error.message,
        stack: undefined,
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });

      // Verify timestamp is a valid ISO string
      expect(() => new Date(sentBody.timestamp).toISOString()).not.toThrow();
    });
  });
});
