import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import archiver from 'archiver';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { S3Service } from '../../../shared/services/s3.service';
import { FileProcessMessageDto } from '../../queue/dto/file-process-message.dto';
import { NotifierProducerService } from '../../queue/producers/notifier-producer.service';
import { VideoService } from './video.service';

const exec = promisify(execCallback);

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);
  private readonly inputBucket: string;
  private readonly outputBucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly videoService: VideoService,
    private readonly notifierProducer: NotifierProducerService,
    private readonly s3Service: S3Service,
  ) {
    this.inputBucket = this.configService.get<string>('AWS_S3_INPUT_BUCKET');
    this.outputBucket = this.configService.get<string>('AWS_S3_OUTPUT_BUCKET');
  }

  async handleMessage(message: FileProcessMessageDto): Promise<void> {
    const { userId, filesUploadedKeys } = message;

    this.logger.log(
      `Processando ${filesUploadedKeys.length} arquivos para o usuário ${userId}`,
    );

    if (!filesUploadedKeys.length) {
      await this.notifierProducer.sendNotification(
        JSON.stringify({
          userId,
          status: 'FAILED',
          error: 'Lista de arquivos vazia',
        }),
      );
      return;
    }

    for (const fileKey of filesUploadedKeys) {
      const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'video-processor-'),
      );

      try {
        // Download do vídeo do S3
        const videoBuffer = await this.s3Service.downloadFile(
          this.inputBucket,
          fileKey,
        );
        const videoPath = path.join(tempDir, 'input.mp4');
        await fs.promises.writeFile(videoPath, videoBuffer);

        // Processamento do vídeo
        const outputPath = path.join(tempDir, 'output.zip');
        await this.processVideoFile(videoPath, outputPath);

        // Upload do resultado para o S3
        const outputBuffer = await fs.promises.readFile(outputPath);
        const outputKey = `processed/${userId}/${path.basename(fileKey)}`;
        await this.s3Service.uploadFile(
          this.outputBucket,
          outputKey,
          outputBuffer,
        );

        // Notificação de sucesso
        await this.notifierProducer.sendNotification(
          JSON.stringify({
            userId,
            fileKey,
            outputKey,
            status: 'COMPLETED',
            message: 'Video processing completed successfully',
          }),
        );

        this.logger.log(
          `Vídeo ${fileKey} processado com sucesso para o usuário ${userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao processar vídeo ${fileKey}: ${error.message}`,
          error.stack,
        );

        // Notificação de erro
        await this.notifierProducer.sendNotification(
          JSON.stringify({
            userId,
            fileKey,
            status: 'FAILED',
            error: error.message,
          }),
        );
      } finally {
        // Limpeza dos arquivos temporários
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      }
    }
  }

  private async processVideoFile(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.pipe(output);

    // Adiciona o vídeo ao arquivo ZIP
    archive.file(inputPath, { name: 'video.mp4' });

    // Executa o comando ffmpeg para processar o vídeo
    const ffmpegCommand = `ffmpeg -i ${inputPath} -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k ${path.join(
      path.dirname(inputPath),
      'processed.mp4',
    )}`;

    await exec(ffmpegCommand);

    // Adiciona o vídeo processado ao arquivo ZIP
    archive.file(path.join(path.dirname(inputPath), 'processed.mp4'), {
      name: 'processed.mp4',
    });

    await archive.finalize();
  }
}
