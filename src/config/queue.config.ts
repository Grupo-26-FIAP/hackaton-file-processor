import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  inputQueueUrl: process.env.INPUT_QUEUE_URL,
  maxConcurrentProcessing:
    parseInt(process.env.MAX_CONCURRENT_PROCESSING, 10) || 5,
  waitTimeSeconds: parseInt(process.env.QUEUE_WAIT_TIME_SECONDS, 10) || 10,
  visibilityTimeout: parseInt(process.env.QUEUE_VISIBILITY_TIMEOUT, 10) || 300,
  retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY, 10) || 5000,
}));
