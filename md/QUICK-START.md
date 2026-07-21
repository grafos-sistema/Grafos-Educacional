# 🚀 Quick Start - Grafos

Guia rápido para iniciar os 3 projetos do sistema Grafos.

## ⚡ Start Rápido (Tudo de Uma Vez)

```bash
# 1. Instalar dependências de todos os projetos
npm run install:all

# 2. Configurar banco de dados (apenas primeira vez)
cd api
cp .env.example .env
# Edite o .env com suas configurações do PostgreSQL
npx prisma generate
npx prisma migrate dev
cd ..

# 3. Configurar frontend e landing
cd frontend && cp .env.example .env.local && cd ..
cd landing && cp .env.example .env.local && cd ..

# 4. Iniciar tudo
npm run dev
```

**✅ Pronto! Acesse:**
- 🌐 **Landing Page**: http://localhost:3001
- 💻 **Sistema**: http://localhost:3000
- 🔧 **API (Swagger)**: http://localhost:3001/api

---

## 📦 Comandos por Projeto

### API (Backend)

```bash
cd api

# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Migrations
npx prisma generate
npx prisma migrate dev
npx prisma studio  # Visualizar banco
```

### Frontend (Sistema)

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

### Landing (Site)

```bash
cd landing

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

---

## 🔧 Configurações Rápidas

### Desenvolvimento Local

**api/.env**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/grafos"
JWT_SECRET="your-secret-key"
PORT=3001
```

**frontend/.env.local**
```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**landing/.env.local**
```env
NEXT_PUBLIC_SISTEMA_URL=http://localhost:3000
```

### Produção - Site Principal

**landing/.env**
```env
NEXT_PUBLIC_SISTEMA_URL=https://sistema.grafoseducacional.com.br
```

**frontend/.env**
```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN
NEXT_PUBLIC_API_URL=api-santacruz.grafoseducacional.com.br
```

### Produção - Município

**frontend/.env** (apenas)
```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=escola-central
NEXT_PUBLIC_API_URL=https://api-municipio.grafoseducacional.com.br
```

---

## 🐛 Troubleshooting

### Erro: Porta já em uso

```bash
# Encontrar e matar processos
lsof -ti:3000 | xargs kill  # Frontend
lsof -ti:3001 | xargs kill  # API/Landing
```

### Erro: Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
brew services list  # macOS
sudo service postgresql status  # Linux

# Reiniciar PostgreSQL
brew services restart postgresql  # macOS
sudo service postgresql restart  # Linux
```

### Erro: Dependencies não instaladas

```bash
# Reinstalar tudo
npm run install:all

# Ou individualmente
cd api && npm install && cd ..
cd frontend && npm install && cd ..
cd landing && npm install && cd ..
```

### Erro: Prisma não gera tipos

```bash
cd api
rm -rf node_modules
npm install
npx prisma generate
npx prisma migrate dev
```

---

## 📚 Documentação Completa

- 📖 **README.md**: Visão geral do projeto
- 📖 **DEPLOYMENT.md**: Guia completo de implantação
- 📖 **SEPARACAO-CONCLUIDA.md**: Detalhes da nova estrutura
- 📖 **landing/README.md**: Documentação da landing page

---

## 🎯 Fluxo Típico de Desenvolvimento

```bash
# 1. Pull das últimas mudanças
git pull origin main

# 2. Instalar novas dependências (se houver)
npm run install:all

# 3. Rodar migrations (se houver)
cd api && npx prisma migrate dev && cd ..

# 4. Iniciar desenvolvimento
npm run dev

# 5. Fazer suas alterações...

# 6. Testar
cd api && npm test && cd ..
cd frontend && npm run lint && cd ..
cd landing && npm run lint && cd ..

# 7. Commit
git add .
git commit -m "feat: sua feature"
git push origin sua-branch
```

---

## 🚀 Deploy Rápido

### Vercel (Frontend e Landing)

```bash
# Frontend
cd frontend
vercel --prod

# Landing
cd landing
vercel --prod
```

### Docker (API)

```bash
cd api
docker build -t grafos-api .
docker run -p 3001:3001 grafos-api
```

---

**💡 Dica**: Use `concurrently` para rodar múltiplos comandos. Já está configurado no root!

```bash
# Do root do projeto
npm run dev  # Roda API + Frontend + Landing juntos!
```
