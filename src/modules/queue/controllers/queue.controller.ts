import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../../core/interceptors/response.interceptor';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationDto } from '../dto/notification.dto';
import { NotifierProducerService } from '../producers/notifier-producer.service';

@ApiTags('Notifications')
@Controller({ path: 'queue', version: '1' })
@UseInterceptors(ResponseInterceptor)
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(
    private readonly notifierProducerService: NotifierProducerService,
  ) {}

  @Post('notify')
  @ApiOperation({
    summary: 'Send a notification to the queue',
    description: 'Sends a notification message to AWS SQS queue for processing',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification sent successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid notification data',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to send notification to queue',
  })
  async sendNotification(
    @Body() notification: NotificationDto,
  ): Promise<NotificationResponseDto> {
    try {
      this.logger.log(`Sending notification: ${JSON.stringify(notification)}`);
      await this.notifierProducerService.sendNotification(notification.message);
      return new NotificationResponseDto({
        message: 'Notification sent successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Error sending notification: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to send notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
