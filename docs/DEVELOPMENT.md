# Guia de Desenvolvimento

## Índice

1. [Configuração do Ambiente](#configuração-do-ambiente)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Padrões de Código](#padrões-de-código)
4. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
5. [Testes](#testes)
6. [Deploy](#deploy)
7. [Debugging](#debugging)
8. [Boas Práticas](#boas-práticas)

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- AWS CLI configurado
- PostgreSQL
- FFmpeg

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/your-org/hackaton-file-processor.git
cd hackaton-file-processor
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

4. Inicie os serviços necessários:

```bash
docker-compose up -d postgres
```

5. Execute as migrações:

```bash
npm run migration:run
```

### Configuração do VS Code

Recomendamos as seguintes extensões:

- ESLint
- Prettier
- Docker
- Kubernetes
- GitLens

Configurações recomendadas para o VS Code:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

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

### Convenções de Nomenclatura

- **Arquivos**: kebab-case (ex: `video-job.service.ts`)
- **Classes**: PascalCase (ex: `VideoJobService`)
- **Métodos/Variáveis**: camelCase (ex: `processVideo`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `MAX_FILE_SIZE`)
- **Interfaces**: PascalCase com prefixo I (ex: `IVideoJob`)
- **Enums**: PascalCase (ex: `JobStatus`)

## Padrões de Código

### Commits

Seguimos o padrão Conventional Commits:

- `feat:` - Nova feature
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

### Código

- Use TypeScript
- Siga o estilo do ESLint
- Documente funções e classes
- Escreva testes unitários
- Mantenha funções pequenas e focadas

## Fluxo de Desenvolvimento

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run start:dev     # Inicia em modo desenvolvimento
npm run start:debug   # Inicia em modo debug
npm run start:prod    # Inicia em modo produção

# Testes
npm run test         # Executa testes unitários
npm run test:e2e     # Executa testes e2e
npm run test:cov     # Executa testes com cobertura

# Linting e Formatação
npm run lint         # Executa linter
npm run format       # Formata código
npm run lint:fix     # Corrige problemas de lint

# Migrações
npm run migration:create  # Cria nova migração
npm run migration:run     # Executa migrações pendentes
npm run migration:revert  # Reverte última migração
```

### Fluxo de Desenvolvimento

1. Crie uma branch para sua feature:

```bash
git checkout -b feature/nome-da-feature
```

2. Faça suas alterações seguindo os padrões de código

3. Execute os testes:

```bash
npm run test
```

4. Faça o commit das alterações:

```bash
git add .
git commit -m "feat: descrição da feature"
```

5. Push para o repositório:

```bash
git push origin feature/nome-da-feature
```

6. Abra um Pull Request

## Testes

### Unitários

```typescript
describe('VideoService', () => {
  let service: VideoService;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(async () => {
    // Setup
  });

  it('should process video successfully', async () => {
    // Test implementation
  });
});
```

### E2E

```typescript
describe('Queue Processing (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Setup
  });

  it('should process message from queue', async () => {
    // Test implementation
  });
});
```

## Debug

### VS Code

Configuração do launch.json:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "sourceMaps": true,
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

### Logs

```typescript
@Injectable()
export class LoggerService {
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

## Deploy

### Staging

```bash
# Build
docker build -t hackaton-file-processor:staging .

# Run
docker run -p 3000:3000 \
  --env-file .env.staging \
  hackaton-file-processor:staging
```

### Produção

```bash
# Build
docker build -t hackaton-file-processor:prod .

# Run
docker run -p 3000:3000 \
  --env-file .env.prod \
  hackaton-file-processor:prod
```

## Monitoramento

### Logs

- Estruturados em JSON
- Níveis: info, warn, error
- Contexto incluído
- Timestamp ISO

### Métricas

- Mensagens processadas
- Tempo de processamento
- Taxa de erro
- Uso de recursos

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

### Suporte

- GitHub Issues
- Documentação
- Email: support@example.com
- Slack: #hackaton-file-processor

## Boas Práticas

### 1. Código Limpo

- Funções pequenas e focadas
- Nomes descritivos
- DRY (Don't Repeat Yourself)
- SOLID principles
- Clean Architecture

### 2. Performance

- Lazy loading
- Caching quando apropriado
- Otimização de queries
- Compressão de dados
- Processamento assíncrono

### 3. Segurança

- Validação de entrada
- Sanitização de dados
- Proteção contra ataques comuns
- Gerenciamento seguro de secrets
- Logs de auditoria

### 4. Monitoramento

- Logs estruturados
- Métricas de performance
- Alertas proativos
- Tracing distribuído
- Health checks

### 5. Documentação

- Código auto-documentado
- Comentários quando necessário
- Documentação de API
- Diagramas de arquitetura
- Guias de troubleshooting
