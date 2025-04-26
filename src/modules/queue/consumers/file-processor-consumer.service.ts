import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessorService } from '../../video/services/processor.service';
import { FileProcessMessageDto } from '../dto/file-process-message.dto';

@Injectable()
export class FileProcessorConsumerService implements OnModuleInit {
  private readonly logger = new Logger(FileProcessorConsumerService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private isProcessing: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly processorService: ProcessorService,
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
    this.queueUrl = this.configService.get<string>(
      'FILES_TO_PROCESS_QUEUE_URL',
    );
  }

  async onModuleInit() {
    this.startConsumer();
  }

  private async startConsumer() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.logger.log('Iniciando consumo da fila FIFO...');

    while (this.isProcessing) {
      try {
        const receiveParams = {
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 1, // Processa uma mensagem por vez para manter a ordem FIFO
          WaitTimeSeconds: 20,
        };

        const response = await this.sqsClient.send(
          new ReceiveMessageCommand(receiveParams),
        );

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            try {
              const messageBody = JSON.parse(message.Body);
              const fileProcessMessage = new FileProcessMessageDto();
              Object.assign(fileProcessMessage, messageBody);

              this.logger.log(
                `Processando mensagem para o usuário ${fileProcessMessage.userId}`,
              );

              await this.processorService.handleMessage(fileProcessMessage);

              // Deleta a mensagem da fila após processamento
              await this.sqsClient.send(
                new DeleteMessageCommand({
                  QueueUrl: this.queueUrl,
                  ReceiptHandle: message.ReceiptHandle,
                }),
              );

              this.logger.log(
                `Mensagem processada com sucesso para o usuário ${fileProcessMessage.userId}`,
              );
            } catch (error) {
              this.logger.error(
                `Erro ao processar mensagem: ${error.message}`,
                error.stack,
              );
              // Em caso de erro, a mensagem volta para a fila após o tempo de visibilidade
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Erro ao consumir mensagens da fila: ${error.message}`,
          error.stack,
        );
        // Pequena pausa antes de tentar novamente em caso de erro
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  async stopConsumer() {
    this.isProcessing = false;
    this.logger.log('Parando consumo da fila...');
  }
}
