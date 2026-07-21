#!/bin/bash

###############################################################################
# Grafos - Script de Setup e Execução Local (sem Docker)
#
# Este script facilita a configuração e execução local de todos os projetos:
# - API (Backend NestJS)
# - Frontend (Sistema de Gestão)
# - Landing (Site Principal)
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
GEAR="⚙️"
INFO="ℹ️"
WARNING="⚠️"
DATABASE="🗄️"
FOLDER="📁"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${CYAN}${INFO} $1${NC}"
}

###############################################################################
# Check Prerequisites
###############################################################################

check_prerequisites() {
    print_header "Verificando Pré-requisitos"

    local all_ok=true

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js instalado: $NODE_VERSION"
    else
        print_error "Node.js não encontrado. Instale: https://nodejs.org"
        all_ok=false
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm instalado: $NPM_VERSION"
    else
        print_error "npm não encontrado"
        all_ok=false
    fi

    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL instalado: $PSQL_VERSION"

        # Check if PostgreSQL is running
        if pg_isready &> /dev/null 2>&1; then
            print_success "PostgreSQL está rodando"
        else
            print_warning "PostgreSQL não está rodando"
            echo -e "${YELLOW}  Inicie com: brew services start postgresql (macOS)${NC}"
            echo -e "${YELLOW}           ou: sudo service postgresql start (Linux)${NC}"
            all_ok=false
        fi
    else
        print_error "PostgreSQL não encontrado"
        echo -e "${YELLOW}  Instale: brew install postgresql (macOS)${NC}"
        echo -e "${YELLOW}       ou: sudo apt-get install postgresql (Ubuntu)${NC}"
        all_ok=false
    fi

    if [ "$all_ok" = false ]; then
        print_error "Corrija os problemas acima antes de continuar"
        exit 1
    fi

    echo ""
}

###############################################################################
# Install Dependencies
###############################################################################

install_dependencies() {
    print_header "Instalando Dependências"

    # Root
    print_info "Instalando dependências do root..."
    npm install > /dev/null 2>&1
    print_success "Root: dependências instaladas"

    # API
    print_info "Instalando dependências da API..."
    cd api
    npm install > /dev/null 2>&1
    cd ..
    print_success "API: dependências instaladas"

    # Frontend
    print_info "Instalando dependências do Frontend..."
    cd frontend
    npm install > /dev/null 2>&1
    cd ..
    print_success "Frontend: dependências instaladas"

    # Landing
    print_info "Instalando dependências da Landing..."
    cd landing
    npm install > /dev/null 2>&1
    cd ..
    print_success "Landing: dependências instaladas"

    echo ""
}

###############################################################################
# Setup Environment Files
###############################################################################

setup_env_files() {
    print_header "Configurando Arquivos de Ambiente"

    # API .env
    if [ ! -f "api/.env" ]; then
        print_info "Criando api/.env..."
        cp api/.env.example api/.env
        print_warning "IMPORTANTE: Edite api/.env com suas configurações do PostgreSQL!"
        print_info "Exemplo: DATABASE_URL=\"postgresql://user:password@localhost:5432/grafos\""
        echo ""
        read -p "Pressione ENTER para continuar..."
    else
        print_success "api/.env já existe"
    fi

    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        print_info "Criando frontend/.env.local..."
        cp frontend/.env.example frontend/.env.local
        print_success "frontend/.env.local criado (configuração padrão MAIN)"
    else
        print_success "frontend/.env.local já existe"
    fi

    # Landing .env.local
    if [ ! -f "landing/.env.local" ]; then
        print_info "Criando landing/.env.local..."
        cp landing/.env.example landing/.env.local
        print_success "landing/.env.local criado"
    else
        print_success "landing/.env.local já existe"
    fi

    echo ""
}

###############################################################################
# Setup Database
###############################################################################

setup_database() {
    print_header "${DATABASE} Configurando Banco de Dados"

    cd api

    print_info "Gerando Prisma Client..."
    npx prisma generate > /dev/null 2>&1
    print_success "Prisma Client gerado"

    print_info "Executando migrations..."
    if npx prisma migrate deploy > /dev/null 2>&1; then
        print_success "Migrations executadas"
    else
        print_warning "Executando migrate dev..."
        npx prisma migrate dev --name init
        print_success "Migrations criadas e executadas"
    fi

    cd ..
    echo ""
}

###############################################################################
# Start Services
###############################################################################

