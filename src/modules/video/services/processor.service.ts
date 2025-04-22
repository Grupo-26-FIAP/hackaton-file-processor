import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import archiver from 'archiver';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { VideoJobStatus } from '../../../database/enums/video-job-status.enum';
import { NotifierProducerService } from '../../queue/producers/notifier-producer.service';
import { VideoService } from './video.service';

const exec = promisify(execCallback);

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);
  private readonly s3Client: S3Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly videoService: VideoService,
    private readonly notifierProducer: NotifierProducerService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  async handleMessage(message: any): Promise<void> {
    try {
      const videoJob = await this.videoService.findOne(message.id);
      await this.processVideo(videoJob);
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async processVideo(videoJob: any): Promise<void> {
    const tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'video-processor-'),
    );

    try {
      // Download do vídeo do S3
      const videoBuffer = await this.downloadFromS3(
        videoJob.inputBucket,
        videoJob.inputKey,
      );
      const videoPath = path.join(tempDir, 'input.mp4');
      await fs.promises.writeFile(videoPath, videoBuffer);

      // Processamento do vídeo
      const outputPath = path.join(tempDir, 'output.zip');
      await this.processVideoFile(videoPath, outputPath);

      // Upload do resultado para o S3
      const outputBuffer = await fs.promises.readFile(outputPath);
      await this.uploadToS3(
        outputBuffer,
        videoJob.outputBucket,
        videoJob.outputKey,
      );

      // Atualização do status
      await this.videoService.updateStatus(
        videoJob.id,
        VideoJobStatus.COMPLETED,
      );

      // Notificação de sucesso
      await this.notifierProducer.sendNotification(
        JSON.stringify({
          userId: videoJob.userId,
          jobId: videoJob.id,
          status: VideoJobStatus.COMPLETED,
          message: 'Video processing completed successfully',
        }),
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar vídeo: ${error.message}`,
        error.stack,
      );
      await this.videoService.updateStatus(
        videoJob.id,
        VideoJobStatus.FAILED,
        error.message,
      );
      throw error;
    } finally {
      // Limpeza dos arquivos temporários
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }

  private async downloadFromS3(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const chunks: Buffer[] = [];

    for await (const chunk of response.Body as any) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  private async uploadToS3(
    fileBuffer: Buffer,
    bucket: string,
    key: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
    });

    await this.s3Client.send(command);
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
