# Guia de Operações - Hackathon File Processor

## Índice

1. [Infraestrutura](#infraestrutura)
2. [Monitoramento](#monitoramento)
3. [Backup e Recovery](#backup-e-recovery)
4. [Escalabilidade](#escalabilidade)
5. [Segurança](#segurança)
6. [Incidentes](#incidentes)
7. [Manutenção](#manutenção)

## Infraestrutura

### Arquitetura de Produção

```mermaid
graph TB
    subgraph AWS
        S3[S3 Bucket]
        SQS1[Input Queue]
        SQS2[Notifier Queue]
    end

    subgraph Kubernetes
        subgraph Node 1
            Pod1[Pod 1]
            Pod2[Pod 2]
        end
        subgraph Node 2
            Pod3[Pod 3]
            Pod4[Pod 4]
        end
    end

    subgraph MongoDB
        Primary[Primary]
        Secondary1[Secondary 1]
        Secondary2[Secondary 2]
    end

    Client --> S3
    S3 --> SQS1
    SQS1 --> Pod1
    SQS1 --> Pod2
    SQS1 --> Pod3
    SQS1 --> Pod4
    Pod1 --> S3
    Pod2 --> S3
    Pod3 --> S3
    Pod4 --> S3
    Pod1 --> MongoDB
    Pod2 --> MongoDB
    Pod3 --> MongoDB
    Pod4 --> MongoDB
    Pod1 --> SQS2
    Pod2 --> SQS2
    Pod3 --> SQS2
    Pod4 --> SQS2
```

### Recursos

#### Kubernetes

- **Nodes**: 4 (2 por zona de disponibilidade)
- **Pods**: 8 (2 por node)
- **CPU**: 2 cores por pod
- **Memória**: 1GB por pod
- **Storage**: 20GB por pod

#### AWS

- **S3**: Standard IA
- **SQS**: Standard queues
- **Região**: us-east-1

#### MongoDB

- **Cluster**: M50 (3 nodes)
- **Storage**: 100GB por node
- **Backup**: Diário

## Monitoramento

### Métricas Principais

#### 1. Performance

- CPU Usage
- Memory Usage
- Disk I/O
- Network I/O
- Latência de API

#### 2. Negócio

- Vídeos processados/minuto
- Taxa de sucesso/erro
- Tempo médio de processamento
- Tamanho médio dos arquivos

#### 3. Infraestrutura

- Disponibilidade do serviço
- Latência do S3
- Latência do SQS
- Latência do MongoDB

### Dashboards

#### 1. Overview

```yaml
panels:
  - title: 'Service Health'
    metrics:
      - 'up'
      - 'http_requests_total'
      - 'http_request_duration_seconds'

  - title: 'Processing Metrics'
    metrics:
      - 'videos_processed_total'
      - 'processing_time_seconds'
      - 'error_rate'
```

#### 2. Infrastructure

```yaml
panels:
  - title: 'Resource Usage'
    metrics:
      - 'container_cpu_usage_seconds_total'
      - 'container_memory_usage_bytes'
      - 'container_network_receive_bytes_total'
```

### Alertas

#### 1. Críticos

```yaml
alerts:
  - name: 'High Error Rate'
    condition: 'error_rate > 0.1'
    duration: '5m'
    severity: 'critical'

  - name: 'Service Down'
    condition: 'up == 0'
    duration: '1m'
    severity: 'critical'
```

#### 2. Warning

```yaml
alerts:
  - name: 'High CPU Usage'
    condition: 'cpu_usage > 80'
    duration: '10m'
    severity: 'warning'

  - name: 'High Memory Usage'
    condition: 'memory_usage > 85'
    duration: '10m'
    severity: 'warning'
```

## Backup e Recovery

### Backup Strategy

#### 1. MongoDB

```bash
# Backup diário
mongodump --uri="mongodb://user:pass@host:27017/db" --out=/backup/$(date +%Y%m%d)

# Retenção
- Diários: 7 dias
- Semanais: 4 semanas
- Mensais: 12 meses
```

#### 2. S3

```yaml
lifecycle_rules:
  - id: 'backup'
    status: 'Enabled'
    transitions:
      - days: 30
        storage_class: 'STANDARD_IA'
      - days: 90
        storage_class: 'GLACIER'
      - days: 365
        action: 'DELETE'
```

### Recovery Procedures

#### 1. MongoDB Recovery

```bash
# 1. Parar aplicação
kubectl scale deployment hackathon-file-processor --replicas=0

# 2. Restaurar backup
mongorestore --uri="mongodb://user:pass@host:27017/db" /backup/20240422

# 3. Verificar integridade
mongosh --eval "db.adminCommand('listDatabases')"

# 4. Reiniciar aplicação
kubectl scale deployment hackathon-file-processor --replicas=8
```

#### 2. S3 Recovery

```bash
# 1. Listar versões
aws s3api list-object-versions --bucket my-bucket --prefix videos/

# 2. Restaurar versão específica
aws s3api get-object --bucket my-bucket --key videos/file.mp4 --version-id v2
```

## Escalabilidade

### Auto Scaling

#### 1. Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hackathon-file-processor
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hackathon-file-processor
  minReplicas: 4
  maxReplicas: 16
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

#### 2. SQS Queue Scaling

```yaml
scaling_policies:
  - metric: 'ApproximateNumberOfMessagesVisible'
    target_value: 100
    scale_out_cooldown: 300
    scale_in_cooldown: 300
```

### Load Testing

```bash
# 1. Instalar k6
brew install k6

# 2. Executar teste
k6 run load-test.js
```

```javascript
// load-test.js
export default function () {
  const res = http.post('http://localhost:3000/videos', {
    file: open('./test.mp4', 'b'),
  });
  check(res, {
    'status is 201': (r) => r.status === 201,
  });
}
```

## Segurança

### Access Control

#### 1. Kubernetes RBAC

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: hackathon-file-processor
rules:
  - apiGroups: ['']
    resources: ['pods', 'services']
    verbs: ['get', 'list', 'watch']
```

#### 2. AWS IAM

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

### Security Scanning

#### 1. Container Scanning

```bash
# 1. Instalar Trivy
brew install aquasecurity/trivy/trivy

# 2. Escanear imagem
trivy image hackathon-file-processor:latest
```

#### 2. Dependency Scanning

```bash
# 1. Instalar npm audit
npm audit

# 2. Verificar vulnerabilidades
npm audit fix
```

## Incidentes

### Runbooks

#### 1. Service Down

```yaml
steps:
  - name: 'Verificar Status'
    command: 'kubectl get pods'

  - name: 'Verificar Logs'
    command: 'kubectl logs -l app=hackathon-file-processor'

  - name: 'Verificar Recursos'
    command: 'kubectl top pods'

  - name: 'Restart Deployment'
    command: 'kubectl rollout restart deployment/hackathon-file-processor'
```

#### 2. High Error Rate

```yaml
steps:
  - name: 'Verificar Logs de Erro'
    command: 'kubectl logs -l app=hackathon-file-processor | grep ERROR'

  - name: 'Verificar Métricas'
    command: "kubectl exec -it $(kubectl get pod -l app=hackathon-file-processor -o jsonpath='{.items[0].metadata.name}') -- curl localhost:3000/metrics"

  - name: 'Verificar Dependências'
    command: "kubectl exec -it $(kubectl get pod -l app=hackathon-file-processor -o jsonpath='{.items[0].metadata.name}') -- curl localhost:3000/health"
```

### Post-mortem Template

```markdown
# Post-mortem: [Título do Incidente]

## Impacto

- Duração: [X horas]
- Usuários afetados: [N]
- Serviços afetados: [Lista]

## Timeline

1. [HH:MM] - Primeiro alerta
2. [HH:MM] - Investigação iniciada
3. [HH:MM] - Ação tomada
4. [HH:MM] - Serviço restaurado

## Causa Raiz

[Descrição detalhada]

## Ações Corretivas

1. [Ação 1]
2. [Ação 2]
3. [Ação 3]

## Lições Aprendidas

1. [Lição 1]
2. [Lição 2]
3. [Lição 3]
```

## Manutenção

### Rotinas

#### 1. Diárias

```bash
# Verificar saúde do cluster
kubectl get nodes
kubectl get pods

# Verificar logs de erro
kubectl logs -l app=hackathon-file-processor | grep ERROR

# Verificar métricas
curl localhost:3000/metrics
```

#### 2. Semanais

```bash
# Atualizar dependências
npm update

# Rodar testes
npm test

# Verificar segurança
npm audit
```

#### 3. Mensais

```bash
# Backup completo
mongodump --uri="mongodb://user:pass@host:27017/db" --out=/backup/full/$(date +%Y%m)

# Limpeza de recursos
kubectl delete pods --field-selector status.phase=Succeeded
```

### Atualizações

#### 1. Kubernetes

```bash
# 1. Verificar versões disponíveis
kubectl get nodes

# 2. Atualizar um node por vez
kubectl drain node1 --ignore-daemonsets
# Atualizar node
kubectl uncordon node1
```

#### 2. Aplicação

```bash
# 1. Build nova versão
docker build -t hackathon-file-processor:new .

# 2. Testar em staging
kubectl apply -f k8s/staging/

# 3. Deploy em produção
kubectl apply -f k8s/production/
```
