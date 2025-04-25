import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as child_process from 'child_process';
import * as fs from 'fs';
import { NotifierProducerService } from '../../../../src/modules/queue/producers/notifier-producer.service';
import { ProcessorService } from '../../../../src/modules/video/services/processor.service';
import { VideoService } from '../../../../src/modules/video/services/video.service';
import { S3Service } from '../../../../src/shared/services/s3.service';

type ExecCallback = (
  error: Error | null,
  stdout: { stdout: string; stderr: string },
) => void;

jest.mock('fs', () => ({
  promises: {
    mkdtemp: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    rm: jest.fn(),
  },
  createWriteStream: jest.fn(() => ({
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
  })),
}));

jest.mock('child_process', () => ({
  exec: jest.fn((command: string, callback: ExecCallback) =>
    callback(null, { stdout: '', stderr: '' }),
  ),
}));

jest.mock('archiver', () => {
  const mockArchiver = {
    pipe: jest.fn().mockReturnThis(),
    file: jest.fn().mockReturnThis(),
    finalize: jest.fn().mockResolvedValue(undefined),
  };
  return jest.fn(() => mockArchiver);
});

describe('ProcessorService', () => {
  let service: ProcessorService;
  let notifierProducer: NotifierProducerService;
  let s3Service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'AWS_S3_INPUT_BUCKET':
                  return 'input-bucket';
                case 'AWS_S3_OUTPUT_BUCKET':
                  return 'output-bucket';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: VideoService,
          useValue: {
            processVideo: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NotifierProducerService,
          useValue: {
            sendNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: S3Service,
          useValue: {
            downloadFile: jest.fn().mockResolvedValue(Buffer.from('test')),
            uploadFile: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProcessorService>(ProcessorService);
    notifierProducer = module.get<NotifierProducerService>(
      NotifierProducerService,
    );
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleMessage', () => {
    const mockMessage = {
      userId: 'user123',
      filesUploadedKeys: ['video1.mp4', 'video2.mp4'],
    };

    beforeEach(() => {
      (fs.promises.mkdtemp as jest.Mock).mockResolvedValue('/tmp/test');
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        Buffer.from('test'),
      );
      (fs.promises.rm as jest.Mock).mockResolvedValue(undefined);
      (child_process.exec as unknown as jest.Mock).mockImplementation(
        (cmd: string, callback: ExecCallback) =>
          callback(null, { stdout: 'success', stderr: '' }),
      );
    });

    it('should process multiple videos successfully', async () => {
      await service.handleMessage(mockMessage);

      expect(s3Service.downloadFile).toHaveBeenCalledTimes(2);
      expect(s3Service.downloadFile).toHaveBeenCalledWith(
        'input-bucket',
        'video1.mp4',
      );
      expect(s3Service.downloadFile).toHaveBeenCalledWith(
        'input-bucket',
        'video2.mp4',
      );

      expect(s3Service.uploadFile).toHaveBeenCalledTimes(2);
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        'output-bucket',
        'processed/user123/video1.mp4',
        expect.any(Buffer),
      );
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        'output-bucket',
        'processed/user123/video2.mp4',
        expect.any(Buffer),
      );

      expect(notifierProducer.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('"status":"COMPLETED"'),
      );
    });

    it('should handle errors during video download', async () => {
      const error = new Error('Download failed');
      (s3Service.downloadFile as jest.Mock).mockRejectedValue(error);

      await service.handleMessage(mockMessage);

      expect(notifierProducer.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('"status":"FAILED"'),
      );
      expect(notifierProducer.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('Download failed'),
      );
    });

    it('should handle errors during video upload', async () => {
      const error = new Error('Upload failed');
      (s3Service.uploadFile as jest.Mock).mockRejectedValue(error);

      await service.handleMessage(mockMessage);

      expect(notifierProducer.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('"status":"FAILED"'),
      );
      expect(notifierProducer.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('Upload failed'),
      );
    });

    it('should handle empty filesUploadedKeys array', async () => {
      const emptyMessage = {
        userId: 'user123',
        filesUploadedKeys: [],
      };

      await service.handleMessage(emptyMessage);

      expect(s3Service.downloadFile).not.toHaveBeenCalled();
      expect(s3Service.uploadFile).not.toHaveBeenCalled();
      expect(notifierProducer.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('"status":"FAILED"'),
      );
    });

    it('should clean up temporary files after processing', async () => {
      await service.handleMessage(mockMessage);

      expect(fs.promises.rm).toHaveBeenCalledWith('/tmp/test', {
        recursive: true,
        force: true,
      });
    });

    it('should clean up temporary files even when processing fails', async () => {
      const error = new Error('Processing failed');
      (s3Service.downloadFile as jest.Mock).mockRejectedValue(error);

      await service.handleMessage(mockMessage);

      expect(fs.promises.rm).toHaveBeenCalledWith('/tmp/test', {
        recursive: true,
        force: true,
      });
    });
  });

  describe('processVideoFile', () => {
    it('should process video file and create zip archive', async () => {
      const inputPath = '/tmp/test/input.mp4';
      const outputPath = '/tmp/test/output.zip';

      await (service as any).processVideoFile(inputPath, outputPath);

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('ffmpeg -i /tmp/test/input.mp4'),
        expect.any(Function),
      );
    });

    it('should handle ffmpeg command errors', async () => {
      const inputPath = '/tmp/test/input.mp4';
      const outputPath = '/tmp/test/output.zip';

      const error = new Error('FFMPEG processing failed');
      (child_process.exec as unknown as jest.Mock).mockImplementation(
        (cmd: string, callback: ExecCallback) =>
          callback(error, { stdout: '', stderr: '' }),
      );

      await expect(
        (service as any).processVideoFile(inputPath, outputPath),
      ).rejects.toThrow('FFMPEG processing failed');
    });
  });
});
