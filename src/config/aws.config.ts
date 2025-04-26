import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  s3: {
    inputBucket: process.env.S3_INPUT_BUCKET,
    outputBucket: process.env.S3_OUTPUT_BUCKET,
  },
  sqs: {
    inputQueueUrl: process.env.SQS_INPUT_QUEUE_URL,
    notificationQueueUrl: process.env.SQS_NOTIFICATION_QUEUE_URL,
    errorQueueUrl: process.env.SQS_ERROR_QUEUE_URL,
    maxConcurrentProcessing:
      parseInt(process.env.MAX_CONCURRENT_PROCESSING, 10) || 5,
  },
}));