start_services() {
    print_header "${ROCKET} Iniciando Serviços"

    echo -e "${GREEN}Serviços iniciando em:${NC}"
    echo -e "  ${CYAN}🔧 API (Backend):${NC}      http://localhost:3333"
    echo -e "  ${CYAN}📊 API Swagger:${NC}        http://localhost:3333/api"
    echo -e "  ${CYAN}💻 Frontend (Sistema):${NC} http://localhost:3002"
    echo -e "  ${CYAN}🌐 Landing Page:${NC}       http://localhost:3001"
    echo ""
    print_warning "Pressione Ctrl+C para parar todos os serviços"
    echo ""
    sleep 2

    # Start all services with concurrently
    npm run dev
}

###############################################################################
# Main Menu
###############################################################################

show_menu() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
   ╔═══════════════════════════════════════════════════════════╗
   ║                                                           ║
   ║   ██████╗ ██████╗  █████╗ ███████╗ ██████╗ ███████╗     ║
   ║  ██╔════╝ ██╔══██╗██╔══██╗██╔════╝██╔═══██╗██╔════╝     ║
   ║  ██║  ███╗██████╔╝███████║█████╗  ██║   ██║███████╗     ║
   ║  ██║   ██║██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║     ║
   ║  ╚██████╔╝██║  ██║██║  ██║██║     ╚██████╔╝███████║     ║
   ║   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝     ║
   ║                                                           ║
   ║          Sistema de Gestão Escolar - Setup Local         ║
   ║                                                           ║
   ╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    echo -e "${GREEN}Escolha uma opção:${NC}"
    echo ""
    echo "  ${ROCKET} 1) Setup Completo e Rodar (Recomendado)"
    echo "  ${GEAR} 2) Apenas Instalar Dependências"
    echo "  ${FOLDER} 3) Apenas Configurar Arquivos .env"
    echo "  ${DATABASE} 4) Apenas Setup do Banco de Dados"
    echo "  ${ROCKET} 5) Apenas Iniciar Serviços (Tudo)"
    echo ""
    echo "  ${INFO} 6) Rodar Apenas API"
    echo "  ${INFO} 7) Rodar Apenas Frontend"
    echo "  ${INFO} 8) Rodar Apenas Landing"
    echo ""
    echo "  ${CROSS} 9) Sair"
    echo ""
    read -p "Opção: " choice

    case $choice in
        1)
            check_prerequisites
            install_dependencies
            setup_env_files
            setup_database
            start_services
            ;;
        2)
            check_prerequisites
            install_dependencies
            echo ""
            print_success "Dependências instaladas! Execute o script novamente para outras opções."
            echo ""
            read -p "Pressione ENTER para voltar ao menu..."
            show_menu
            ;;
        3)
            setup_env_files
            echo ""
            print_success "Arquivos .env configurados!"
            print_warning "Não esqueça de editá-los com suas configurações."
            echo ""
            read -p "Pressione ENTER para voltar ao menu..."
            show_menu
            ;;
        4)
            setup_database
            echo ""
            print_success "Banco de dados configurado!"
            echo ""
            read -p "Pressione ENTER para voltar ao menu..."
            show_menu
            ;;
        5)
            start_services
            ;;
        6)
            print_info "Iniciando apenas API..."
            echo ""
            cd api && npm run start:dev
            ;;
        7)
            print_info "Iniciando apenas Frontend..."
            echo ""
            cd frontend && npm run dev
            ;;
        8)
            print_info "Iniciando apenas Landing..."
            echo ""
            cd landing && npm run dev
            ;;
        9)
            echo ""
            print_info "Até logo! 👋"
            echo ""
            exit 0
            ;;
        *)
            print_error "Opção inválida!"
            sleep 1
            show_menu
            ;;
    esac
}

###############################################################################
# Quick Start (No Menu)
###############################################################################

quick_start() {
    print_header "${ROCKET} Grafos - Quick Start"

    check_prerequisites
    install_dependencies
    setup_env_files
    setup_database
    start_services
}

###############################################################################
# Main
###############################################################################

# Check if script is run with flags
if [ "$1" = "--quick" ] || [ "$1" = "-q" ]; then
    quick_start
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: ./setup.sh [opção]"
    echo ""
    echo "Opções:"
    echo "  (sem opção)     Mostra menu interativo"
    echo "  --quick, -q     Executa setup completo sem menu"
    echo "  --help, -h      Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./setup.sh              # Menu interativo"
    echo "  ./setup.sh --quick      # Setup rápido"
    echo ""
else
    show_menu
fi
