# Documentação da API

## Visão Geral

Este documento descreve a arquitetura e o processamento de mensagens do sistema baseado em filas.

## Arquitetura

### Componentes

- AWS SQS: Fila de mensagens
- AWS S3: Armazenamento de arquivos
- PostgreSQL: Persistência de dados
- NestJS: Processamento

### Fluxo de Mensagens

1. Recebimento via SQS
2. Validação e processamento
3. Armazenamento em S3
4. Atualização no banco

## Formato das Mensagens

### Estrutura

```json
{
  "id": "string",
  "type": "string",
  "data": {
    "fileUrl": "string",
    "metadata": {
      "key": "value"
    }
  },
  "timestamp": "string"
}
```

### Campos

- `id`: Identificador único
- `type`: Tipo de processamento
- `data`: Dados do arquivo
- `timestamp`: Data/hora

## Processamento

### Validação

- Formato JSON
- Campos obrigatórios
- Tipos de dados
- URLs válidas

### Armazenamento

- Bucket S3
- Prefixo por tipo
- Metadata
- Versionamento

### Banco de Dados

- Status do job
- Metadados
- Logs
- Timestamps

## Monitoramento

### Métricas

- Mensagens recebidas
- Processamento OK/ERRO
- Tempo de processamento
- Uso de recursos

### Logs

- Entrada de mensagens
- Processamento
- Erros
- Auditoria

## Troubleshooting

### Erros Comuns

- JSON inválido
- URL inacessível
- Timeout
- Permissões

### Soluções

- Dead Letter Queue
- Retry policy
- Logs detalhados
- Alertas

## Referências

- AWS SQS
- AWS S3
- PostgreSQL
- NestJS
- TypeORM
