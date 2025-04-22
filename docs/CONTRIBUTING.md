# Guia de Contribuição

## Visão Geral

Este documento descreve como contribuir para o projeto de processamento de arquivos baseado em filas.

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- AWS CLI configurado
- PostgreSQL 14+

## Configuração Inicial

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/hackaton-file-processor.git
cd hackaton-file-processor
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Inicie os serviços locais:

```bash
docker-compose up -d
```

## Estrutura do Projeto

```
src/
├── config/           # Configurações
├── core/            # Serviços core
├── database/        # Entidades e migrations
├── queue/           # Consumidores e produtores
└── video/           # Processamento de vídeo
```

## Desenvolvimento

### Branch Strategy

- `main`: Branch principal
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs
- `refactor/*`: Refatorações

### Commits

Seguimos o padrão Conventional Commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Tipos:

- feat: Nova funcionalidade
- fix: Correção de bug
- docs: Documentação
- style: Formatação
- refactor: Refatoração
- test: Testes
- chore: Manutenção

### Code Style

- ESLint para linting
- Prettier para formatação
- TypeScript strict mode
- Jest para testes

## Testes

### Unit Tests

```bash
# Todos os testes
npm test

# Teste específico
npm test path/to/test.spec.ts

# Cobertura
npm run test:cov
```

### Integration Tests

```bash
# Testes de integração
npm run test:integration

# Teste específico
npm run test:integration path/to/test.spec.ts
```

### E2E Tests

```bash
# Testes E2E
npm run test:e2e

# Teste específico
npm run test:e2e path/to/test.spec.ts
```

## Filas e Mensagens

### Estrutura da Mensagem

```typescript
interface Message {
  jobId: string;
  fileUrl: string;
  options: {
    format: string;
    quality: number;
    resolution: string;
  };
}
```

### Testando Localmente

1. Configure AWS LocalStack:

```bash
docker-compose up localstack
```

2. Crie filas de teste:

```bash
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name test-queue
```

3. Envie mensagem de teste:

```bash
aws --endpoint-url=http://localhost:4566 sqs send-message --queue-url http://localhost:4566/000000000000/test-queue --message-body '{"jobId":"123","fileUrl":"s3://test-bucket/test.mp4","options":{"format":"mp4","quality":80,"resolution":"720p"}}'
```

## Database

### Migrations

```bash
# Criar migration
npm run migration:create src/database/migrations/NomeMigration

# Executar migrations
npm run migration:run

# Reverter última migration
npm run migration:revert
```

### Seeds

```bash
# Executar seeds
npm run seed:run
```

## Pull Requests

1. Crie uma branch a partir de `main`
2. Faça suas alterações
3. Execute testes e linting
4. Atualize documentação
5. Crie PR com descrição clara
6. Aguarde review

## Deploy

### Ambiente de Desenvolvimento

```bash
npm run build
npm run start:dev
```

### Ambiente de Produção

```bash
npm run build
npm run start:prod
```

## Troubleshooting

### Problemas Comuns

1. Erro de conexão com AWS

   - Verificar credenciais
   - Checar região
   - Validar permissões

2. Erro de banco de dados

   - Verificar conexão
   - Checar migrations
   - Validar schema

3. Erro de processamento
   - Verificar logs
   - Checar recursos
   - Validar configurações

## Ajuda

- Abra uma issue
- Consulte a documentação
- Entre em contato com a equipe
