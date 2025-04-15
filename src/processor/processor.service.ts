// src/processor/processor.service.ts

import
  {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
  } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import * as archiver from 'archiver';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { VideoJobService } from '../db/video-job.service';
import { NotifierProducerService } from '../queue/notifier-producer.service';

@Injectable()
export class ProcessorService {
  private readonly s3 = new S3Client({ region: 'us-east-1' });

  constructor(
    private readonly videoJobService: VideoJobService,
    private readonly notifierProducer: NotifierProducerService,
  ) {}

  async handleMessage(data: { userId: string; bucket: string; key: string }) {
    const { userId, bucket, key } = data;
    const tmpDir = `/tmp/${Date.now()}`;
    const videoPath = path.join(tmpDir, 'video.mp4');
    const framesDir = path.join(tmpDir, 'frames');
    const zipPath = path.join(tmpDir, 'frames.zip');
    fs.mkdirSync(framesDir, { recursive: true });

    // Step 1: Save initial job status
    const job = await this.videoJobService.create({
      userId,
      inputKey: key,
      status: 'processing',
    });

    try {
      // Step 2: Download
      await this.downloadFromS3(bucket, key, videoPath);

      // Step 3: Extract frames
      await this.extractFrames(videoPath, framesDir);

      // Step 4: Zip images
      await this.zipDirectory(framesDir, zipPath);

      // Step 5: Upload result
      const newKey = key.replace('.mp4', '.zip');
      await this.uploadToS3(bucket, newKey, zipPath);

      // Step 6: Update job to done
      await this.videoJobService.updateStatus(job.userId, 'done');
    } catch (err) {
      console.error('Processing failed:', err);

      await this.videoJobService.updateStatus(job.userId, 'error', err.message);

      await this.notifierProducer.sendErrorNotification({
        userId,
        inputKey: key,
        error: err.message,
      });
    }
  }

  private async downloadFromS3(bucket: string, key: string, destPath: string) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await this.s3.send(command);
    await pipeline(
      response.Body as NodeJS.ReadableStream,
      fs.createWriteStream(destPath),
    );
  }

  private async uploadToS3(bucket: string, key: string, filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
      }),
    );
  }

  private async extractFrames(
    videoPath: string,
    outputDir: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', resolve)
        .on('error', reject)
        .save(`${outputDir}/frame-%03d.png`);
    });
  }

  private async zipDirectory(
    sourceDir: string,
    outPath: string,
  ): Promise<void> {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }
}
