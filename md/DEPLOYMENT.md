# Guia de Implantação: Separação Landing Page e Sistema Municipal

## Visão Geral

O sistema Grafos foi arquitetado em **3 projetos separados** para suportar diferentes tipos de implantação:

### 📁 Estrutura de Projetos

```
grafos/
├── api/          # Backend NestJS + PostgreSQL
├── frontend/     # Sistema de Gestão Escolar (Next.js)
└── landing/      # Landing Page do Site Principal (Next.js)
```

**Benefícios da Separação:**
- ✅ Landing page totalmente independente do sistema
- ✅ Fácil deploy separado de cada componente
- ✅ Escalabilidade independente
- ✅ Manutenção simplificada
- ✅ Sem código desnecessário em municípios

### 🎯 Tipos de Implantação

1. **MAIN (Site Principal)**:
   - **Landing** + **Frontend (MAIN)** + **API**
   - URL: `grafoseducacional.com.br` (landing) + `sistema.grafoseducacional.com.br` (sistema)
   - Landing page com marketing e informações institucionais

2. **MUNICIPALITY (Municipal)**:
   - **Frontend (MUNICIPALITY)** + **API**
   - URL: `{municipio}.grafoseducacional.com.br` (sistema only)
   - Sem landing page, acesso direto ao sistema

## Arquitetura

### Site Principal (MAIN)

**Componentes:**
- 🌐 **Landing** (`landing/`): `https://grafoseducacional.com.br` (porta 3001)
- 💻 **Frontend** (`frontend/`): `https://sistema.grafoseducacional.com.br` (porta 3000)
- 🔧 **API** (`api/`): `api-santacruz.grafoseducacional.com.br` (porta 3001)

**Funcionalidade:**
- Landing page com marketing e features
- Sistema completo de gestão escolar
- Cadastro de novas instituições
- Acesso a páginas institucionais

### Instância Municipal (MUNICIPALITY)

**Componentes:**
- 💻 **Frontend** (`frontend/`): `https://{municipio}.grafoseducacional.com.br`
- 🔧 **API** (`api/`): `https://api-{municipio}.grafoseducacional.com.br`
- ❌ **Landing**: NÃO incluído

**Funcionalidade:**
- Acesso direto ao sistema (sem landing page)
- Seleção de instituição (se múltiplas escolas)
- Login direto (se instituição padrão configurada)
- Sistema de gestão escolar completo

## Configuração

### 1. Variáveis de Ambiente

#### Frontend (`frontend/.env.local`)

```env
# Tipo de Implantação
# 'MAIN' = Site principal com landing page
# 'MUNICIPALITY' = Instância municipal sem landing page
NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN

# Configuração Municipal (apenas para DEPLOYMENT_TYPE=MUNICIPALITY)
# Slug da instituição padrão (opcional)
NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=escola-municipal-abc

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Exemplos de Configuração

#### Exemplo 1: Site Principal Grafos
```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN
NEXT_PUBLIC_API_URL=api-santacruz.grafoseducacional.com.br
```

#### Exemplo 2: Município com Múltiplas Escolas
```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_API_URL=https://api-santacruz.grafoseducacional.com.br
# Sem NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG
# Usuários verão seleção de instituições
```

#### Exemplo 3: Município com Escola Única
```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=escola-municipal-central
NEXT_PUBLIC_API_URL=https://api-santacruz.grafoseducacional.com.br
# Redireciona diretamente para login da escola
```

## Comportamento por Tipo de Implantação

### MAIN (Site Principal)

| Rota | Comportamento |
|------|---------------|
| `/` | Landing page completa (marketing) |
| `/login` | Seleção de perfil de login |
| `/login/{perfil}` | Login por perfil (admin, professor, etc) |
| `/{institution}` | Página pública da instituição |
| `/login/{institution}` | Login específico da instituição |
| `/register` | Cadastro de novas instituições |

### MUNICIPALITY (Municipal)

| Rota | Comportamento |
|------|---------------|
| `/` | **Redirecionamento automático** |
| | • Se `DEFAULT_INSTITUTION_SLUG` configurado → `/login/{slug}` |
| | • Caso contrário → `/institutions` |
| `/institutions` | Lista de instituições do município |
| `/login/{institution}` | Login específico da instituição |
| `/{institution}` | Página pública da instituição |

> **Nota**: A landing page do site principal (`/app/page.tsx`) **não é acessível** em implantações municipais devido ao redirecionamento no middleware.

## Fluxo de Acesso

### Site Principal (MAIN)
```
grafoseducacional.com.br
    ↓
