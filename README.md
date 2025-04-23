[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Grupo-26-FIAP_hackaton-file-processor&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Grupo-26-FIAP_hackaton-file-processor)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Grupo-26-FIAP_hackaton-file-processor&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Grupo-26-FIAP_hackaton-file-processor)

# Hackathon File Processor

Sistema de processamento de vídeos baseado em filas usando NestJS, AWS SQS e S3.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md) - Visão geral da arquitetura do sistema
- [Desenvolvimento](docs/DEVELOPMENT.md) - Guia de desenvolvimento
- [Operações](docs/OPERATIONS.md) - Guia de operações e deploy
- [Testes](docs/TESTING.md) - Guia de testes
- [Técnico](docs/TECHNICAL.md) - Documentação técnica
- [API](docs/API.md) - Documentação da API
- [Contribuição](docs/CONTRIBUTING.md) - Guia de contribuição
- [Segurança](docs/SECURITY.md) - Políticas de segurança

## Funcionalidades

1. **Processamento de Vídeos**

   - Upload de vídeos para S3
   - Processamento assíncrono via SQS
   - Extração de frames
   - Compressão de vídeo

2. **Gerenciamento de Jobs**

   - Monitoramento de status
   - Histórico de processamento
   - Cancelamento de jobs
   - Retry automático

3. **Monitoramento**
   - Logs estruturados
   - Métricas de processamento
   - Alertas de erro
   - Dashboard de status

## Tecnologias

- NestJS
- TypeScript
- AWS SQS
- AWS S3
- PostgreSQL
- Docker
- Jest

## Requisitos

- Node.js 18+
- Docker
- Docker Compose
- AWS CLI
- PostgreSQL

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/your-org/hackathon-file-processor.git
cd hackathon-file-processor
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

4. Inicie os serviços:

```bash
docker-compose up -d
```

5. Execute as migrações:

```bash
npm run migration:run
```

6. Inicie a aplicação:

```bash
npm run start:dev
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

## Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e
npm run test:cov

# Linting
npm run lint
npm run format

# Migrações
npm run migration:generate
npm run migration:run
npm run migration:revert
```

### Convenções de Código

- ESLint para linting
- Prettier para formatação
- Conventional Commits
- Testes unitários e E2E

## Deploy

### Staging

```bash
npm run deploy:staging
```

### Produção

```bash
npm run deploy:prod
```

## Contribuindo

Veja [CONTRIBUTING.md](docs/CONTRIBUTING.md) para detalhes sobre nosso código de conduta e processo de submissão de pull requests.

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
