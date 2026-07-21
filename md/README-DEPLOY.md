# 🚀 Deploy - Sistema de Gestão Escolar

Guia rápido para fazer deploy da aplicação em produção usando Docker.

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Servidor Linux (Ubuntu/Debian recomendado)

## ⚡ Deploy Rápido

### 1️⃣ Clone o repositório

```bash
git clone <seu-repositorio>
cd grafos
```

### 2️⃣ Configure as variáveis de ambiente

```bash
cp .env.prod .env
nano .env  # Edite e altere TODAS as senhas e secrets
```

**⚠️ IMPORTANTE:** Altere especialmente estas variáveis:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### 3️⃣ Execute o script de deploy

```bash
./deploy.sh
```

O script irá:
1. ✅ Verificar dependências
2. ✅ Configurar ambiente
3. ✅ Fazer backup (se existir banco anterior)
4. ✅ Parar containers antigos
5. ✅ Construir imagens
6. ✅ Iniciar PostgreSQL e Redis
7. ✅ Executar migrations e seeds
8. ✅ Iniciar API e Frontend
9. ✅ Verificar saúde dos serviços

### 4️⃣ Acesse a aplicação

- **Frontend**: http://seu-servidor:3001
- **API**: http://seu-servidor:3333
- **API Docs**: http://seu-servidor:3333/api

## 🎯 Variáveis de Ambiente Principais

### Banco de Dados
```env
POSTGRES_DB=grafos_production
POSTGRES_USER=grafos_user
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
```

### Segurança
```env
JWT_SECRET=SECRET_SUPER_LONGO_E_COMPLEXO
JWT_REFRESH_SECRET=OUTRO_SECRET_DIFERENTE
REDIS_PASSWORD=SENHA_REDIS_FORTE
```

### Portas
```env
API_PORT=3333
FRONTEND_PORT=3001
POSTGRES_PORT=5432
REDIS_PORT=6379
```

### Seeds
```env
RUN_SEED=true  # false para não executar seed
```

## 📦 Estrutura dos Serviços

```
┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│     API     │
│  (Next.js)  │     │  (NestJS)   │
│   :3001     │     │    :3333    │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼────┐  ┌────▼─────┐
              │PostgreSQL│  │  Redis   │
              │   :5432  │  │  :6379   │
              └──────────┘  └──────────┘
```

## 🛠️ Comandos Úteis

### Ver logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Status dos serviços
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Parar serviços
```bash
docker-compose -f docker-compose.prod.yml down
```

### Reiniciar serviços
```bash
docker-compose -f docker-compose.prod.yml restart
docker-compose -f docker-compose.prod.yml restart api
```

### Executar migrations manualmente
```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Acessar shell do container
```bash
docker-compose -f docker-compose.prod.yml exec api sh
docker-compose -f docker-compose.prod.yml exec postgres psql -U grafos_user grafos_production
```

## 💾 Backup e Restore

### Criar backup
```bash
./backup.sh
```

Backups são salvos em `backups/backup_YYYYMMDD_HHMMSS.sql.gz`

### Restaurar backup
```bash
./restore.sh backups/backup_20240101_120000.sql.gz
```

### Backup automático (cron)
```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h da manhã
0 2 * * * cd /caminho/para/grafos && ./backup.sh >> logs/backup.log 2>&1
```

## 🔄 Atualizar Aplicação

### Atualizar código
```bash
git pull origin main
./deploy.sh
```

O script de deploy automaticamente:
- Faz backup do banco atual
- Para os serviços
- Reconstrói as imagens
- Executa migrations
- Reinicia tudo

### Atualizar apenas um serviço
```bash
docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml up -d api
```

## 🔒 Segurança

### 1. Firewall (UFW no Ubuntu)
```bash
# Permitir apenas SSH, HTTP e as portas necessárias
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Se necessário acesso direto ao banco (não recomendado em produção)
# sudo ufw allow 5432/tcp
```

### 2. Alterar senhas padrão
Edite `.env` e mude:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### 3. Desabilitar portas públicas do banco
Por padrão, PostgreSQL e Redis estão expostos. Para produção segura, remova a seção `ports` do docker-compose.prod.yml ou use firewall.

### 4. HTTPS (Recomendado)
Use um reverse proxy como Nginx ou Traefik com Let's Encrypt.

## 📊 Monitoramento

### Ver uso de recursos
```bash
docker stats
```

### Ver espaço em disco
```bash
docker system df
```

### Limpar recursos não utilizados
```bash
docker system prune -a --volumes
```

### Logs da aplicação
```bash
# Logs do Docker
docker-compose -f docker-compose.prod.yml logs --tail=100 -f

# Logs persistentes (se configurado)
docker volume inspect grafos-api-logs
```

## 🐛 Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs api

# Verificar saúde
docker-compose -f docker-compose.prod.yml ps
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U grafos_user
```

### Migrations falharam
```bash
# Executar manualmente
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Ver status
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate status
```

### Resetar tudo (⚠️ CUIDADO)
```bash
# Backup primeiro!
./backup.sh

# Parar e remover volumes
docker-compose -f docker-compose.prod.yml down -v

# Deploy novamente
./deploy.sh
```

## 📁 Volumes Persistentes

Os dados são armazenados em volumes Docker:

- `grafos-postgres-data` - Dados do PostgreSQL
- `grafos-redis-data` - Dados do Redis
- `grafos-api-uploads` - Arquivos enviados
- `grafos-api-logs` - Logs da aplicação

### Ver volumes
```bash
docker volume ls | grep grafos
```

### Backup de volumes
```bash
# PostgreSQL (já incluído em backup.sh)
docker run --rm -v grafos-postgres-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres-volume.tar.gz /data

# Uploads
docker run --rm -v grafos-api-uploads:/data -v $(pwd)/backups:/backup alpine tar czf /backup/uploads-volume.tar.gz /data
```

## 🚀 Próximos Passos

1. ✅ Configurar domínio e DNS
2. ✅ Configurar HTTPS/SSL
3. ✅ Configurar backups automáticos
4. ✅ Configurar monitoramento (Prometheus/Grafana)
5. ✅ Configurar logs centralizados (ELK Stack)
6. ✅ Configurar CI/CD

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose -f docker-compose.prod.yml logs`
2. Consulte este README
3. Abra uma issue no repositório
