# 🐳 Docker + Deploy - Sistema de Gestão Escolar

Setup completo de Docker com deploy automatizado em produção.

## 📦 O que foi criado?

### Scripts de Deploy
- `deploy.sh` - Script automatizado de deploy completo
- `backup.sh` - Script de backup do banco de dados
- `restore.sh` - Script de restore do banco
- `setup.sh` - Script de setup inicial (dev/prod)

### Configurações Docker
- `docker-compose.prod.yml` - Produção (PostgreSQL + Redis + API + Frontend + migrations)
- `docker-compose.dev.yml` - Desenvolvimento com hot reload
- `docker-compose.yml` - Configuração padrão
- `.env.prod` - Template de produção com todas as variáveis
- `Makefile` - Comandos facilitados

### Dockerfiles
- `api/Dockerfile` - Build otimizado da API para produção
- `api/Dockerfile.dev` - Build da API para desenvolvimento
- `api/.dockerignore` - Arquivos ignorados no build da API
- `frontend/Dockerfile` - Build otimizado do Frontend para produção
- `frontend/Dockerfile.dev` - Build do Frontend para desenvolvimento
- `frontend/.dockerignore` - Arquivos ignorados no build do Frontend

### Documentação
- `QUICK-START.md` - Deploy em 3 passos
- `README-DEPLOY.md` - Guia completo de deploy
- `DEPLOY-CHECKLIST.md` - Checklist de deploy
- `README-DOCKER.md` - Documentação técnica Docker

## 🚀 Deploy em 3 Passos

### 1. Configure
```bash
cp .env.prod .env
nano .env  # ALTERE AS SENHAS!
```

### 2. Deploy
```bash
./deploy.sh
```

### 3. Acesse
- Frontend: http://localhost:3001
- API: http://localhost:3333

## 📋 Comandos Rápidos

```bash
# Deploy completo
./deploy.sh

# Logs
make logs

# Status
make status

# Backup
./backup.sh

# Parar
make stop

# Ver todos os comandos
make help
```

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Docker Compose (Produção)       │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐      ┌──────────┐        │
│  │ Frontend │─────▶│   API    │        │
│  │ Next.js  │      │  NestJS  │        │
│  │  :3001   │      │   :3333  │        │
│  └──────────┘      └─────┬────┘        │
│                          │              │
│                    ┌─────┴──────┐       │
│                    │            │       │
│              ┌─────▼────┐ ┌────▼─────┐ │
│              │PostgreSQL│ │  Redis   │ │
│              │   :5432  │ │  :6379   │ │
│              └──────────┘ └──────────┘ │
│                                         │
└─────────────────────────────────────────┘

Volumes Persistentes:
├─ grafos-postgres-data  (Dados PostgreSQL)
├─ grafos-redis-data     (Dados Redis)
├─ grafos-api-uploads    (Uploads)
└─ grafos-api-logs       (Logs)
```

## ⚙️ Configuração Completa

### Serviços Incluídos

1. **PostgreSQL 16**
   - Banco de dados principal
   - Health checks automáticos
   - Backups automáticos via script

2. **Redis 7**
   - Cache e sessões
   - Protegido com senha
   - Persistência de dados

3. **API (NestJS)**
   - Backend completo
   - Migrations automáticas no startup
   - Seeds opcionais (RUN_SEED=true)
   - Build multi-stage otimizado
   - Health checks

4. **Frontend (Next.js)**
   - Interface do usuário
   - Build otimizado para produção
   - Server-side rendering

5. **DB Init**
   - Container temporário
   - Executa migrations
   - Executa seeds (opcional)
   - Roda apenas no deploy

## 🔐 Segurança

### Variáveis que DEVEM ser alteradas

```env
# Senhas do banco
POSTGRES_PASSWORD=ALTERE_ESTA_SENHA

# Redis
REDIS_PASSWORD=ALTERE_ESTA_SENHA

# JWT Secrets
JWT_SECRET=SECRET_LONGO_E_ALEATORIO_123456
JWT_REFRESH_SECRET=OUTRO_SECRET_DIFERENTE_789ABC
```

### Recomendações

- Use senhas fortes (mínimo 20 caracteres)
- Secrets devem ser aleatórios e únicos
- Configure firewall no servidor
- Use HTTPS em produção
- Mantenha Docker atualizado
- Faça backups regulares

## 💾 Backup e Restore

### Backup Manual
```bash
./backup.sh
```

### Backup Automático (Cron)
```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h
0 2 * * * cd /caminho/grafos && ./backup.sh
```

### Restore
```bash
./restore.sh backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

## 🔄 Atualização

### Atualizar Aplicação
```bash
git pull
./deploy.sh
```

### Atualizar Apenas API
```bash
docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml up -d api
```

## 📊 Monitoramento

### Ver recursos
```bash
make status     # Status + uso de recursos
make health     # Health check de todos os serviços
docker stats    # Uso em tempo real
```

### Logs
```bash
make logs           # Todos os logs
make logs-api       # Apenas API
make logs-frontend  # Apenas Frontend
```

## 🛠️ Troubleshooting

### Container não inicia
```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs api

# Verificar configuração
docker-compose -f docker-compose.prod.yml config
```

### Erro de banco de dados
```bash
# Verificar PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Acessar banco
make db-shell
```

### Reset completo (⚠️ CUIDADO)
```bash
# Fazer backup primeiro!
./backup.sh

# Reset
make db-reset
```

## 📁 Estrutura de Arquivos

```
grafos/
├── api/
│   ├── Dockerfile              # Produção
│   ├── Dockerfile.dev          # Desenvolvimento
│   ├── .dockerignore
│   └── .env.example
├── frontend/
│   ├── Dockerfile              # Produção
│   ├── Dockerfile.dev          # Desenvolvimento
│   ├── .dockerignore
│   └── .env.example
├── docker-compose.prod.yml     # Produção ⭐
├── docker-compose.dev.yml      # Desenvolvimento
├── docker-compose.yml          # Padrão
├── .env.prod                   # Template produção ⭐
├── deploy.sh                   # Script deploy ⭐
├── backup.sh                   # Script backup ⭐
├── restore.sh                  # Script restore ⭐
├── setup.sh                    # Setup inicial
├── Makefile                    # Comandos make ⭐
├── QUICK-START.md              # Início rápido ⭐
├── README-DEPLOY.md            # Guia deploy
├── DEPLOY-CHECKLIST.md         # Checklist
└── README-DOCKER.md            # Doc técnica
```

## 🎯 Makefile - Comandos Disponíveis

```bash
make help          # Ver todos os comandos
make deploy        # Deploy completo
make backup        # Backup do banco
make logs          # Ver logs
make status        # Status dos serviços
make health        # Health check
make restart       # Reiniciar tudo
make stop          # Parar tudo
make clean         # Limpar tudo
make info          # Informações do sistema
```

## 📚 Documentação

- **QUICK-START.md** - Começa aqui! Deploy em 3 passos
- **README-DEPLOY.md** - Guia completo de deploy e operação
- **DEPLOY-CHECKLIST.md** - Checklist passo a passo
- **README-DOCKER.md** - Documentação técnica detalhada

## 🆘 Suporte

### Logs de erro
```bash
make logs-api
make logs-frontend
```

### Health check
```bash
make health
```

### Status completo
```bash
make status
make info
```

---

**Pronto para produção! 🚀**

Use `./deploy.sh` para começar ou veja `QUICK-START.md` para um guia rápido.
