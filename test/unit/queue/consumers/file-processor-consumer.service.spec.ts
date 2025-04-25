import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessorConsumerService } from '../../../../src/modules/queue/consumers/file-processor-consumer.service';
import { ProcessorService } from '../../../../src/modules/video/services/processor.service';

jest.mock('@aws-sdk/client-sqs');

describe('FileProcessorConsumerService', () => {
  let service: FileProcessorConsumerService;
  let processorService: ProcessorService;
  let mockSQSClient: jest.Mocked<SQSClient>;
  let module: TestingModule;

  const mockMessage = {
    MessageId: 'test-message-id',
    ReceiptHandle: 'test-receipt-handle',
    Body: JSON.stringify({
      userId: 'test-user',
      filesUploadedKeys: ['test-file-1.mp4', 'test-file-2.mp4'],
    }),
  };

  beforeEach(async () => {
    mockSQSClient = {
      send: jest.fn().mockImplementation(() => Promise.resolve({})),
      destroy: jest.fn(),
      config: {},
      middlewareStack: {
        clone: jest.fn(),
        use: jest.fn(),
        remove: jest.fn(),
        resolve: jest.fn(),
      },
    } as unknown as jest.Mocked<SQSClient>;

    (SQSClient as jest.Mock).mockImplementation(() => mockSQSClient);

    module = await Test.createTestingModule({
      providers: [
        FileProcessorConsumerService,
        {
          provide: ProcessorService,
          useValue: {
            handleMessage: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'AWS_REGION':
                  return 'us-east-1';
                case 'FILES_TO_PROCESS_QUEUE_URL':
                  return 'https://sqs.test.amazonaws.com/test-queue';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FileProcessorConsumerService>(
      FileProcessorConsumerService,
    );
    processorService = module.get<ProcessorService>(ProcessorService);
  });

  afterEach(async () => {
    await service.stopConsumer();
    jest.clearAllMocks();
    await module.close();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should start the consumer', async () => {
      const startConsumerSpy = jest.spyOn(service as any, 'startConsumer');
      await service.onModuleInit();
      expect(startConsumerSpy).toHaveBeenCalled();
      await service.stopConsumer();
    });
  });

  describe('startConsumer', () => {
    it('should process messages from the queue', async () => {
      mockSQSClient.send
        .mockImplementationOnce(() =>
          Promise.resolve({ Messages: [mockMessage] }),
        )
        .mockImplementationOnce(() => Promise.resolve({ Messages: [] }));

      await service.onModuleInit();
      await service.stopConsumer();

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(ReceiveMessageCommand),
      );
      expect(processorService.handleMessage).toHaveBeenCalledWith({
        userId: 'test-user',
        filesUploadedKeys: ['test-file-1.mp4', 'test-file-2.mp4'],
      });
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(DeleteMessageCommand),
      );
    });

    it('should handle empty message response', async () => {
      mockSQSClient.send.mockImplementationOnce(() =>
        Promise.resolve({
          Messages: [],
        }),
      );

      await service.onModuleInit();
      await service.stopConsumer();

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(ReceiveMessageCommand),
      );
      expect(processorService.handleMessage).not.toHaveBeenCalled();
    });

    it('should handle message processing error', async () => {
      const error = new Error('Processing failed');
      mockSQSClient.send
        .mockImplementationOnce(() =>
          Promise.resolve({ Messages: [mockMessage] }),
        )
        .mockImplementationOnce(() => Promise.resolve({ Messages: [] }));

      (processorService.handleMessage as jest.Mock).mockRejectedValueOnce(
        error,
      );

      await service.onModuleInit();
      await service.stopConsumer();

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(ReceiveMessageCommand),
      );
      expect(processorService.handleMessage).toHaveBeenCalled();
      expect(mockSQSClient.send).not.toHaveBeenCalledWith(
        expect.any(DeleteMessageCommand),
      );
    });

    it('should handle SQS client error', async () => {
      const error = new Error('SQS client error');
      mockSQSClient.send.mockRejectedValueOnce(error as never);

      await service.onModuleInit();
      await service.stopConsumer();

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(ReceiveMessageCommand),
      );
      expect(service['isProcessing']).toBe(false);
    });

    it('should handle invalid message body', async () => {
      const invalidMessage = {
        ...mockMessage,
        Body: 'invalid-json',
      };

      mockSQSClient.send
        .mockImplementationOnce(() =>
          Promise.resolve({ Messages: [invalidMessage] }),
        )
        .mockImplementationOnce(() => Promise.resolve({ Messages: [] }));

      await service.onModuleInit();
      await service.stopConsumer();

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(ReceiveMessageCommand),
      );
      expect(processorService.handleMessage).not.toHaveBeenCalled();
    });
  });

  describe('stopConsumer', () => {
    it('should stop the consumer', async () => {
      await service.onModuleInit();
      await service.stopConsumer();
      expect(service['isProcessing']).toBe(false);
    });
  });
});
