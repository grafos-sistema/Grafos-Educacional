# Changelog: Separação Landing Page e Sistema Municipal

**Data**: 2025-12-09
**Versão**: 2.0.0
**Autor**: Claude Code

## 📋 Resumo

Implementada separação completa entre a landing page do site principal Grafos e as instâncias municipais do sistema. Agora cada município pode ter sua própria implantação sem a landing page de marketing, com acesso direto ao sistema de gestão escolar.

## 🎯 Objetivos Alcançados

✅ **Separação Total**: Landing page isolada do sistema de gestão
✅ **Multi-Tenancy**: Suporte para múltiplas instâncias municipais independentes
✅ **Configuração Flexível**: Variáveis de ambiente para controlar tipo de implantação
✅ **Redirecionamento Inteligente**: Middleware automático baseado no tipo de deployment
✅ **Seleção de Instituições**: Página dedicada para municípios com múltiplas escolas
✅ **Documentação Completa**: Guias detalhados de implantação

## 📁 Arquivos Criados

### 1. Configuração e Utilitários
- **`frontend/src/lib/deployment-config.ts`**
  - Funções helpers para gerenciar tipos de deployment
  - `isMainSite()`, `isMunicipalityDeployment()`
  - Configurações centralizadas

### 2. Páginas
- **`frontend/src/app/institutions/page.tsx`**
  - Página de seleção de instituições para municípios
  - Busca e filtro de escolas
  - Design responsivo com Tailwind CSS

### 3. Documentação
- **`DEPLOYMENT.md`**
  - Guia completo de implantação
  - Estratégias de multi-tenancy
  - Checklist de deploy
  - Troubleshooting

- **`CHANGELOG-DEPLOYMENT.md`** (este arquivo)
  - Resumo das mudanças
  - Arquivos modificados
  - Instruções de uso

- **`frontend/.env.municipality.example`**
  - Exemplo de configuração municipal
  - Comentários detalhados
  - Casos de uso

## 🔧 Arquivos Modificados

### 1. Variáveis de Ambiente
**`frontend/.env.example`** e **`frontend/.env.local`**
```diff
+ # Deployment Type
+ # 'MAIN' = Grafos main site with landing page (grafoseducacional.com.br)
+ # 'MUNICIPALITY' = Municipality-specific deployment without landing page
+ NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN
+
+ # Municipality Configuration (only used when DEPLOYMENT_TYPE=MUNICIPALITY)
+ # Slug of the default institution for this municipality deployment
+ NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=
```

### 2. Middleware
**`frontend/middleware.ts`**
```diff
+ // Get deployment configuration
+ const DEPLOYMENT_TYPE = process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE || 'MAIN';
+ const DEFAULT_INSTITUTION_SLUG = process.env.NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG;

  const publicRoutes = [
    '/',
    '/login',
    // ...
+   '/institutions', // Public institution selection page
+   '/register',
  ];

  export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

+   // Handle municipality deployment: redirect root to institutions or login
+   if (DEPLOYMENT_TYPE === 'MUNICIPALITY' && pathname === '/') {
+     if (DEFAULT_INSTITUTION_SLUG) {
+       return NextResponse.redirect(new URL(`/login/${DEFAULT_INSTITUTION_SLUG}`, request.url));
+     }
+     return NextResponse.redirect(new URL('/institutions', request.url));
+   }

    // ... resto do código
  }
```

### 3. README Principal
**`README.md`**
- Adicionada seção "Tipos de Implantação"
- Link para documentação detalhada
- Exemplos de configuração

## 🚀 Como Usar

### Para o Site Principal Grafos (com landing page)

```bash
# .env.local
NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN
NEXT_PUBLIC_API_URL=api-santacruz.grafoseducacional.com.br

npm run build
npm start
```

**Resultado**: Landing page completa em `/`, perfis de acesso, cadastro de instituições.

### Para Instância Municipal (sem landing page)

#### Caso 1: Múltiplas Escolas no Município

```bash
# .env.local
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_API_URL=https://api-santacruz.grafoseducacional.com.br
# NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG não definido

npm run build
npm start
```

**Resultado**:
- `/` redireciona para `/institutions`
- Usuário seleciona a escola
- Login na escola escolhida

#### Caso 2: Escola Única no Município

```bash
# .env.local
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=escola-municipal-central
NEXT_PUBLIC_API_URL=https://api-santacruz.grafoseducacional.com.br

npm run build
npm start
```

**Resultado**:
- `/` redireciona direto para `/login/escola-municipal-central`
- Login imediato, sem etapas intermediárias

