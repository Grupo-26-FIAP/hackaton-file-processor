import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifierProducerService {
  constructor(private config: ConfigService) {
    this.queueUrl = this.config.get('NOTIFIER_QUEUE_URL');
  }

  private readonly sqs = new SQSClient({
    region: this.config.get('AWS_REGION'),
    credentials: {
      accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
    },
  });

  private readonly queueUrl =
    'https://sqs.us-east-1.amazonaws.com/123456789012/notifier-queue'; // 👈 Your notifier queue URL

  async sendErrorNotification(data: {
    userId: string;
    inputKey: string;
    error: string;
  }) {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(data),
    });
    await this.sqs.send(command);
  }
}
