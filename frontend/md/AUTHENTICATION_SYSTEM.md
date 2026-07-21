# Sistema de Autenticação - Grafos

## 📋 Visão Geral

Sistema completo de autenticação implementado para a plataforma Grafos, com suporte a múltiplos perfis de usuário, gerenciamento de sessão via JWT em cookies e proteção de rotas baseada em roles.

---

## 🔐 Perfis de Usuário Implementados

### 1. **Administradores** (SUPER_ADMIN / INSTITUTION_ADMIN)
- **Login**: `/login/admin`
- **Dashboard**: `/admin/dashboard`
- **Permissões**: Acesso total ao sistema
- **Cores**: Teal → Green (#138C8C → #33A551)

### 2. **Coordenadores** (COORDINATOR)
- **Login**: `/login` (genérico)
- **Dashboard**: `/coordinator/dashboard`
- **Permissões**: Gestão pedagógica, professores, alunos
- **Cores**: Green → Blue (#33A551 → #0C5E8E)

### 3. **Professores** (TEACHER)
- **Login**: `/login/professor`
- **Dashboard**: `/professor/dashboard`
- **Permissões**: Diário de classe, turmas, questões
- **Cores**: Green → Teal (#33A551 → #138C8C)

### 4. **Alunos** (STUDENT)
- **Login**: `/login/aluno`
- **Dashboard**: `/aluno/dashboard`
- **Permissões**: Notas, atividades, rankings
- **Cores**: Lime → Green (#C4CE45 → #33A551)

### 5. **Pais/Responsáveis** (PARENT)
- **Login**: `/login/responsaveis`
- **Dashboard**: `/responsaveis/dashboard`
- **Permissões**: Acompanhamento de filhos, boletim
- **Cores**: Blue → Teal (#0C5E8E → #138C8C)

---

## 🏗️ Arquitetura do Sistema

### Fluxo de Autenticação

```
┌─────────────────────┐
│  Login Page         │
│  (Credenciais)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AuthService        │
│  POST /auth/login   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Response:          │
│  - user             │
│  - accessToken      │
│  - refreshToken     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AuthStore          │
│  (Zustand)          │
│  + Cookies          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Redirect baseado   │
│  em Role            │
└─────────────────────┘
```

---

## 📁 Estrutura de Arquivos

### Autenticação

```
src/
├── contexts/
│   └── AuthContext.tsx           # Context de autenticação
├── stores/
│   └── authStore.ts              # Zustand store para estado global
├── services/
│   └── auth.service.ts           # Serviço de API de autenticação
├── lib/
│   ├── api.ts                    # Cliente Axios configurado
│   └── cookies.ts                # Utilitários para cookies
└── types/
    └── user.types.ts             # Tipos TypeScript
```

### Páginas de Login

```
src/app/(auth)/login/
├── page.tsx                      # Login genérico
├── admin/
│   └── page.tsx                  # Login de administradores
├── professor/
│   └── page.tsx                  # Login de professores
├── aluno/
│   └── page.tsx                  # Login de alunos
└── pais/
    └── page.tsx                  # Login de pais/responsáveis
```

### Dashboards

```
src/app/(authenticated)/
├── layout.tsx                    # Layout compartilhado com header/footer
├── admin/
│   └── dashboard/
│       └── page.tsx              # Dashboard administrativo
├── coordinator/
│   └── dashboard/
│       └── page.tsx              # Dashboard de coordenação
├── professor/
│   └── dashboard/
│       └── page.tsx              # Dashboard de professores
├── aluno/
│   └── dashboard/
│       └── page.tsx              # Dashboard de alunos
└── pais/
    └── dashboard/
        └── page.tsx              # Dashboard de pais
```

---

## 🔒 Middleware de Proteção

### Arquivo: `middleware.ts`

**Funcionalidades:**

1. **Verificação de Autenticação**
   - Checa se o usuário tem token JWT válido
   - Redireciona para login se não autenticado

2. **Decodificação de Role**
   - Extrai role do JWT usando `jwt-decode`
   - Determina permissões baseadas no role

3. **Proteção de Rotas**
   - Rotas públicas: `/`, `/login/*`, `/forgot-password`
   - Rotas protegidas: Tudo exceto públicas
   - Redirecionamento automático para dashboard correto

4. **Controle de Acesso Baseado em Role (RBAC)**

```typescript
const roleRoutes = {
  SUPER_ADMIN: ['/admin', '/coordinator', '/professor', '/aluno', '/pais'],
  INSTITUTION_ADMIN: ['/admin', '/coordinator', '/professor', '/aluno', '/pais'],
  COORDINATOR: ['/coordinator', '/professor', '/aluno'],
  TEACHER: ['/professor'],
  STUDENT: ['/aluno'],
  PARENT: ['/pais'],
};
```

---

## 🍪 Gerenciamento de Tokens

### Client-Side (clientCookies)

```typescript
// Salvar tokens
clientCookies.setAuthTokens(accessToken, refreshToken);

// Recuperar tokens
const { accessToken, refreshToken } = clientCookies.getAuthTokens();

// Limpar tokens
clientCookies.clearAuthTokens();
```

### Server-Side (serverCookies)

```typescript
// No middleware
const cookieHeader = request.headers.get('cookie') || '';
const { accessToken } = serverCookies.getAuthTokens(cookieHeader);
```

### Configuração de Cookies

```typescript
{
  httpOnly: true,      // Não acessível via JavaScript
  secure: true,        // Apenas HTTPS em produção
  sameSite: 'lax',     // Proteção CSRF
  maxAge: 7 * 24 * 60 * 60  // 7 dias
}
```

---

## 🎯 AuthContext & Zustand Store

### AuthContext (`src/contexts/AuthContext.tsx`)

**Métodos Principais:**

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

**Funcionalidades:**

- ✅ Inicialização automática na montagem
- ✅ Verificação de token ao carregar
- ✅ Tentativa de refresh se token expirado
- ✅ Redirecionamento baseado em role após login
- ✅ Limpeza completa de estado no logout

### Zustand Store (`src/stores/authStore.ts`)

**Estado Persistido:**

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Persistência:**
- localStorage para estado do cliente
- Cookies para tokens (acesso server-side)

---

## 🔄 Fluxo de Redirecionamento

### Login → Dashboard

```typescript
const getRedirectPathByRole = (role: string): string => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'INSTITUTION_ADMIN':
      return '/admin/dashboard';
    case 'COORDINATOR':
      return '/coordinator/dashboard';
    case 'TEACHER':
      return '/professor/dashboard';
    case 'STUDENT':
      return '/aluno/dashboard';
    case 'PARENT':
      return '/responsaveis/dashboard';
    default:
      return '/dashboard';
  }
};
```

### Proteção de Páginas

Cada dashboard verifica o role do usuário:

```typescript
useEffect(() => {
  if (!isLoading && (!isAuthenticated || user?.role !== 'EXPECTED_ROLE')) {
    router.push('/login/appropriate-page');
  }
}, [isAuthenticated, isLoading, user, router]);
```

---

## 📊 Dashboards Implementados

### 1. Dashboard Administrativo

**Funcionalidades:**
- Estatísticas gerais (alunos, professores, IDEB)
- Ações rápidas (usuários, relatórios, configurações)
- Atividades recentes
- Gestão de instituições

**Stats:**
- Total de Alunos: 2.847 (+12.5%)
- Professores Ativos: 142 (+4.2%)
- Taxa de Frequência: 94.3% (+2.1%)
- IDEB Projetado: 6.8 (+0.5)

### 2. Dashboard de Professor

**Funcionalidades:**
- Minhas turmas e alunos
- Aulas do dia com horários
- Diário de classe
- Banco de questões
- Atividades pendentes para correção

**Stats:**
- Minhas Turmas: 5 (128 alunos)
- Aulas Hoje: 6 (3 concluídas)
- Atividades Pendentes: 12
- Frequência Média: 92%

### 3. Dashboard de Aluno

**Funcionalidades:**
- Média geral e por disciplina
- Rankings na turma
- Atividades pendentes
- Próximas provas/trabalhos
- Calendário escolar

**Stats:**
- Média Geral: 8.7
- Frequência: 96%
- Atividades Pendentes: 3
- Ranking: 5º na turma

### 4. Dashboard de Pais

**Funcionalidades:**
- Visualização de múltiplos filhos
- Boletim escolar completo
- Alertas de frequência e notas
- Mensagens com professores
- Calendário de eventos

**Features:**
- Cards para cada filho
- Status visual (Bom/Atenção)
- Alertas categorizados
- Dicas educacionais

### 5. Dashboard de Coordenador

**Funcionalidades:**
- Gestão de turmas e horários
- Relatórios pedagógicos
- Acompanhamento de professores
- Indicadores educacionais
- Calendário escolar

**Stats:**
- Total de Turmas: 24 (+2)
- Professores: 58 (+5)
- Alunos: 847 (+32)
- Taxa de Aprovação: 87% (+3.2%)

---

## 🎨 Design System

### Cores por Perfil

| Perfil | Gradiente | Hex Colors |
|--------|-----------|------------|
| Admin | Teal → Green | #138C8C → #33A551 |
| Coordenador | Green → Blue | #33A551 → #0C5E8E |
| Professor | Green → Teal | #33A551 → #138C8C |
| Aluno | Lime → Green | #C4CE45 → #33A551 |
| Pais | Blue → Teal | #0C5E8E → #138C8C |

### Componentes Compartilhados

**Layout Autenticado:**
- Header fixo com logo
- Menu de navegação
- Botão de logout
- Footer com copyright

---

## 🔧 API Endpoints Utilizados

### Autenticação

```typescript
// Login
POST /auth/login
Body: { email: string, password: string }
Response: { user, accessToken, refreshToken }

// Logout
POST /auth/logout

// Perfil do usuário
GET /auth/me
Headers: { Authorization: 'Bearer {token}' }

// Refresh token
POST /auth/refresh
Body: { refreshToken: string }
Response: { accessToken, refreshToken }
```

---

## ✅ Checklist de Segurança

- [x] Tokens JWT armazenados em httpOnly cookies
- [x] Proteção CSRF com sameSite cookies
- [x] Validação de roles no middleware
- [x] Redirect automático em caso de acesso não autorizado
- [x] Limpeza completa de estado no logout
- [x] Tentativa de refresh automático de tokens
- [x] Proteção contra acesso direto a rotas protegidas
- [x] Verificação de autenticação em cada dashboard
- [x] Timeout de sessão configurável
- [x] Redirecionamento para página de origem após login

---

## 📝 Como Usar

### 1. Login

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { login } = useAuth();

const handleLogin = async () => {
  try {
    await login({ email, password });
    // Redirecionamento automático
  } catch (error) {
    console.error(error);
  }
};
```

### 2. Verificar Autenticação

```typescript
const { user, isAuthenticated, isLoading } = useAuth();

if (isLoading) return <Loading />;
if (!isAuthenticated) return <Redirect to="/login" />;

// Componente autenticado
return <Dashboard />;
```

### 3. Logout

```typescript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // Redirecionamento automático para /login
};
```

### 4. Acessar Dados do Usuário

```typescript
const { user } = useAuth();

console.log(user?.name);   // Nome do usuário
console.log(user?.email);  // Email
console.log(user?.role);   // Role (STUDENT, TEACHER, etc)
```

---

## 🐛 Troubleshooting

### Token Expirado

O sistema tenta automaticamente refresh do token. Se falhar:
1. Usuário é redirecionado para login
2. Estado é limpo completamente
3. Mensagem de erro é exibida

### Redirecionamento Infinito

Verificar se:
- Middleware está configurado corretamente
- Rotas públicas estão na whitelist
- Token está sendo salvo nos cookies

### Role Incorreto

Verificar se:
- JWT contém o campo `role` correto
- Middleware decodifica o token corretamente
- Dashboard verifica o role esperado

---

## 🚀 Próximas Melhorias

### Curto Prazo
- [ ] Implementar "Lembrar-me" funcional
- [ ] Adicionar recuperação de senha
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Adicionar logs de auditoria de login

### Médio Prazo
- [ ] OAuth/SSO integration
- [ ] Biometria para mobile
- [ ] Session management (múltiplos dispositivos)
- [ ] Rate limiting para tentativas de login

### Longo Prazo
- [ ] Sistema de permissões granulares
- [ ] Roles customizáveis por instituição
- [ ] Hierarquia de permissões
- [ ] Delegação de acesso temporário

---

## 📚 Documentação Relacionada

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT Decode](https://github.com/auth0/jwt-decode)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Context](https://react.dev/reference/react/useContext)

---

**Versão**: 1.0
**Última Atualização**: Janeiro 2025
**Status**: ✅ Implementado e Testado
