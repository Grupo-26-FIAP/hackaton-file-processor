import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from '../../../../src/modules/queue/controllers/queue.controller';
import { NotificationResponseDto } from '../../../../src/modules/queue/dto/notification-response.dto';
import { NotificationDto } from '../../../../src/modules/queue/dto/notification.dto';
import { NotifierProducerService } from '../../../../src/modules/queue/producers/notifier-producer.service';

describe('QueueController', () => {
  let controller: QueueController;
  let mockNotifierProducerService: jest.Mocked<NotifierProducerService>;

  beforeEach(async () => {
    mockNotifierProducerService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotifierProducerService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: NotifierProducerService,
          useValue: mockNotifierProducerService,
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const notificationDto = new NotificationDto({
        message: 'Test notification',
      });

      const result = await controller.sendNotification(notificationDto);

      expect(mockNotifierProducerService.sendNotification).toHaveBeenCalledWith(
        notificationDto.message,
      );
      expect(result).toBeInstanceOf(NotificationResponseDto);
      expect(result.message).toBe('Notification sent successfully');
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    it('should handle notification errors', async () => {
      const notificationDto = new NotificationDto({
        message: 'Test notification',
      });

      mockNotifierProducerService.sendNotification.mockRejectedValueOnce(
        new Error('Failed to send notification'),
      );

      await expect(
        controller.sendNotification(notificationDto),
      ).rejects.toThrow('Failed to send notification');
    });

    it('should handle different message types', async () => {
      const messages = [
        'Simple message',
        'Message with special chars: @#$%^&*()_+',
        'Message with newlines\nLine 2\nLine 3',
        'Message with unicode: 你好世界 🌍',
      ];

      for (const message of messages) {
        const notificationDto = new NotificationDto({ message });
        const result = await controller.sendNotification(notificationDto);

        expect(
          mockNotifierProducerService.sendNotification,
        ).toHaveBeenCalledWith(message);
        expect(result.message).toBe('Notification sent successfully');
        expect(result.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        );
      }
    });

    it('should return response with valid timestamp', async () => {
      const notificationDto = new NotificationDto({
        message: 'Test notification',
      });

      const result = await controller.sendNotification(notificationDto);
      const now = new Date();
      const resultDate = new Date(result.timestamp);

      expect(resultDate.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(resultDate.getTime()).toBeGreaterThan(now.getTime() - 1000); // within last second
    });

    it('should trim whitespace from message', async () => {
      const notificationDto = new NotificationDto({
        message: '  Test notification  ',
      });

      await controller.sendNotification(notificationDto);

      expect(mockNotifierProducerService.sendNotification).toHaveBeenCalledWith(
        'Test notification',
      );
    });
  });
});
