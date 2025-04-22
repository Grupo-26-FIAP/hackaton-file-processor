import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessorService } from 'src/modules/video/services/processor.service';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConsumerService.name);
  private readonly sqs: SQSClient;
  private readonly queueUrl: string;
  private readonly maxConcurrentProcessing: number;
  private readonly waitTimeSeconds: number;
  private readonly visibilityTimeout: number;
  private readonly retryDelay: number;

  constructor(
    private readonly processorService: ProcessorService,
    private readonly configService: ConfigService,
  ) {
    const queueConfig = this.configService.get('queue');
    this.sqs = new SQSClient({ region: queueConfig.region });
    this.queueUrl = queueConfig.inputQueueUrl;
    this.maxConcurrentProcessing = queueConfig.maxConcurrentProcessing;
    this.waitTimeSeconds = queueConfig.waitTimeSeconds;
    this.visibilityTimeout = queueConfig.visibilityTimeout;
    this.retryDelay = queueConfig.retryDelay;
  }

  async onModuleInit() {
    this.logger.log('Iniciando serviço de consumo de fila');
    this.pollQueue();
  }

  async pollQueue() {
    while (true) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: this.maxConcurrentProcessing,
          WaitTimeSeconds: this.waitTimeSeconds,
          VisibilityTimeout: this.visibilityTimeout,
        });

        const response = await this.sqs.send(command);
        const messages = response.Messages ?? [];

        if (messages.length > 0) {
          this.logger.log(`Processando ${messages.length} mensagens`);
          await Promise.all(
            messages.map(async (msg) => {
              try {
                const body = JSON.parse(msg.Body!);
                await this.processorService.handleMessage(body);

                await this.sqs.send(
                  new DeleteMessageCommand({
                    QueueUrl: this.queueUrl,
                    ReceiptHandle: msg.ReceiptHandle!,
                  }),
                );
                this.logger.log(
                  `Mensagem processada com sucesso: ${msg.MessageId}`,
                );
              } catch (err) {
                this.logger.error(
                  `Falha ao processar mensagem ${msg.MessageId}: ${err.message}`,
                  err.stack,
                );
              }
            }),
          );
        }
      } catch (err) {
        this.logger.error(
          `Erro ao consumir mensagens da fila: ${err.message}`,
          err.stack,
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }
}