Landing Page
    ↓
Escolher perfil de acesso
    ↓
Login
    ↓
Sistema
```

### Municipal - Escola Única
```
santacruz.grafoseducacional.com.br
    ↓
[Redirecionamento automático]
    ↓
/login/escola-municipal-central
    ↓
Login direto
    ↓
Sistema
```

### Municipal - Múltiplas Escolas
```
santacruz.grafoseducacional.com.br
    ↓
[Redirecionamento automático]
    ↓
/institutions
    ↓
Seleção de escola
    ↓
/login/{escola-escolhida}
    ↓
Login
    ↓
Sistema
```

## Arquivos Modificados/Criados

### Novos Arquivos

1. **`frontend/src/lib/deployment-config.ts`**
   - Utilitários de configuração de implantação
   - Funções helpers para verificar tipo de deployment

2. **`frontend/src/app/institutions/page.tsx`**
   - Página de seleção de instituições
   - Busca e filtro de escolas
   - Usada em implantações municipais

3. **`DEPLOYMENT.md`** (este arquivo)
   - Documentação completa de implantação

### Arquivos Modificados

1. **`frontend/.env.example`**
   - Adicionadas variáveis `NEXT_PUBLIC_DEPLOYMENT_TYPE`
   - Adicionada variável `NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG`

2. **`frontend/.env.local`**
   - Mesmas variáveis do `.env.example`

3. **`frontend/middleware.ts`**
   - Lógica de redirecionamento para implantações municipais
   - Tratamento do acesso à rota raiz (`/`)
   - Adicionada rota pública `/institutions`

### Arquivos Não Modificados (mas relevantes)

- **`frontend/src/app/page.tsx`**: Landing page (só acessível em MAIN)
- **`frontend/src/app/[institution]/page.tsx`**: Página institucional
- **`frontend/src/app/(auth)/login/[institution]/page.tsx`**: Login institucional

## Implantação em Produção

### Passo 1: Preparar Backend API

Cada município deve ter sua própria instância de API ou banco de dados isolado:

```bash
# Opção 1: API dedicada
https://api-{municipio}.grafoseducacional.com.br

# Opção 2: Mesma API com filtro por tenant
api-santacruz.grafoseducacional.com.br (com isolamento por município no banco)
```

### Passo 2: Configurar Frontend

#### Para Site Principal:
```bash
cd frontend
cp .env.example .env.production

# Editar .env.production
NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN
NEXT_PUBLIC_API_URL=api-santacruz.grafoseducacional.com.br

# Build
npm run build

# Deploy para grafoseducacional.com.br
```

#### Para Município:
```bash
cd frontend
cp .env.example .env.production

# Editar .env.production
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=escola-central  # Opcional
NEXT_PUBLIC_API_URL=https://api-santacruz.grafoseducacional.com.br

# Build
npm run build

