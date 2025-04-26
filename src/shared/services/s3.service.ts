import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    try {
      const prefix = 'raw-files/';
      const startIndex = key.indexOf(prefix);
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key.substring(startIndex), // Remove leading slash if present
      });

      this.logger.log(
        `Downloading file from S3: ${bucket}/${key.substring(startIndex)}`,
      );

      const response = await this.s3.send(command);
      const chunks: Uint8Array[] = [];

      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Error downloading file from S3: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(bucket: string, key: string, body: Buffer): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      });

      await this.s3.send(command);
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }
}
