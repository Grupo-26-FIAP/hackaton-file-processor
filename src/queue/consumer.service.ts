import
    {
        DeleteMessageCommand,
        ReceiveMessageCommand,
        SQSClient,
    } from '@aws-sdk/client-sqs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessorService } from '../processor/processor.service';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly sqs = new SQSClient({ region: 'us-east-1' });
  private readonly queueUrl =
    'https://sqs.us-east-1.amazonaws.com/123456789012/input-queue'; // 👈 your queue URL

  constructor(
    private processorService: ProcessorService,
    private config: ConfigService,
  ) {
    this.queueUrl = this.config.get('INPUT_QUEUE_URL');
  }

  async onModuleInit() {
    this.pollQueue();
  }

  async pollQueue() {
    while (true) {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10,
      });

      const response = await this.sqs.send(command);
      const messages = response.Messages ?? [];

      for (const msg of messages) {
        try {
          const body = JSON.parse(msg.Body!);
          await this.processorService.handleMessage(body); // 👈 your core logic

          await this.sqs.send(
            new DeleteMessageCommand({
              QueueUrl: this.queueUrl,
              ReceiptHandle: msg.ReceiptHandle!,
            }),
          );
        } catch (err) {
          console.error('Failed to process message:', err);
        }
      }
    }
  }
}
