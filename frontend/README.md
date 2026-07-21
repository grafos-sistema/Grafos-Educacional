# 📱 Frontend - Sistema de Gestão Escolar

Interface web moderna desenvolvida com Next.js 15, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Gerenciamento de Estado:** Zustand + TanStack Query
- **Formulários:** React Hook Form + Zod
- **Requisições HTTP:** Axios
- **Gráficos:** Recharts
- **Componentes UI:** Headless UI + Hero Icons

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- API Backend rodando (porta 3001)

## ⚙️ Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Editar .env.local com suas configurações
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🏃 Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3333](http://localhost:3333)

## 📁 Estrutura de Pastas

Consulte o arquivo [IMPLEMENTATION.md](./IMPLEMENTATION.md) para detalhes completos.

## 📖 Documentação

- **Implementação:** [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Plano completo de implementação
- **Customização por Município:** [MUNICIPALITY_CUSTOMIZATION.md](./MUNICIPALITY_CUSTOMIZATION.md) - Guia de personalização

## 🎨 Customização por Município

O sistema pode ser totalmente personalizado para cada município com:

- ✅ Logo personalizado
- ✅ Cores customizadas (primária, secundária, acento)
- ✅ Nome e slogan do município
- ✅ Informações de contato
- ✅ Metadata SEO otimizado

**Consulte o guia completo:** [MUNICIPALITY_CUSTOMIZATION.md](./MUNICIPALITY_CUSTOMIZATION.md)

**Quick Start:**
```bash
# Copiar exemplo de configuração para município
cp .env.municipality.example .env.local

# Editar .env.local e configurar:
# - NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
# - NEXT_PUBLIC_MUNICIPALITY_NAME=...
# - NEXT_PUBLIC_PRIMARY_COLOR=...
# - etc.

# Adicionar logo do município
mkdir -p public/logos
cp seu-logo.png public/logos/
```

## 🔐 Roles Disponíveis

- SUPER_ADMIN
- INSTITUTION_ADMIN
- COORDINATOR
- TEACHER
- STUDENT
- PARENT
