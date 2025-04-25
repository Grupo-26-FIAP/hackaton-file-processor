# Hackathon File Processor

Sistema de processamento de vídeos baseado em filas usando NestJS, AWS SQS e S3.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Grupo-26-FIAP_hackaton-file-processor&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Grupo-26-FIAP_hackaton-file-processor) [![License](https://img.shields.io/github/license/Grupo-26-FIAP/hackaton-file-processor)](https://github.com/Grupo-26-FIAP/hackaton-file-processor/blob/main/LICENSE) [![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/) [![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue.svg)](https://www.postgresql.org/) [![AWS](https://img.shields.io/badge/AWS-Services-orange.svg)](https://aws.amazon.com/)

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
│   │   ├── consumers/  # Consumidores de fila
│   │   └── producers/  # Produtores de fila
│   └── video/      # Processamento de vídeos
│       ├── services/   # Serviços de vídeo
│       └── repositories/ # Repositórios
└── main.ts         # Ponto de entrada
```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev
npm run start:debug

# Build
npm run build
npm run build:prod

# Testes
npm run test
npm run test:watch
npm run test:cov
npm run test:debug

# Linting
npm run lint
npm run lint:fix
npm run format

# Migrações
npm run migration:generate
npm run migration:run
npm run migration:revert
npm run migration:show

# Documentação
npm run docs:generate
npm run docs:serve
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
