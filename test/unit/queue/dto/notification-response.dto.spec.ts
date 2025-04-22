import { NotificationResponseDto } from '../../../../src/modules/queue/dto/notification-response.dto';

describe('NotificationResponseDto', () => {
  it('should create a valid response dto', () => {
    const timestamp = new Date().toISOString();
    const dto = new NotificationResponseDto({
      message: 'Test message',
      timestamp,
    });

    expect(dto).toEqual({
      message: 'Test message',
      timestamp: expect.any(String),
    });
  });

  it('should create a response dto with current timestamp', () => {
    const timestamp = new Date().toISOString();
    const dto = new NotificationResponseDto({
      message: 'Test message',
      timestamp,
    });
    const now = new Date().toISOString();

    expect(new Date(dto.timestamp).getTime()).toBeLessThanOrEqual(
      new Date(now).getTime(),
    );
  });

  it('should validate timestamp format', () => {
    const timestamp = new Date().toISOString();
    const dto = new NotificationResponseDto({
      message: 'Test message',
      timestamp,
    });

    expect(() => new Date(dto.timestamp)).not.toThrow();
    expect(new Date(dto.timestamp).toISOString()).toBe(dto.timestamp);
  });

  it('should handle different message formats', () => {
    const messages = [
      'Simple message',
      'Message with special chars: @#$%^&*()_+',
      'Message with newlines\nLine 2\nLine 3',
      'Message with unicode: 你好世界 🌍',
    ];

    messages.forEach((message) => {
      const timestamp = new Date().toISOString();
      const dto = new NotificationResponseDto({
        message,
        timestamp,
      });

      expect(dto.message).toBe(message);
      expect(dto.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  it('should maintain message and timestamp consistency', () => {
    const message = 'Test message';
    const timestamp = new Date().toISOString();

    const dto = new NotificationResponseDto({
      message,
      timestamp,
    });

    const newDto = new NotificationResponseDto({
      message: dto.message,
      timestamp: dto.timestamp,
    });

    expect(newDto).toEqual(dto);
  });
});
