import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifierConsumerService {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger = new Logger(NotifierConsumerService.name),
  ) {
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
    this.queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');
  }

  async startConsuming(): Promise<void> {
    try {
      this.logger.log('Iniciando consumo de mensagens da fila');
      while (true) {
        const messages = await this.receiveMessages();
        for (const message of messages) {
          await this.processMessage(message);
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro ao consumir mensagens da fila: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async receiveMessages(): Promise<any[]> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      });

      const response = await this.sqsClient.send(command);
      return response.Messages || [];
    } catch (error) {
      this.logger.error(
        `Erro ao receber mensagens da fila: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async processMessage(message: any): Promise<void> {
    try {
      this.logger.log(`Processando mensagem: ${message.MessageId}`);
      const body = JSON.parse(message.Body);

      if (body.type === 'ERROR') {
        this.logger.error(
          `Erro recebido via fila: ${body.message}`,
          body.stack,
        );
      } else {
        this.logger.log(`Notificação recebida: ${JSON.stringify(body)}`);
      }

      await this.deleteMessage(message.ReceiptHandle);
      this.logger.log(`Mensagem processada com sucesso: ${message.MessageId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem ${message.MessageId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.sqsClient.send(command);
      this.logger.log('Mensagem deletada com sucesso');
    } catch (error) {
      this.logger.error(
        `Erro ao deletar mensagem: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