# Deploy para santacruz.grafoseducacional.com.br
```

### Passo 3: Configurar DNS e Servidor

```nginx
# Exemplo nginx para município
server {
    listen 80;
    server_name santacruz.grafoseducacional.com.br;

    location / {
        proxy_pass http://localhost:3000;  # Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Passo 4: Criar Instituições no Banco

Para cada município, criar as instituições no banco de dados:

```sql
INSERT INTO institutions (name, slug, city, state, ...)
VALUES
  ('Escola Municipal Central', 'escola-central', 'Santa Cruz', 'RJ', ...),
  ('Escola Municipal Norte', 'escola-norte', 'Santa Cruz', 'RJ', ...);
```

## Multi-Tenancy e Isolamento

### Estratégia Recomendada

Para cada município, recomenda-se:

**Opção 1: Banco de Dados Separado (Recomendado)**
- Cada município tem seu próprio banco PostgreSQL
- Isolamento total de dados
- Backup independente
- Melhor para conformidade com LGPD

**Opção 2: Schema Separado no Mesmo Banco**
- Schemas PostgreSQL diferentes por município
- Reduz custo de infraestrutura
- Requer cuidado na gestão de conexões

**Opção 3: Tenant ID (Não Recomendado para Municípios)**
- Mesma tabela com campo `municipalityId`
- Maior risco de vazamento de dados
- Use apenas em desenvolvimento

### Exemplo com Prisma (Opção 1)

```typescript
// api/.env.production.santacruz
DATABASE_URL="postgresql://user:pass@db-santacruz:5432/grafos_santacruz"

// api/.env.production.novafriburgo
DATABASE_URL="postgresql://user:pass@db-novafriburgo:5432/grafos_novafriburgo"
```

## Checklist de Implantação Municipal

- [ ] Criar instância de banco de dados PostgreSQL
- [ ] Executar migrations do Prisma
- [ ] Criar registros de instituições no banco
- [ ] Configurar variáveis de ambiente do backend (DATABASE_URL, JWT_SECRET)
- [ ] Deploy da API em servidor/container
- [ ] Configurar variáveis de ambiente do frontend
- [ ] Build do frontend Next.js
- [ ] Deploy do frontend em servidor/Vercel/container
- [ ] Configurar DNS apontando para o servidor
- [ ] Configurar SSL/HTTPS (Let's Encrypt)
- [ ] Testar fluxo de login completo
- [ ] Criar usuários admin iniciais
- [ ] Documentar credenciais de acesso

## Manutenção e Updates

### Atualizando Múltiplas Instâncias Municipais

```bash
# Script de exemplo para update em múltiplos municípios
#!/bin/bash

MUNICIPALITIES=("santacruz" "novafriburgo" "petropolis")

for mun in "${MUNICIPALITIES[@]}"; do
  echo "Updating $mun..."

  # Pull latest code
  cd /var/www/$mun/frontend
  git pull

  # Install deps and build
  npm install
  npm run build

  # Restart service
  pm2 restart grafos-$mun
done
```

## Troubleshooting

### Problema: Landing page aparece em implantação municipal

**Causa**: `NEXT_PUBLIC_DEPLOYMENT_TYPE` não está configurado ou está como `MAIN`

**Solução**:
```bash
# Verificar .env.local ou .env.production
cat frontend/.env.local

# Deve conter:
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY

# Rebuild
cd frontend && npm run build
```

### Problema: Redirecionamento infinito

**Causa**: Middleware pode estar redirecionando em loop

**Solução**: Verificar logs do console e garantir que `/institutions` está nas rotas públicas:
```typescript
// middleware.ts
const publicRoutes = [
  // ...
  '/institutions', // Deve estar presente
];
```

### Problema: API não encontra instituições

**Causa**: Banco de dados vazio ou API URL incorreta

**Solução**:
```bash
# Verificar API URL
echo $NEXT_PUBLIC_API_URL

# Testar endpoint
curl https://api-santacruz.grafoseducacional.com.br/institutions

# Se vazio, criar instituições via SQL ou seed
```

## Segurança

### Considerações Importantes

1. **Isolamento de Dados**: Cada município DEVE ter banco separado
2. **Autenticação**: JWT tokens com claims de instituição
3. **CORS**: Configurar apenas domínios autorizados
4. **SSL/TLS**: Obrigatório em produção
5. **Backups**: Estratégia independente por município
6. **LGPD**: Cada município é responsável pelos dados de suas escolas

### Configuração CORS (Backend)

```typescript
// api/src/main.ts
app.enableCors({
  origin: [
    'https://grafoseducacional.com.br',                      // Site principal
    'https://santacruz.grafoseducacional.com.br',         // Município 1
    'https://novafriburgo.grafoseducacional.com.br',      // Município 2
    // ... outros municípios
  ],
  credentials: true,
});
```

## Suporte e Contato

Para dúvidas sobre implantação:
- Email: suporte@grafoseducacional.com.br
- Documentação: https://docs.grafoseducacional.com.br
- GitHub: https://github.com/grafos/sistema-gestao

---

**Última atualização**: 2025-12-09
**Versão**: 2.0.0
