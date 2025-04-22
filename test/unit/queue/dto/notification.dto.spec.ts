import { validate } from 'class-validator';
import { NotificationDto } from '../../../../src/modules/queue/dto/notification.dto';

describe('NotificationDto', () => {
  it('should create a valid dto', () => {
    const dto = new NotificationDto({ message: 'Test message' });

    expect(dto).toEqual({
      message: 'Test message',
    });
  });

  describe('validation', () => {
    it('should pass validation with valid message', async () => {
      const dto = new NotificationDto({ message: 'Test message' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty message', async () => {
      const dto = new NotificationDto({ message: '' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with message exceeding max length', async () => {
      const dto = new NotificationDto({ message: 'a'.repeat(1001) });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail validation with non-string message', async () => {
      const dto = new NotificationDto({ message: 123 as any });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with special characters', async () => {
      const dto = new NotificationDto({
        message: 'Test message with special chars: @#$%^&*()_+',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with whitespace-only message', async () => {
      const dto = new NotificationDto({ message: '   ' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with message containing newlines', async () => {
      const dto = new NotificationDto({ message: 'Line 1\nLine 2\nLine 3' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with message containing unicode characters', async () => {
      const dto = new NotificationDto({
        message: 'Test message with unicode: 你好世界 🌍',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
