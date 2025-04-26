import { Injectable, Logger, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends Logger {
  private logger: winston.Logger;

  constructor(
    private readonly configService: ConfigService,
    context?: string,
  ) {
    super(context);
    //this.initializeLogger();
  }

  private initializeLogger() {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'video-processor' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(this.sanitizeMessage(message), { context });
    super.log(message, context);
  }

  error(message: string, trace: string, context?: string) {
    this.logger.error(this.sanitizeMessage(message), { trace, context });
    super.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(this.sanitizeMessage(message), { context });
    super.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(this.sanitizeMessage(message), { context });
    super.debug(message, context);
  }

  private sanitizeMessage(message: string): string {
    return message
      .replace(/(password|token|secret|key)=[^&]*/gi, '$1=***')
      .replace(/"password":"[^"]*"/g, '"password":"***"')
      .replace(/"token":"[^"]*"/g, '"token":"***"')
      .replace(/"secret":"[^"]*"/g, '"secret":"***"');
  }
}