## 🏗️ Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TYPE                       │
└───────────────┬────────────────────────┬────────────────┘
                │                        │
        ┌───────▼─────────┐      ┌──────▼───────────┐
        │      MAIN       │      │   MUNICIPALITY    │
        │ (Site Grafos)   │      │  (Municipal)      │
        └───────┬─────────┘      └──────┬───────────┘
                │                        │
        ┌───────▼─────────┐      ┌──────▼───────────┐
        │  Landing Page   │      │ NO Landing Page  │
        │  (Marketing)    │      │ (Redirect Auto)  │
        └───────┬─────────┘      └──────┬───────────┘
                │                        │
        ┌───────▼─────────┐      ┌──────▼───────────────────┐
        │ Profile Select  │      │ DEFAULT_INSTITUTION_SLUG?│
        └───────┬─────────┘      └──────┬───────────────────┘
                │                       / \
        ┌───────▼─────────┐        Sim/   \Não
        │ Login by Role   │           /     \
        └─────────────────┘    ┌─────▼─┐  ┌──▼──────────┐
                               │Direct │  │ Select      │
                               │Login  │  │ Institution │
                               └───────┘  └─────────────┘
                                    │            │
                                    └────┬───────┘
                                         │
                                 ┌───────▼────────┐
                                 │     SYSTEM     │
                                 │   (Gestão)     │
                                 └────────────────┘
```

## 🔐 Segurança e Multi-Tenancy

### Isolamento de Dados
Cada município deve ter:
- ✅ Banco de dados PostgreSQL separado
- ✅ API backend isolada (ou schema separado)
- ✅ Domínio próprio (ex: `municipio.grafoseducacional.com.br`)
- ✅ SSL/TLS obrigatório em produção

### Recomendações
1. **Banco Separado (Recomendado)**: Cada município = 1 banco PostgreSQL
2. **Schema Separado (Alternativa)**: Múltiplos schemas no mesmo servidor
3. **Tenant ID (Não Recomendado)**: Mesmas tabelas com campo municipalityId

## 📊 Fluxos de Acesso

### Site Principal (MAIN)
```
grafoseducacional.com.br
    ↓
Landing Page ("/")
    ↓
Escolher perfil
    ↓
Login
    ↓
Dashboard
```

### Municipal - Escola Única
```
santacruz.grafoseducacional.com.br
    ↓
Middleware redireciona
    ↓
/login/escola-municipal-central
    ↓
Login direto
    ↓
Dashboard
```

### Municipal - Múltiplas Escolas
```
santacruz.grafoseducacional.com.br
    ↓
Middleware redireciona
    ↓
/institutions
    ↓
Selecionar escola
    ↓
/login/{escola}
    ↓
Login
    ↓
Dashboard
```

## 🧪 Testes Realizados

### ✅ Testes de Integração
- [x] Redirecionamento correto em MAIN deployment
- [x] Redirecionamento correto em MUNICIPALITY deployment (com slug)
- [x] Redirecionamento correto em MUNICIPALITY deployment (sem slug)
- [x] Página de seleção de instituições funcional
- [x] Middleware não afeta rotas autenticadas
- [x] Rotas públicas continuam acessíveis

### ✅ Testes de Configuração
- [x] Variável DEPLOYMENT_TYPE funciona corretamente
- [x] DEFAULT_INSTITUTION_SLUG funciona quando definido
- [x] Sistema funciona sem DEFAULT_INSTITUTION_SLUG
- [x] Build do Next.js sem erros
- [x] Variáveis de ambiente corretamente lidas

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 📝 Notas de Migração

### Para Instâncias Existentes

Se você já tem uma instância do sistema rodando:

1. **Backup**: Faça backup completo do banco de dados
2. **Git Pull**: Atualize o código para a versão 2.0.0
3. **Env Variables**: Adicione as novas variáveis ao `.env.local`
4. **Rebuild**: Execute `npm run build` no frontend
5. **Test**: Teste o acesso antes de colocar em produção
6. **Deploy**: Siga o guia em `DEPLOYMENT.md`

### Compatibilidade

✅ **Totalmente retrocompatível**: Instâncias existentes continuam funcionando com `DEPLOYMENT_TYPE=MAIN`

## 🔄 Próximos Passos (Opcional)

Melhorias futuras que podem ser implementadas:

- [ ] Dashboard de gestão de múltiplas instâncias municipais
- [ ] Script automatizado de deploy de nova instância municipal
- [ ] Painel de monitoramento centralizado
- [ ] Sistema de white-label para personalização por município
- [ ] Multi-region support para melhor latência

## 📞 Suporte

Para dúvidas ou problemas:
- 📖 Veja `DEPLOYMENT.md` para guia completo
- 📧 Email: suporte@grafoseducacional.com.br
- 🐛 Issues: GitHub Issues

---

**✨ Implementação concluída com sucesso!**

Todas as funcionalidades estão operacionais e testadas. O sistema agora suporta completamente a separação entre site principal e instâncias municipais, permitindo que a Grafos expanda para múltiplos municípios com isolamento total de dados e personalização por região.
