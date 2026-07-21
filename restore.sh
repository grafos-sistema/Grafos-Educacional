#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Restaurar Banco de Dados ===${NC}\n"

# Check if backup file provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Backups disponíveis:${NC}"
    ls -lh backups/backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    echo ""
    echo -e "${RED}Uso: ./restore.sh <arquivo-backup>${NC}"
    echo -e "Exemplo: ./restore.sh backups/backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

# Load environment
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco de dados atual!${NC}"
echo -e "Backup a ser restaurado: ${BLUE}$BACKUP_FILE${NC}"
read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirm

if [ "$confirm" != "SIM" ]; then
    echo -e "${YELLOW}Operação cancelada${NC}"
    exit 0
fi

# Create a safety backup before restore
echo -e "\n${YELLOW}📦 Criando backup de segurança antes de restaurar...${NC}"
./backup.sh

echo -e "\n${YELLOW}🔄 Restaurando banco de dados...${NC}"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}📦 Descomprimindo arquivo...${NC}"
    gunzip -c "$BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB}
else
    cat "$BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB}
fi

echo -e "${GREEN}✅ Banco de dados restaurado com sucesso!${NC}"

echo -e "\n${YELLOW}🔄 Reiniciando API para aplicar mudanças...${NC}"
docker-compose -f docker-compose.prod.yml restart api

echo -e "${GREEN}✅ Restauração concluída!${NC}"
