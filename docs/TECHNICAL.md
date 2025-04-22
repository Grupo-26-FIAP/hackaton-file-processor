# Documentação Técnica

## Stack Tecnológico

### Backend

- NestJS (Node.js)
- TypeScript
- PostgreSQL
- TypeORM
- AWS SDK

### Infraestrutura

- AWS SQS
- AWS S3
- Docker
- Docker Compose

### Ferramentas

- FFmpeg
- Jest
- ESLint
- Prettier

## Estrutura do Projeto

```
src/
├── config/           # Configurações
├── core/            # Serviços core
├── database/        # Entidades e migrações
├── modules/         # Módulos da aplicação
│   ├── queue/      # Processamento de filas
│   └── video/      # Processamento de vídeos
└── main.ts         # Ponto de entrada
```

## Configurações

### Ambiente

```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3
S3_INPUT_BUCKET=your-input-bucket
S3_OUTPUT_BUCKET=your-output-bucket

# SQS
SQS_INPUT_QUEUE_URL=your-input-queue-url
SQS_NOTIFICATION_QUEUE_URL=your-notification-queue-url

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=video_processor

# Application
PORT=3000
NODE_ENV=development
```

### TypeORM

```typescript
{
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [VideoJob],
  synchronize: process.env.NODE_ENV !== 'production',
}
```

## Entidades

### VideoJob

```typescript
@Entity()
export class VideoJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inputBucket: string;

  @Column()
  inputKey: string;

  @Column()
  outputBucket: string;

  @Column()
  outputKey: string;

  @Column()
  status: VideoJobStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Serviços

### ConsumerService

```typescript
@Injectable()
export class ConsumerService {
  constructor(
    private readonly processorService: ProcessorService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async pollQueue(): Promise<void> {
    // Implementação do polling da fila
  }
}
```

### ProcessorService

```typescript
@Injectable()
export class ProcessorService {
  constructor(
    private readonly s3Client: S3Client,
    private readonly videoService: VideoService,
    private readonly notifierProducer: NotifierProducerService,
  ) {}

  async handleMessage(message: any): Promise<void> {
    // Implementação do processamento
  }
}
```

## Filas

### Input Queue

```json
{
  "id": "string",
  "type": "video",
  "inputBucket": "string",
  "inputKey": "string",
  "outputBucket": "string",
  "outputKey": "string",
  "options": {
    "frameRate": "number",
    "quality": "string"
  }
}
```

### Notification Queue

```json
{
  "id": "string",
  "status": "string",
  "message": "string",
  "error": "string?"
}
```

## Processamento de Vídeo

### Download

```typescript
async downloadFromS3(bucket: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await this.s3Client.send(command);
  return response.Body as Buffer;
}
```

### Upload

```typescript
async uploadToS3(
  fileBuffer: Buffer,
  bucket: string,
  key: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
  });

  await this.s3Client.send(command);
}
```

## Testes

### Unitários

```typescript
describe('ConsumerService', () => {
  let service: ConsumerService;
  let mockProcessorService: jest.Mocked<ProcessorService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Setup dos mocks
  });

  it('should process messages from SQS queue successfully', async () => {
    // Implementação do teste
  });
});
```

### E2E

```typescript
describe('Queue Processing (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Setup do teste
  });

  it('should process video successfully', async () => {
    // Implementação do teste
  });
});
```

## Deploy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "run", "start:prod"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=video_processor
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Monitoramento

### Logs

```typescript
@Injectable()
export class LoggerService implements LoggerService {
  log(message: string, context?: string) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        context,
      }),
    );
  }
}
```

### Métricas

```typescript
@Injectable()
export class MetricsService {
  private readonly processedMessages = new Counter({
    name: 'processed_messages_total',
    help: 'Total de mensagens processadas',
  });

  incrementProcessedMessages() {
    this.processedMessages.inc();
  }
}
```

## Troubleshooting

### Problemas Comuns

1. **Fila não processa mensagens**

   - Verificar configurações AWS
   - Checar logs do consumer
   - Validar formato das mensagens

2. **Erros de processamento**

   - Verificar logs do processor
   - Validar formato do vídeo
   - Checar permissões S3

3. **Performance**
   - Ajustar configurações de concorrência
   - Otimizar processamento
   - Monitorar recursos
