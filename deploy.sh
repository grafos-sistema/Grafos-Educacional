#!/bin/bash

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     Sistema de Gestão Escolar - Deploy em Produção      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root (optional warning)
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Você está executando como root. Isso pode não ser necessário.${NC}"
    read -p "Deseja continuar? (s/n): " continue_root
    if [ "$continue_root" != "s" ] && [ "$continue_root" != "S" ]; then
        exit 1
    fi
fi

# Step 1: Check Dependencies
echo -e "\n${CYAN}[1/9] Verificando dependências...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    echo "Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado!${NC}"
    echo "Instale o Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker $(docker --version)${NC}"
echo -e "${GREEN}✓ Docker Compose $(docker-compose --version)${NC}"

# Step 2: Setup Environment
echo -e "\n${CYAN}[2/9] Configurando variáveis de ambiente...${NC}"

if [ ! -f .env ]; then
    if [ -f .env.prod ]; then
        echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Usando .env.prod${NC}"
        cp .env.prod .env
        echo -e "${GREEN}✓ Arquivo .env criado a partir de .env.prod${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env e altere as senhas e secrets antes do deploy!${NC}"
        read -p "Pressione ENTER para continuar ou Ctrl+C para editar agora..."
    else
        echo -e "${RED}❌ Nenhum arquivo .env ou .env.prod encontrado!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Arquivo .env encontrado${NC}"
fi

# Load environment variables (properly handle values with spaces)
set -a
source .env
set +a

# Step 3: Backup (if exists)
echo -e "\n${CYAN}[3/9] Verificando necessidade de backup...${NC}"

if docker ps -a | grep -q grafos-postgres-prod; then
    echo -e "${YELLOW}⚠️  Containers existentes detectados. Fazendo backup do banco de dados...${NC}"

    mkdir -p backups
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}✓ Backup criado: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível criar backup (container pode não estar rodando)${NC}"
    fi
else
    echo -e "${GREEN}✓ Primeira instalação - sem necessidade de backup${NC}"
fi

# Step 4: Stop existing containers
echo -e "\n${CYAN}[4/9] Parando containers existentes...${NC}"

if docker-compose -f docker-compose.prod.yml ps -q 2>/dev/null | grep -q .; then
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}✓ Containers parados${NC}"
else
    echo -e "${GREEN}✓ Nenhum container rodando${NC}"
fi

# Step 5: Build images
echo -e "\n${CYAN}[5/9] Construindo imagens Docker...${NC}"
echo -e "${YELLOW}Isso pode levar alguns minutos...${NC}"

docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${GREEN}✓ Imagens construídas com sucesso${NC}"

# Step 6: Start services
echo -e "\n${CYAN}[6/9] Iniciando serviços...${NC}"

docker-compose -f docker-compose.prod.yml up -d postgres redis

echo -e "${YELLOW}⏳ Aguardando PostgreSQL e Redis ficarem prontos...${NC}"
sleep 15

# Check if postgres is healthy
if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "healthy"; then
    echo -e "${GREEN}✓ PostgreSQL pronto${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL ainda não está healthy, aguardando mais um pouco...${NC}"
    sleep 10
fi

# Step 7: Run migrations and seed
echo -e "\n${CYAN}[7/9] Executando migrations e seed...${NC}"

docker-compose -f docker-compose.prod.yml up db-init

echo -e "${GREEN}✓ Migrations e seed executados${NC}"

# Step 8: Start application services
echo -e "\n${CYAN}[8/9] Iniciando aplicação...${NC}"

docker-compose -f docker-compose.prod.yml up -d api frontend

echo -e "${YELLOW}⏳ Aguardando serviços ficarem prontos...${NC}"
sleep 20

# Step 9: Health check
echo -e "\n${CYAN}[9/9] Verificando saúde dos serviços...${NC}"


# Show running containers
echo -e "\n${CYAN}Status dos containers:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show logs summary
echo -e "\n${CYAN}Últimas linhas dos logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20

# Success message
echo -e "\n${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            ✅  DEPLOY CONCLUÍDO COM SUCESSO!              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}🌐 URLs de Acesso:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "   API:       ${GREEN}http://localhost:${API_PORT}${NC}"
echo -e "   API Docs:  ${GREEN}http://localhost:${API_PORT}/api${NC}"

echo -e "\n${CYAN}📊 Comandos Úteis:${NC}"
echo -e "   Ver logs:           ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "   Parar serviços:     ${YELLOW}docker-compose -f docker-compose.prod.yml down${NC}"
echo -e "   Reiniciar:          ${YELLOW}docker-compose -f docker-compose.prod.yml restart${NC}"
echo -e "   Status:             ${YELLOW}docker-compose -f docker-compose.prod.yml ps${NC}"
echo -e "   Backup DB:          ${YELLOW}./backup.sh${NC}"

echo -e "\n${CYAN}📁 Volumes criados:${NC}"
echo -e "   PostgreSQL:  ${YELLOW}grafos-postgres-data${NC}"
echo -e "   Redis:       ${YELLOW}grafos-redis-data${NC}"
echo -e "   Uploads:     ${YELLOW}grafos-api-uploads${NC}"
echo -e "   Logs:        ${YELLOW}grafos-api-logs${NC}"

if [ -f "$BACKUP_FILE" ]; then
    echo -e "\n${CYAN}💾 Backup:${NC}"
    echo -e "   Arquivo:  ${YELLOW}$BACKUP_FILE${NC}"
fi

echo -e "\n${YELLOW}⚠️  IMPORTANTE:${NC}"
echo -e "   1. Altere as senhas em .env se ainda não o fez"
echo -e "   2. Configure o firewall para proteger as portas"
echo -e "   3. Configure backups regulares do banco de dados"
echo -e "   4. Monitore os logs regularmente"

echo ""
