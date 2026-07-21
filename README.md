# Sistema de Gestão Escolar

Sistema completo de gestão escolar com controle de usuários, turmas, matrículas, frequência, notas, banco de questões e muito mais.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Tipos de Implantação](#tipos-de-implantação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Executar](#como-executar)
- [Documentação](#documentação)
- [Funcionalidades](#funcionalidades)

---

## 🎯 Visão Geral

Este sistema foi desenvolvido para facilitar a gestão completa de instituições de ensino, oferecendo funcionalidades específicas para diferentes tipos de usuários:

- **Super Admin**: Gerenciamento de instituições e banco global de questões
- **Admin da Instituição**: Gestão completa da escola
- **Coordenador**: Acompanhamento pedagógico
- **Professor**: Lançamento de notas, frequência, conteúdos e atividades
- **Aluno**: Visualização de notas, frequência e materiais
- **Responsável**: Acompanhamento do desempenho dos filhos

---

## 🚀 Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **JWT** - Autenticação
- **Swagger** - Documentação da API

### Frontend
- **Next.js 16** - Framework React (App Router)
- **TypeScript** - Linguagem
- **TailwindCSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Formulários
- **React Query** - Cache e requisições
- **Headless UI** - Componentes acessíveis

---

## 🌐 Tipos de Implantação

O sistema Grafos suporta dois tipos de implantação:

### 1. **MAIN** - Site Principal Grafos
- Landing page completa para marketing
- Acesso a múltiplas instituições
- Cadastro de novas instituições
- URL exemplo: `https://grafoseducacional.com.br`

### 2. **MUNICIPALITY** - Instância Municipal
- **Separação total da landing page**
- Dedicado a um único município
- Múltiplas escolas/instituições por município
- Redirecionamento automático para login ou seleção de escola
- URL exemplo: `https://{municipio}.grafoseducacional.com.br`

**Configuração**:

```env
# .env.local (Frontend)

# Para site principal Grafos
NEXT_PUBLIC_DEPLOYMENT_TYPE=MAIN

# Para instância municipal
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=escola-municipal-central  # Opcional
```

📖 **Documentação completa**: Veja [DEPLOYMENT.md](./DEPLOYMENT.md) para guia detalhado de implantação municipal.

---

## 📁 Estrutura do Projeto

```
grafos/
├── api/                          # Backend NestJS
├── frontend/                     # Frontend Next.js (Sistema)
├── landing/                      # Landing Page (Site Principal)
│   ├── src/
│   │   ├── auth/                # Autenticação e autorização
│   │   ├── users/               # Gerenciamento de usuários
│   │   ├── institutions/        # Instituições
│   │   ├── academic-years/      # Anos letivos
│   │   ├── academic-periods/    # Períodos acadêmicos
│   │   ├── courses/             # Cursos
│   │   ├── subjects/            # Disciplinas
│   │   ├── classes/             # Turmas
│   │   ├── teachers/            # Professores
│   │   ├── students/            # Alunos
│   │   ├── parents/             # Responsáveis
│   │   ├── enrollments/         # Matrículas
│   │   ├── schedules/           # Horários
│   │   ├── attendances/         # Frequência
│   │   ├── lesson-contents/     # Conteúdos de aula
│   │   ├── lesson-plans/        # Planos de aula
│   │   ├── grades/              # Notas
│   │   ├── assignments/         # Trabalhos
│   │   ├── observations/        # Observações
│   │   ├── questions/           # Questões (banco)
│   │   ├── question-categories/ # Categorias de questões
│   │   ├── activities/          # Atividades impressas
│   │   ├── announcements/       # Comunicados
│   │   ├── notifications/       # Notificações
│   │   ├── events/              # Eventos
│   │   └── reports/             # Relatórios
│   ├── prisma/
│   │   └── schema.prisma        # Schema do banco de dados
│   └── package.json
│
├── frontend/                     # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Páginas de autenticação
│   │   │   │   ├── login/
│   │   │   │   └── select-profile/
│   │   │   └── (authenticated)/ # Páginas autenticadas
│   │   │       ├── admin/       # Área do administrador
│   │   │       │   ├── dashboard/
│   │   │       │   └── users/   # ✅ CRUD completo
│   │   │       ├── coordinator/ # Área do coordenador
│   │   │       ├── professor/   # Área do professor
│   │   │       ├── aluno/       # Área do aluno
│   │   │       └── pais/        # Área dos responsáveis
│   │   ├── components/
│   │   │   ├── ui/              # ✅ Componentes reutilizáveis
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   └── layout/          # Componentes de layout
│   │   ├── services/            # ✅ Serviços de API
│   │   │   ├── auth.service.ts
│   │   │   ├── users.service.ts
│   │   │   ├── academic-years.service.ts
│   │   │   ├── courses.service.ts
│   │   │   ├── subjects.service.ts
│   │   │   └── classes.service.ts
│   │   ├── types/               # ✅ Tipos TypeScript
│   │   │   ├── user.types.ts
│   │   │   ├── academic.types.ts
│   │   │   ├── course.types.ts
│   │   │   ├── subject.types.ts
│   │   │   ├── class.types.ts
│   │   │   └── common.types.ts
│   │   ├── stores/              # Gerenciamento de estado
│   │   │   └── authStore.ts
│   │   ├── lib/                 # Utilitários
│   │   │   ├── api.ts
│   │   │   ├── cookies.ts
│   │   │   └── utils.ts
│   │   └── contexts/            # Contextos React
│   │       └── AuthContext.tsx
│   └── package.json
│
├── FRONTEND_SCREENS_SPECS.md    # 📄 Especificação de telas
├── PROGRESSO_IMPLEMENTACAO.md   # 📊 Progresso da implementação
└── README.md                     # Este arquivo
```

---

## 🏃 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- npm

### Opção 1: Executar Todos os Projetos (Desenvolvimento Completo)

```bash
# Na raiz do projeto, instalar dependências de todos os projetos
npm run install:all

# Rodar todos os projetos simultaneamente
npm run dev

# Ou rodar individualmente:
npm run dev:api       # Backend (porta 3001)
npm run dev:frontend  # Sistema (porta 3000)
npm run dev:landing   # Landing (porta 3001)
```

**Serviços disponíveis:**
- 🔧 **API**: http://localhost:3001 (Swagger: http://localhost:3001/api)
- 💻 **Sistema**: http://localhost:3000 (Frontend principal)
- 🌐 **Landing**: http://localhost:3001 (Site de marketing)

### Opção 2: Executar Projetos Individualmente

#### 1. Backend (API)

```bash
cd api
npm install
cp .env.example .env
# Edite o .env com suas configurações

npx prisma generate
npx prisma migrate dev
npm run start:dev
```

#### 2. Frontend (Sistema de Gestão)

```bash
cd frontend
npm install
cp .env.example .env.local
# Configure DEPLOYMENT_TYPE=MAIN ou MUNICIPALITY

npm run dev
```

#### 3. Landing Page (Site Principal)

```bash
cd landing
npm install
cp .env.example .env.local
# Configure NEXT_PUBLIC_SISTEMA_URL

npm run dev
```

### 🚀 Build para Produção

```bash
# Build de todos os projetos
npm run build

# Iniciar todos em produção
npm start

# Ou individualmente:
npm run start:api
npm run start:frontend
npm run start:landing
```

---

## 📚 Documentação

### Documentação Disponível

- **[FRONTEND_SCREENS_SPECS.md](./FRONTEND_SCREENS_SPECS.md)** - Especificação completa de todas as telas organizadas por role de usuário
- **[PROGRESSO_IMPLEMENTACAO.md](./PROGRESSO_IMPLEMENTACAO.md)** - Status atual da implementação e próximos passos
- **Swagger API** - http://localhost:3001/api (quando o backend estiver rodando)

### Roles de Usuário

#### SUPER_ADMIN
- Gerencia múltiplas instituições
- Controla o banco global de questões
- Acesso total ao sistema

#### INSTITUTION_ADMIN
- Gerencia sua instituição
- Cria e gerencia usuários (professores, alunos, pais)
- Configura estrutura acadêmica (cursos, disciplinas, turmas)
- Gerencia anos letivos e períodos
- Visualiza relatórios

#### COORDINATOR
- Acompanhamento pedagógico
- Aprova planos de aula
- Visualiza notas e frequência
- Gerencia observações de alunos
- Gera relatórios pedagógicos

#### TEACHER
- Lança frequência
- Registra conteúdos de aula
- Lança notas
- Cria e corrige trabalhos
- Cria questões para o banco
- Gera atividades impressas
- Gerencia planos de aula

#### STUDENT
- Visualiza notas e histórico
- Consulta frequência
- Entrega trabalhos
- Acessa materiais didáticos
- Visualiza comunicados

#### PARENT
- Acompanha desempenho dos filhos
- Visualiza notas e frequência
- Recebe notificações
- Visualiza comunicados
- Acessa calendário escolar

---

## ✨ Funcionalidades

### ✅ Implementado

#### Autenticação e Segurança
- [x] Login por role (admin, professor, aluno, pais)
- [x] Login por instituição (URLs dinâmicas `/login/[slug]`)
- [x] Registro público com aprovação de admin
- [x] Seleção de perfil para usuários com múltiplos perfis
- [x] Proteção de rotas por role
- [x] Refresh token automático
- [x] Multi-tenant (mesmo email em diferentes instituições)

#### Gestão de Usuários
- [x] CRUD completo de Usuários
- [x] CRUD de Alunos
- [x] CRUD de Professores
- [x] CRUD de Responsáveis
- [x] CRUD de Coordenadores
- [x] Listagem com filtros e busca
- [x] Paginação
- [x] Aprovação de usuários pendentes

#### Estrutura Acadêmica
- [x] CRUD de Anos Letivos
- [x] CRUD de Períodos Acadêmicos
- [x] CRUD de Cursos
- [x] CRUD de Disciplinas
- [x] CRUD de Turmas
- [x] Sistema de Matrículas
- [x] Grade Horária
- [x] Atribuição de professores às disciplinas
- [x] Solicitações de disciplinas

#### Área do Professor
- [x] Dashboard com estatísticas
- [x] Lançamento de frequência
- [x] Registro de conteúdos de aula
- [x] Planos de aula (CRUD)
- [x] Lançamento de notas
- [x] Criação e correção de trabalhos
- [x] Banco de questões (criar e buscar)
- [x] Atividades impressas (worksheets)
- [x] Criação de simulados/provas
- [x] Observações de alunos
- [x] Rankings e gamificação

#### Área do Aluno
- [x] Dashboard personalizado
- [x] Visualização de notas por disciplina
- [x] Consulta de frequência
- [x] Grade horária
- [x] Lista de disciplinas
- [x] Realização de simulados
- [x] Visualização de resultados
- [x] Rankings e conquistas

#### Área do Responsável
- [x] Dashboard com resumo dos filhos
- [x] Seletor de filhos (múltiplos)
- [x] Visualização de notas dos filhos
- [x] Acompanhamento de frequência
- [x] Informações da turma

#### Área do Coordenador
- [x] Dashboard pedagógico
- [x] Aprovação de planos de aula
- [x] Gestão de observações
- [x] Monitoramento de turmas
- [x] Rankings e estatísticas
- [x] Solicitações de disciplinas

#### Super Admin
- [x] Dashboard do sistema
- [x] Banco global de questões
- [x] Categorias de questões
- [x] Gestão de instituições

#### Avaliações e Performance
- [x] Sistema completo de SAEB
- [x] Descritores SAEB
- [x] Simulados online
- [x] Sistema de IDEB
- [x] Metas de IDEB
- [x] Histórico de IDEB
- [x] Relatórios de desempenho

#### Comunicação
- [x] Sistema de comunicados
- [x] Notificações em tempo real
- [x] Calendário de eventos

#### Gamificação
- [x] Sistema de rankings
- [x] Conquistas (achievements)
- [x] Pontuação por atividades

#### Componentes UI
- [x] Sistema de design consistente
- [x] Componentes reutilizáveis
- [x] Dark mode
- [x] Responsivo (mobile-first)
- [x] Acessibilidade (WCAG 2.1)
- [x] SEO otimizado
- [x] PWA (Progressive Web App)
- [x] Busca elaborada de instituições

#### Performance e Otimização
- [x] Cache com Redis
- [x] Índices compostos no banco
- [x] Lazy loading de componentes
- [x] Otimização de queries

### 🚧 Em Desenvolvimento

- [ ] Sistema de chat entre usuários
- [ ] Exportação avançada de relatórios
- [ ] App mobile nativo
- [ ] Integração com sistemas externos

### 🎯 Próximas Melhorias

- [ ] Modo offline
- [ ] Notificações push
- [ ] Vídeo conferência integrada
- [ ] Biblioteca de recursos digitais
- [ ] Fórum de discussões

---

## 🔐 Segurança

- Autenticação JWT
- Proteção de rotas no frontend e backend
- Validação de permissões por role
- Guards personalizados no NestJS
- Sanitização de inputs
- Rate limiting
- CORS configurado
- Helmet para segurança HTTP

---

## 🎨 UI/UX

- Design responsivo (mobile-first)
- Dark mode
- Feedback visual em todas as ações
- Loading states
- Empty states
- Mensagens de erro amigáveis
- Animações suaves
- Acessibilidade (WCAG 2.1)

---

## 🧪 Testes

### Backend
```bash
cd api
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run test:cov     # Coverage
```

### Frontend
```bash
cd frontend
npm run test         # Tests
npm run test:watch   # Watch mode
```

---

## 📦 Build para Produção

### Backend
```bash
cd api
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

---

## 🤝 Contribuindo

1. Consulte [FRONTEND_SCREENS_SPECS.md](./FRONTEND_SCREENS_SPECS.md) para ver as telas planejadas
2. Consulte [PROGRESSO_IMPLEMENTACAO.md](./PROGRESSO_IMPLEMENTACAO.md) para ver o que está disponível para implementação
3. Escolha uma funcionalidade da lista
4. Implemente seguindo os padrões existentes
5. Teste localmente
6. Faça commit e push

---

## 📝 Convenções de Código

### TypeScript
- Use TypeScript estrito
- Evite `any`
- Use interfaces para objetos
- Use enums para valores fixos

### Componentes React
- Use componentes funcionais
- Use hooks
- Props devem ser tipadas
- Um componente por arquivo
- Nomes em PascalCase

### Estilos
- Use TailwindCSS
- Evite CSS inline
- Use classes utilitárias
- Tema escuro com dark: prefix

### Commits
- Use mensagens descritivas
- Prefira commits pequenos e frequentes
- Use conventional commits quando possível

---

## 🐛 Reportar Bugs

Se encontrar algum bug, por favor:

1. Verifique se já não foi reportado
2. Descreva o problema claramente
3. Inclua passos para reproduzir
4. Inclua screenshots se possível
5. Informe seu ambiente (OS, navegador, etc)

---

## 📞 Suporte

Para dúvidas ou suporte:
- Consulte a documentação
- Verifique os exemplos de código existentes
- Consulte a API Swagger

---

## 📄 Licença

Este projeto é proprietário e confidencial.

---

## 🎉 Agradecimentos

Desenvolvido com ❤️ para facilitar a gestão educacional.

---

**Última atualização**: 2025-01-18
**Versão**: 0.8.0 (MVP quase completo)
**Status**: 75% Completo
