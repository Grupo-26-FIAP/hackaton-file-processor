import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import archiver from 'archiver';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { VideoJobStatus } from 'src/database/enums/video-job-status.enum';
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

      if(fileKey.includes('erro')) {
        this.logger.error(`Arquivo ${fileKey} não é um vídeo válido`);
        await this.notifierProducer.sendNotification(
          JSON.stringify({
            userId,
            fileKey,
            status: 'FAILED',
            error: 'Arquivo não é um vídeo válido',
          }),
        );
        continue;
      }


      const videoJob = await this.videoService.create({
        userId,
        inputBucket: this.inputBucket,
        inputKey: fileKey,
      });
      this.logger.log(`Criando job de vídeo: ${videoJob.id}`);

      const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'video-processor-'),
      );

      try {
        this.logger.log(`iniciando download s3`);

        const videoBuffer = await this.s3Service.downloadFile(
          this.inputBucket,
          fileKey,
        );

        this.logger.log(`download s3 finalizado`);

        const videoPath = path.join(tempDir, 'input.mp4');
        await fs.promises.writeFile(videoPath, videoBuffer);

        const outputPath = path.join(tempDir, `${new Date().getTime()}-output.zip`);
        await this.processVideoFile(videoPath, outputPath);

        this.logger.log(`video processado: ${outputPath}`);

        this.logger.log(`iniciando upload s3`);

        const outputBuffer = await fs.promises.readFile(outputPath);
        const outputKey = `processed/${userId}/${path.basename(outputPath)}`;

        this.logger.log(outputKey);

        await this.s3Service.uploadFile(
          this.outputBucket,
          outputKey,
          outputBuffer,
        );

        this.logger.log(`upload finalizado`);


        this.videoService.updateVideoJob(videoJob.id, {
          status: VideoJobStatus.COMPLETED,  
          outputKey,
        });

        this.logger.log(
          `Vídeo ${fileKey} processado com sucesso para o usuário ${userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao processar vídeo ${fileKey}: ${error.message}`,
          error.stack,
        );

        await this.notifierProducer.sendNotification(
          JSON.stringify({
            userId,
            fileKey,
            status: 'FAILED',
            error: error.message,
          }),
        );
      } finally {
        fs.promises.rm(tempDir, { recursive: true, force: true });
      }
    }
  }

  private async processVideoFile(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    const outputDir = path.dirname(outputPath);
    const imagePattern = path.join(outputDir, 'frame-%03d.png');

    // Comando FFmpeg para extrair imagens do vídeo
    const ffmpegCommand = `ffmpeg -i ${inputPath} -vf fps=1 ${imagePattern}`;

    this.logger.log(`Executando FFmpeg para extrair imagens: ${ffmpegCommand}`);

    try {
      // Executa o comando FFmpeg
      await exec(ffmpegCommand);

      this.logger.log(
        `Imagens extraídas com sucesso para o diretório: ${outputDir}`,
      );

      // Verifica se as imagens foram geradas
      const files = await fs.promises.readdir(outputDir);
      if (files.length === 0) {
        throw new Error('Nenhuma imagem foi gerada pelo FFmpeg.');
      }

      this.logger.log(`Arquivos gerados: ${files}`);

      // Compacta as imagens extraídas em um arquivo ZIP
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Nível de compressão
      });

      return new Promise<void>((resolve, reject) => {
        output.on('close', () => {
          this.logger.log(`Arquivo ZIP criado com sucesso: ${outputPath}`);
          resolve();
        });

        output.on('error', (err) => {
          this.logger.error(`Erro ao criar arquivo ZIP: ${err.message}`);
          reject(err);
        });

        archive.on('error', (err) => {
          this.logger.error(`Erro no processo de compactação: ${err.message}`);
          reject(err);
        });

        archive.on('progress', (progress) => {
          this.logger.log(
            `Progresso da compactação: ${progress.entries.processed} arquivos processados.`,
          );
        });

        archive.pipe(output);

        // Adiciona todas as imagens extraídas ao arquivo ZIP
        files.forEach((file) => {
          const filePath = path.join(outputDir, file);
          if (!file.endsWith('.mp4')) {
            archive.file(filePath, { name: file });
          }
        });

        // Finaliza o processo de compactação
         archive.finalize();
      });


    } catch (error) {
      this.logger.error(
        `Erro ao processar vídeo e extrair imagens: ${error.message}`,
      );
      throw new Error('Erro ao extrair imagens do vídeo.');
    }
  }
}
