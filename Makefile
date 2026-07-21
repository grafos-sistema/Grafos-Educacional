.PHONY: help deploy backup restore logs status stop restart clean

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
CYAN   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)

help: ## Mostra esta mensagem de ajuda
	@echo ''
	@echo '${CYAN}Sistema de Gestão Escolar - Comandos Docker${RESET}'
	@echo ''
	@echo 'Uso:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<comando>${RESET}'
	@echo ''
	@echo 'Comandos Principais:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "    ${YELLOW}%-20s${GREEN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${CYAN}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)

## 🚀 Produção
deploy: ## Deploy completo em produção (usar deploy.sh)
	@./deploy.sh

prod-start: ## Inicia serviços de produção
	docker-compose -f docker-compose.prod.yml up -d

prod-stop: ## Para serviços de produção
	docker-compose -f docker-compose.prod.yml down

prod-restart: ## Reinicia serviços de produção
	docker-compose -f docker-compose.prod.yml restart

prod-logs: ## Mostra logs de produção
	docker-compose -f docker-compose.prod.yml logs -f

prod-status: ## Status dos serviços de produção
	docker-compose -f docker-compose.prod.yml ps

prod-build: ## Rebuild de produção
	docker-compose -f docker-compose.prod.yml build --no-cache

## 💻 Desenvolvimento
dev: ## Inicia ambiente de desenvolvimento
	docker-compose -f docker-compose.dev.yml up -d

dev-stop: ## Para ambiente de desenvolvimento
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## Logs de desenvolvimento
	docker-compose -f docker-compose.dev.yml logs -f

dev-restart: ## Reinicia desenvolvimento
	docker-compose -f docker-compose.dev.yml restart

## 💾 Banco de Dados
backup: ## Cria backup do banco de dados
	@./backup.sh

restore: ## Restaura backup (use: make restore FILE=backups/backup.sql.gz)
	@./restore.sh $(FILE)

migrate: ## Executa migrations
	docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

migrate-dev: ## Cria nova migration
	docker-compose -f docker-compose.dev.yml exec api npx prisma migrate dev

seed: ## Executa seed do banco
	docker-compose -f docker-compose.prod.yml exec api npx prisma db seed

db-shell: ## Acessa shell do PostgreSQL
	docker-compose -f docker-compose.prod.yml exec postgres psql -U $${POSTGRES_USER:-grafos_user} $${POSTGRES_DB:-grafos_production}

db-reset: ## CUIDADO: Reseta o banco (faz backup antes)
	@echo "⚠️  ATENÇÃO: Isso irá resetar o banco de dados!"
	@read -p "Digite 'SIM' para confirmar: " confirm && [ "$$confirm" = "SIM" ]
	@./backup.sh
	docker-compose -f docker-compose.prod.yml down -v
	docker-compose -f docker-compose.prod.yml up -d postgres redis
	@sleep 10
	docker-compose -f docker-compose.prod.yml up db-init

## 🔧 Utilidades
logs: ## Mostra logs (produção)
	docker-compose -f docker-compose.prod.yml logs -f

logs-api: ## Logs da API
	docker-compose -f docker-compose.prod.yml logs -f api

logs-frontend: ## Logs do Frontend
	docker-compose -f docker-compose.prod.yml logs -f frontend

logs-postgres: ## Logs do PostgreSQL
	docker-compose -f docker-compose.prod.yml logs -f postgres

logs-redis: ## Logs do Redis
	docker-compose -f docker-compose.prod.yml logs -f redis

shell-api: ## Shell da API
	docker-compose -f docker-compose.prod.yml exec api sh

shell-frontend: ## Shell do Frontend
	docker-compose -f docker-compose.prod.yml exec frontend sh

status: ## Status dos serviços
	docker-compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "📊 Uso de recursos:"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

health: ## Verifica saúde dos serviços
	@echo "🏥 Verificando saúde dos serviços..."
	@echo ""
	@echo "PostgreSQL:"
	@docker-compose -f docker-compose.prod.yml exec postgres pg_isready || echo "❌ Não está pronto"
	@echo ""
	@echo "Redis:"
	@docker-compose -f docker-compose.prod.yml exec redis redis-cli ping || echo "❌ Não está respondendo"
	@echo ""
	@echo "API:"
	@curl -sf http://localhost:$${API_PORT:-3333}/api > /dev/null && echo "✅ OK" || echo "❌ Não está respondendo"
	@echo ""
	@echo "Frontend:"
	@curl -sf http://localhost:$${FRONTEND_PORT:-3001} > /dev/null && echo "✅ OK" || echo "❌ Não está respondendo"

## 🔄 Manutenção
restart: ## Reinicia todos os serviços
	docker-compose -f docker-compose.prod.yml restart

restart-api: ## Reinicia apenas API
	docker-compose -f docker-compose.prod.yml restart api

restart-frontend: ## Reinicia apenas Frontend
	docker-compose -f docker-compose.prod.yml restart frontend

stop: ## Para todos os serviços
	docker-compose -f docker-compose.prod.yml down

start: ## Inicia todos os serviços
	docker-compose -f docker-compose.prod.yml up -d

update: ## Atualiza aplicação (git pull + redeploy)
	@echo "📥 Atualizando código..."
	git pull origin main
	@echo "🚀 Fazendo redeploy..."
	@./deploy.sh

## 🧹 Limpeza
clean: ## Remove containers e volumes (CUIDADO!)
	@echo "⚠️  Isso irá remover TUDO, incluindo dados!"
	@read -p "Digite 'SIM' para confirmar: " confirm && [ "$$confirm" = "SIM" ]
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -af

clean-logs: ## Limpa logs antigos
	@echo "🧹 Limpando logs Docker..."
	docker system prune -f

clean-images: ## Remove imagens não utilizadas
	docker image prune -af

clean-volumes: ## Remove volumes não utilizados
	docker volume prune -f

## 📊 Informações
info: ## Informações do sistema
	@echo "📊 Informações do Sistema Docker"
	@echo ""
	@echo "Versões:"
	@docker --version
	@docker-compose --version
	@echo ""
	@echo "Uso de disco:"
	@docker system df
	@echo ""
	@echo "Containers rodando:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Volumes:"
	@docker volume ls | grep grafos || echo "Nenhum volume encontrado"

volumes: ## Lista volumes
	@docker volume ls | grep grafos

networks: ## Lista networks
	@docker network ls | grep grafos

backups: ## Lista backups disponíveis
	@ls -lh backups/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"

## 📚 Documentação
docs: ## Abre documentação
	@echo "📚 Documentação disponível:"
	@echo "  - README-DEPLOY.md - Guia de deploy"
	@echo "  - DEPLOY-CHECKLIST.md - Checklist de deploy"
	@echo "  - README-DOCKER.md - Documentação Docker completa"

checklist: ## Mostra checklist de deploy
	@cat DEPLOY-CHECKLIST.md
