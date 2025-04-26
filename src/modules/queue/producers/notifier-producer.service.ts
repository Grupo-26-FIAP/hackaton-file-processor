import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifierProducerService {
  private readonly logger = new Logger(NotifierProducerService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });
    this.queueUrl = this.configService.get<string>(
      'AWS_SQS_NOTIFICATION_QUEUE_URL',
    );
  }

  async sendNotification(message: string): Promise<void> {
    try {
      this.logger.log(`Sending notification to queue: ${message}`);
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: message,
      });
      await this.sqsClient.send(command);
      this.logger.log('Notification sent successfully');
    } catch (error) {
      this.logger.error(
        `Error sending notification to queue: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendErrorNotification(error: Error): Promise<void> {
    try {
      this.logger.log(`Sending error notification to queue: ${error.message}`);
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify({
          type: 'ERROR',
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        }),
      });
      await this.sqsClient.send(command);
      this.logger.log('Error notification sent successfully');
    } catch (err) {
      this.logger.error(
        `Error sending error notification to queue: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}
