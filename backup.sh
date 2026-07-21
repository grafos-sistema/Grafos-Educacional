#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Backup do Banco de Dados ===${NC}\n"

# Load environment
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado, usando valores padrão${NC}"
    POSTGRES_USER=${POSTGRES_USER:-grafos_user}
    POSTGRES_DB=${POSTGRES_DB:-grafos_production}
fi

# Create backups directory
mkdir -p backups

# Generate filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/backup_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="backups/backup_${TIMESTAMP}.sql.gz"

echo -e "${YELLOW}📦 Criando backup...${NC}"

# Create backup
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > "$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Backup criado: $BACKUP_FILE${NC}"

    # Compress
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup comprimido: $BACKUP_COMPRESSED${NC}"

    # Show size
    SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
    echo -e "${BLUE}📊 Tamanho: $SIZE${NC}"

    # Keep only last 10 backups
    echo -e "\n${YELLOW}🧹 Limpando backups antigos (mantendo últimos 10)...${NC}"
    ls -t backups/backup_*.sql.gz | tail -n +11 | xargs -r rm

    echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"

    echo -e "\n${BLUE}📋 Backups disponíveis:${NC}"
    ls -lh backups/backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    exit 1
fi
