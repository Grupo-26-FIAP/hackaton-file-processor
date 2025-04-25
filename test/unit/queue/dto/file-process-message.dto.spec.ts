import { validate } from 'class-validator';
import { FileProcessMessageDto } from '../../../../src/modules/queue/dto/file-process-message.dto';

describe('FileProcessMessageDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new FileProcessMessageDto();
    dto.userId = 'test-user-123';
    dto.filesUploadedKeys = [
      'https://example.com/file1.mp4',
      'https://example.com/file2.mp4',
    ];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('userId validation', () => {
    it('should fail validation with empty userId', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = '';
      dto.filesUploadedKeys = ['https://example.com/file1.mp4'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with undefined userId', async () => {
      const dto = new FileProcessMessageDto();
      dto.filesUploadedKeys = ['https://example.com/file1.mp4'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with non-string userId', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = 123 as any;
      dto.filesUploadedKeys = ['https://example.com/file1.mp4'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('filesUploadedKeys validation', () => {
    it('should fail validation with empty array', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = 'test-user-123';
      dto.filesUploadedKeys = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('should fail validation with undefined filesUploadedKeys', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = 'test-user-123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with non-array filesUploadedKeys', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = 'test-user-123';
      dto.filesUploadedKeys = 'not-an-array' as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail validation with invalid URLs', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = 'test-user-123';
      dto.filesUploadedKeys = ['invalid-url', 'also-invalid', 'not-a-url'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should pass validation with valid URLs', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = 'test-user-123';
      dto.filesUploadedKeys = [
        'https://example.com/file1.mp4',
        'http://test.com/file2.mp4',
        'https://sub.domain.com/path/file3.mp4',
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with mixed valid and invalid URLs', async () => {
      const dto = new FileProcessMessageDto();
      dto.userId = 'test-user-123';
      dto.filesUploadedKeys = [
        'https://example.com/file1.mp4',
        'invalid-url',
        'https://test.com/file2.mp4',
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });
});
