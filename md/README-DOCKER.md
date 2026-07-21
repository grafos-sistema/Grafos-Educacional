# Docker Setup - Sistema de Gestão Escolar

Este guia explica como executar o projeto completo usando Docker e Docker Compose.

## Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)

## Estrutura de Serviços

O projeto é composto por 4 serviços principais:

1. **postgres** - Banco de dados PostgreSQL 16
2. **redis** - Cache Redis 7
3. **api** - Backend NestJS (porta 3333)
4. **frontend** - Frontend Next.js (porta 3001)

## Configuração Inicial

### 1. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste conforme necessário:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure as variáveis:

```env
# Environment
NODE_ENV=production

# PostgreSQL Database
POSTGRES_DB=grafos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# API Backend
API_PORT=3333
JWT_SECRET=MUDE_ESTE_SECRET_PARA_PRODUCAO
JWT_EXPIRATION=7d

# Frontend
FRONTEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3333
```

### 2. Configurar variáveis da API

```bash
cd api
cp .env.example .env
```

Ajuste as configurações conforme necessário no arquivo `api/.env`.

### 3. Configurar variáveis do Frontend

```bash
cd frontend
cp .env.example .env
```

Ajuste a URL da API no arquivo `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## Como Executar

### Iniciar todos os serviços

```bash
docker-compose up -d
```

Este comando irá:
- Criar e iniciar o banco PostgreSQL
- Criar e iniciar o Redis
- Build e iniciar a API (incluindo migrations do Prisma)
- Build e iniciar o Frontend

### Verificar status dos serviços

```bash
docker-compose ps
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas a API
docker-compose logs -f api

# Apenas o Frontend
docker-compose logs -f frontend
```

### Parar os serviços

```bash
docker-compose down
```

### Parar e remover volumes (dados)

```bash
docker-compose down -v
```

## Executar Migrations e Seeds

### Executar migrations manualmente

```bash
docker-compose exec api npx prisma migrate deploy
```

### Executar seed do banco de dados

```bash
docker-compose exec api npx prisma db seed
```

### Gerar Prisma Client

```bash
docker-compose exec api npx prisma generate
```

## Comandos Úteis

### Acessar o shell do container

```bash
# API
docker-compose exec api sh

# Frontend
docker-compose exec frontend sh

# PostgreSQL
docker-compose exec postgres psql -U postgres -d grafos
```

### Rebuild de um serviço específico

```bash
# Rebuild API
docker-compose up -d --build api

# Rebuild Frontend
docker-compose up -d --build frontend
```

### Limpar tudo e começar do zero

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## URLs de Acesso

Após iniciar os serviços:

- **Frontend**: http://localhost:3001
- **API**: http://localhost:3333
- **API Docs (Swagger)**: http://localhost:3333/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Troubleshooting

### Erro de conexão com o banco de dados

Verifique se o serviço PostgreSQL está rodando:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

### Erro de build

Limpe o cache do Docker:
```bash
docker system prune -a
docker-compose build --no-cache
```

### Porta já em uso

Se alguma porta já estiver em uso, edite o arquivo `.env` e altere as portas:
```env
API_PORT=3002
FRONTEND_PORT=3003
POSTGRES_PORT=5433
REDIS_PORT=6380
```

### Migrations não executaram

Execute manualmente:
```bash
docker-compose exec api npx prisma migrate deploy
```

## Produção

Para produção, considere:

1. Usar um arquivo `docker-compose.prod.yml` separado
2. Configurar um reverse proxy (Nginx/Traefik)
3. Usar volumes nomeados para persistência de dados
4. Configurar backups automáticos do PostgreSQL
5. Usar secrets do Docker para senhas
6. Configurar SSL/TLS
7. Implementar monitoring e logging

### Exemplo com Nginx Reverse Proxy

Adicione ao `docker-compose.yml`:

```yaml
  nginx:
    image: nginx:alpine
    container_name: grafos-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - frontend
    networks:
      - grafos-network
```

## Manutenção

### Backup do banco de dados

```bash
docker-compose exec postgres pg_dump -U postgres grafos > backup.sql
```

### Restore do banco de dados

```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres grafos
```

### Ver uso de recursos

```bash
docker stats
```

## Desenvolvimento vs Produção

### Desenvolvimento (com hot reload)

Para desenvolvimento, você pode montar volumes para hot reload:

```yaml
  api:
    volumes:
      - ./api:/app
      - /app/node_modules
```

### Produção

Use os Dockerfiles otimizados fornecidos, que fazem build multi-stage para imagens menores e mais seguras.
