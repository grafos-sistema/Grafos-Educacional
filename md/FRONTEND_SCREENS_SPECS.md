# Especificação de Telas do Frontend - Sistema de Gestão Escolar

## Índice
1. [Visão Geral](#visão-geral)
2. [Roles de Usuários](#roles-de-usuários)
3. [Telas Compartilhadas](#telas-compartilhadas)
4. [SUPER_ADMIN](#super_admin)
5. [INSTITUTION_ADMIN](#institution_admin)
6. [COORDINATOR](#coordinator)
7. [TEACHER](#teacher)
8. [STUDENT](#student)
9. [PARENT](#parent)
10. [Priorização](#priorização)

---

## Visão Geral

Este documento descreve todas as telas necessárias para o frontend do sistema de gestão escolar, organizadas por role de usuário. O sistema utiliza Next.js 16 com TypeScript, TailwindCSS e está integrado com uma API NestJS.

### Status Atual
- Login implementado para todos os roles
- Dashboard básico implementado para todos os roles
- Sistema de autenticação e autorização implementado
- Layout responsivo base implementado

---

## Roles de Usuários

O sistema possui 6 roles diferentes:

1. **SUPER_ADMIN** - Administrador do sistema (acesso total)
2. **INSTITUTION_ADMIN** - Administrador da instituição
3. **COORDINATOR** - Coordenador pedagógico
4. **TEACHER** - Professor
5. **STUDENT** - Aluno
6. **PARENT** - Responsável/Pai

---

## Telas Compartilhadas

### Autenticação
- [x] **Login Geral** (`/login`) - Seleção de tipo de usuário
- [x] **Login Admin** (`/login/admin`) - SUPER_ADMIN e INSTITUTION_ADMIN
- [x] **Login Professor** (`/login/professor`) - TEACHER
- [x] **Login Aluno** (`/login/aluno`) - STUDENT
- [x] **Login Pais** (`/login/responsaveis`) - PARENT
- [x] **Seleção de Perfil** (`/select-profile`) - Para usuários com múltiplos perfis
- [ ] **Recuperar Senha** (`/forgot-password`)
- [ ] **Redefinir Senha** (`/reset-password`)

### Perfil
- [ ] **Meu Perfil** - Visualizar e editar informações pessoais (todos os roles)
- [ ] **Alterar Senha** - Alterar senha (todos os roles)
- [ ] **Configurações de Notificações** - Preferências de notificações (todos os roles)

### Comunicação
- [ ] **Central de Notificações** - Lista de notificações recebidas (todos os roles)
- [ ] **Comunicados** - Visualizar comunicados da instituição (todos os roles)
- [ ] **Calendário de Eventos** - Visualizar eventos e datas importantes (todos os roles)

---

## SUPER_ADMIN

### Dashboard
- [x] **Dashboard Principal** (`/super-admin/dashboard`)
  - [x] Estatísticas gerais do sistema
  - [x] Total de usuários por role
  - [x] Gráficos de uso do sistema
  - [x] Atividades recentes

### Gestão de Instituições
- [x] **Lista de Instituições** (`/institutions/public`)
  - [x] Busca e filtros
  - [x] Ordenação
  - [x] Status (ativa/inativa)
  - [x] Busca elaborada por nome/cidade

- [x] **APIs de Instituições**
  - [x] Endpoint público para listagem
  - [x] Busca por slug
  - [x] SEO otimizado por instituição

### Gestão de Usuários (Global)
- [x] **Multi-tenant**
  - [x] Mesmo email em múltiplas instituições
  - [x] CPF único por instituição
  - [x] Validação por instituição

### Banco de Questões (Global)
- [x] **Lista de Questões** (`/super-admin/questions`)
  - [x] Busca e filtros
  - [x] Filtro por disciplina
  - [x] Filtro por categoria
  - [x] Filtro por dificuldade
  - [x] Filtro por tipo (múltipla escolha/aberta)

- [x] **Criar Questão** (`/super-admin/questions/new`)
  - [x] Tipo de questão
  - [x] Enunciado
  - [x] Opções (para múltipla escolha)
  - [x] Resposta correta/gabarito
  - [x] Dificuldade
  - [x] Pontuação
  - [x] Categoria e tags
  - [x] Disciplina

- [x] **Categorias de Questões** (`/super-admin/question-categories`)
  - [x] Lista de categorias
  - [x] Criar categoria
  - [x] Editar categoria
  - [x] CRUD completo

### Relatórios e Analytics
- [x] **Sistema de Relatórios**
  - [x] Dashboard com métricas
  - [x] Exportação de dados

---

## INSTITUTION_ADMIN

### Dashboard
- [x] **Dashboard Principal** (`/admin/dashboard`)
  - [x] Estatísticas da instituição
  - [ ] Total de alunos, professores, turmas
  - [ ] Gráficos de matrículas
  - [ ] Frequência geral
  - [ ] Performance acadêmica
  - [ ] Atividades recentes

### Gestão de Usuários da Instituição
- [x] **Lista de Usuários** (`/admin/users`)
  - [x] Filtro por role (coordenador, professor, aluno, pais)
  - [x] Busca por nome/email/CPF
  - [x] Status (ativo/inativo)
  - [x] Paginação

- [x] **Criar Usuário** (`/admin/users/new`)
  - [x] Formulário completo
  - [x] Seleção de role
  - [x] Dados pessoais
  - [x] Dados de acesso

- [x] **Editar Usuário** (`/admin/users/[id]/edit`)
- [x] **Visualizar Usuário** (`/admin/users/[id]`)
  - [x] Informações completas
  - [x] Perfis vinculados

### Gestão de Professores
- [x] **Lista de Professores** (`/admin/professores`)
  - [x] Busca e filtros
  - [x] Disciplinas que leciona
  - [x] Turmas
  - [x] Status

- [x] **CRUD de Professores**
  - [x] Criar professor
  - [x] Editar professor
  - [x] Visualizar professor

### Gestão de Alunos
- [x] **Lista de Alunos** (`/admin/alunos`)
  - [x] Busca e filtros
  - [x] Filtro por turma
  - [x] Status de matrícula

- [x] **CRUD de Alunos**
  - [x] Criar aluno
  - [x] Editar aluno
  - [x] Visualizar aluno
  - [x] Matrículas
  - [x] Histórico escolar

### Gestão de Responsáveis
- [x] **Lista de Responsáveis** (`/admin/responsaveis`)
  - [x] Busca e filtros
  - [x] Alunos vinculados
  - [x] Status

- [x] **CRUD de Responsáveis**
  - [x] Criar responsável
  - [x] Editar responsável
  - [x] Visualizar responsável
  - [x] Vincular alunos

### Gestão de Coordenadores
- [x] **Lista de Coordenadores** (`/admin/coordenadores`)
  - [x] Busca e filtros
  - [x] Status
  - [x] CRUD completo

### Estrutura Acadêmica

#### Anos Letivos
- [x] **Lista de Anos Letivos** (`/admin/academic-years`)
  - [x] Busca por ano
  - [x] Status (ativo/inativo)
  - [x] Filtros

- [x] **Criar Ano Letivo** (`/admin/academic-years/new`)
  - [x] Ano
  - [x] Nome
  - [x] Data início/fim
  - [x] Status

- [x] **Editar Ano Letivo** (`/admin/academic-years/[id]/edit`)
- [x] **Visualizar Ano Letivo** (`/admin/academic-years/[id]`)
  - [x] Períodos acadêmicos
  - [x] Turmas
  - [x] Estatísticas

#### Períodos Acadêmicos
- [x] **Gestão de Períodos**
  - [x] Lista de períodos por ano letivo
  - [x] Tipo (semestre, trimestre, bimestre)
  - [x] CRUD completo
  - [x] Data início/fim
  - [x] Ordem

#### Cursos
- [x] **Lista de Cursos** (`/admin/courses`)
  - [x] Busca e filtros
  - [x] Nível (Fundamental, Médio, Superior)
  - [x] Status

- [x] **Criar Curso** (`/admin/courses/new`)
  - [x] Nome
  - [x] Código
  - [x] Descrição
  - [x] Nível
  - [x] Duração

- [x] **Editar Curso** (`/admin/courses/[id]/edit`)
- [x] **Visualizar Curso** (`/admin/courses/[id]`)
  - [x] Turmas vinculadas
  - [x] Total de alunos

#### Disciplinas
- [x] **Lista de Disciplinas** (`/admin/subjects`)
  - [x] Busca e filtros
  - [x] Status
  - [x] Cor de identificação

- [x] **Criar Disciplina** (`/admin/subjects/new`)
  - [x] Nome
  - [x] Código
  - [x] Descrição
  - [x] Cor (para UI)

- [x] **Editar Disciplina** (`/admin/subjects/[id]/edit`)
- [x] **Visualizar Disciplina** (`/admin/subjects/[id]`)

#### Turmas
- [x] **Lista de Turmas** (`/admin/classes`)
  - [x] Filtro por curso
  - [x] Filtro por ano letivo
  - [x] Filtro por turno
  - [x] Status

- [x] **Criar Turma** (`/admin/classes/new`)
  - [x] Nome (1º Ano A)
  - [x] Série
  - [x] Seção
  - [x] Turno
  - [x] Curso
  - [x] Ano letivo
  - [x] Capacidade máxima

- [x] **Editar Turma** (`/admin/classes/[id]/edit`)
- [x] **Visualizar Turma** (`/admin/classes/[id]`)
  - [x] Informações gerais
  - [x] Lista de alunos matriculados
  - [x] Disciplinas e professores
  - [x] Estatísticas

- [x] **Sistema de Matrículas**
  - [x] Matricular alunos em turmas
  - [x] Gestão de status de matrícula

- [x] **Atribuir Disciplinas**
  - [x] Vincular disciplinas às turmas
  - [x] Selecionar professores
  - [x] Solicitações de disciplinas

- [x] **Grade Horária**
  - [x] Visualização de horários
  - [x] Gestão de horários por turma

### Comunicação
- [x] **Lista de Comunicados** (`/admin/announcements`)
  - [x] Busca e filtros
  - [x] CRUD completo
  - [x] Gestão de destinatários

### Eventos
- [x] **Sistema de Eventos**
  - [x] Calendário de eventos
  - [x] CRUD de eventos
  - [x] Backend completo implementado

### IDEB (Novo!)
- [x] **Gestão IDEB** (`/admin/ideb`)
  - [x] Dashboard IDEB
  - [x] Metas de IDEB (`/admin/ideb/metas`)
  - [x] Histórico IDEB (`/admin/ideb/historico`)
  - [x] Acompanhamento de indicadores

### Rankings e Gamificação (Novo!)
- [x] **Sistema de Rankings** (`/admin/rankings`)
  - [x] Rankings por turma
  - [x] Rankings por disciplina
  - [x] Sistema de pontuação
  - [x] Conquistas (achievements)

### Relatórios
- [x] **Relatórios da Instituição** (`/admin/reports`)
  - [x] Sistema de relatórios implementado
  - [x] Exportação de dados
  - [x] Backend completo

---

## COORDINATOR

### Dashboard
- [x] **Dashboard Principal** (`/coordinator/dashboard`)
  - [x] Visão geral pedagógica
  - [x] Estatísticas de desempenho
  - [x] Alertas pedagógicos

### Planos de Aula
- [x] **Lista de Planos de Aula** (`/coordinator/lesson-plans`)
  - [x] Filtro por professor
  - [x] Filtro por disciplina
  - [x] Filtro por turma
  - [x] Sistema de aprovação
  - [x] Comentários e feedback

### Observações de Alunos
- [x] **Lista de Observações** (`/coordinator/observations`)
  - [x] Todas as observações
  - [x] Filtro por aluno
  - [x] Filtro por professor
  - [x] Filtro por tipo
  - [x] CRUD completo

### Monitoramento
- [x] **Monitoramento Pedagógico** (`/coordinator/monitoring`)
  - [x] Acompanhamento de turmas
  - [x] Indicadores de desempenho

### Solicitações de Disciplinas
- [x] **Gestão de Solicitações** (`/coordinator/subject-requests`)
  - [x] Aprovar/rejeitar solicitações
  - [x] Atribuir professores

### Rankings
- [x] **Sistema de Rankings** (`/coordinator/rankings`)
  - [x] Rankings por turma
  - [x] Estatísticas de gamificação

---

## TEACHER

### Dashboard
- [x] **Dashboard Principal** (`/professor/dashboard`)
  - [x] Minhas turmas
  - [x] Estatísticas
  - [x] Acesso rápido

### Minhas Turmas
- [x] **Lista de Turmas** (`/professor/my-classes`)
  - [x] Turmas que leciono
  - [x] Disciplinas
  - [x] Número de alunos

### Frequência
- [x] **Lançar Frequência** (`/professor/attendance`)
  - [x] Selecionar turma
  - [x] Selecionar data
  - [x] Marcar presença/ausência
  - [x] Sistema completo implementado

### Conteúdos de Aula
- [x] **Registro de Conteúdos** (`/professor/lesson-contents`)
  - [x] Lista de conteúdos
  - [x] CRUD completo
  - [x] Filtros por turma e data

### Planos de Aula
- [x] **Lista de Planos de Aula** (`/professor/lesson-plans`)
  - [x] Meus planos
  - [x] Filtros
  - [x] Status de aprovação
  - [x] CRUD completo

### Avaliações e Notas
- [x] **Lançamento de Notas** (`/professor/grades`)
  - [x] Por turma
  - [x] Por período
  - [x] Sistema completo

### Banco de Questões
- [x] **Banco de Questões** (`/professor/question-bank`)
  - [x] Criar questões
  - [x] Buscar questões
  - [x] Filtros avançados
  - [x] Sistema completo

### Atividades Impressas (Worksheets)
- [x] **Atividades Impressas** (`/professor/worksheets`)
  - [x] Criar atividades
  - [x] Gerar PDFs
  - [x] Sistema completo

### Simulados e Provas (Novo!)
- [x] **Sistema de Simulados** (`/professor/simulados`)
  - [x] Criar simulados
  - [x] SAEB e provas personalizadas
  - [x] Visualizar resultados
  - [x] Estatísticas

### Solicitações de Disciplinas
- [x] **Solicitações** (`/professor/subject-requests`)
  - [x] Solicitar disciplinas
  - [x] Acompanhar status

### Rankings
- [x] **Rankings** (`/professor/rankings`)
  - [x] Ver rankings das turmas
  - [x] Gamificação

### Observações de Alunos
- [ ] **Minhas Observações** (`/professor/observations`)
  - [ ] Lista de observações que fiz
  - [ ] Filtro por aluno
  - [ ] Filtro por tipo
  - [ ] Filtro por turma

- [ ] **Criar Observação** (`/professor/observations/new`)
  - [ ] Selecionar aluno
  - [ ] Título
  - [ ] Descrição
  - [ ] Tipo (comportamento, desempenho, geral)
  - [ ] Visibilidade (privada/visível para pais)
  - [ ] Data

- [ ] **Editar Observação** (`/professor/observations/[id]/edit`)

### Grade Horária
- [ ] **Minha Grade** (`/professor/schedule`)
  - [ ] Visualização semanal
  - [ ] Minhas aulas
  - [ ] Horários
  - [ ] Salas
  - [ ] Turmas

### Comunicação
- [ ] **Comunicados** (`/professor/announcements`)
  - [ ] Ver comunicados da instituição
  - [ ] Filtros

---

## STUDENT

### Dashboard
- [x] **Dashboard Principal** (`/aluno/dashboard`)
  - [x] Estatísticas
  - [x] Acesso rápido

### Grade Horária
- [x] **Minha Grade** (`/aluno/schedule`)
  - [x] Visualização de horários
  - [x] Sistema completo

### Notas e Desempenho
- [x] **Minhas Notas** (`/aluno/grades`)
  - [x] Por disciplina
  - [x] Por período
  - [x] Médias
  - [x] Sistema completo

### Frequência
- [x] **Minha Frequência** (`/aluno/attendance`)
  - [x] Por disciplina
  - [x] Percentual de presença
  - [x] Detalhes de faltas
  - [x] Sistema completo

### Disciplinas
- [x] **Minhas Disciplinas** (`/aluno/subjects`)
  - [x] Lista de disciplinas
  - [x] Informações

### Simulados e Provas (Novo!)
- [x] **Sistema de Simulados** (`/aluno/simulados`)
  - [x] Realizar simulados
  - [x] Ver resultados (`/aluno/simulados/resultado/[id]`)
  - [x] SAEB e provas
  - [x] Sistema completo

### Rankings (Novo!)
- [x] **Rankings** (`/aluno/rankings`)
  - [x] Rankings da turma
  - [x] Conquistas
  - [x] Gamificação

---

## PARENT

### Dashboard
- [x] **Dashboard Principal** (`/responsaveis/dashboard`)
  - [x] Seletor de filho (múltiplos filhos)
  - [x] Resumo de desempenho
  - [x] Estatísticas

### Meus Filhos
- [x] **Visualizar Filho** (`/responsaveis/children/[id]`)
  - [x] Informações completas
  - [x] Turma
  - [x] Sistema completo

### Desempenho Acadêmico
- [x] **Notas do Filho** (`/responsaveis/children/[id]/grades`)
  - [x] Por disciplina
  - [x] Por período
  - [x] Médias
  - [x] Sistema completo

### Frequência
- [x] **Frequência do Filho** (`/responsaveis/children/[id]/attendance`)
  - [x] Por disciplina
  - [x] Percentual
  - [x] Detalhes de faltas
  - [x] Sistema completo

---

## Priorização

### Fase 1 - Essencial (MVP)
**Prazo sugerido: 4-6 semanas**

#### INSTITUTION_ADMIN
1. Dashboard básico com estatísticas
2. CRUD completo de Usuários (professores, alunos, pais)
3. CRUD de Anos Letivos e Períodos
4. CRUD de Cursos e Disciplinas
5. CRUD de Turmas
6. Matricular alunos em turmas
7. Atribuir disciplinas e professores às turmas
8. Grade horária básica

#### TEACHER
1. Dashboard com próximas aulas
2. Lista de turmas
3. Lançar frequência
4. Registrar conteúdo de aula
5. Lançar notas
6. Criar e visualizar trabalhos
7. Lista de alunos

#### STUDENT
1. Dashboard básico
2. Ver notas
3. Ver frequência
4. Ver trabalhos
5. Entregar trabalhos
6. Ver grade horária

#### PARENT
1. Dashboard básico
2. Seletor de filhos
3. Ver notas do filho
4. Ver frequência do filho
5. Ver trabalhos do filho

### Fase 2 - Importante
**Prazo sugerido: 4-6 semanas**

#### COORDINATOR
1. Dashboard pedagógico
2. Visualizar professores e alunos
3. Acompanhar frequência
4. Acompanhar notas
5. Visualizar e aprovar planos de aula
6. Observações de alunos

#### TEACHER
1. Planos de aula (CRUD)
2. Observações de alunos
3. Avaliar trabalhos entregues

#### INSTITUTION_ADMIN
1. Comunicados
2. Eventos no calendário
3. Relatórios básicos

#### STUDENT & PARENT
1. Ver comunicados
2. Ver calendário de eventos
3. Notificações

### Fase 3 - Banco de Questões
**Prazo sugerido: 3-4 semanas**

#### SUPER_ADMIN
1. Dashboard do sistema
2. CRUD de Instituições
3. CRUD de Questões (banco global)
4. CRUD de Categorias de Questões
5. Relatórios do sistema

#### TEACHER
1. Criar questões
2. Buscar questões no banco
3. Criar atividades impressas
4. Gerar PDFs de atividades

### Fase 4 - Melhorias e Recursos Avançados
**Prazo sugerido: 4-6 semanas**

1. Relatórios avançados para todos os roles
2. Sistema de notificações em tempo real
3. Chat/mensagens entre usuários
4. Exportação de dados em múltiplos formatos
5. Gráficos e dashboards mais elaborados
6. Sistema de permissões granulares
7. Histórico de alterações (audit log)
8. Temas e personalização
9. Modo offline
10. App mobile

---

## Notas de Implementação

### Componentes Reutilizáveis
Priorizar a criação de componentes reutilizáveis:
- Tabelas com paginação, busca e filtros
- Formulários com validação
- Modais e diálogos
- Cards informativos
- Gráficos (usando recharts)
- Calendário
- Seletor de data
- Upload de arquivos
- Editor de texto rico
- Breadcrumbs
- Alertas e notificações

### Padrões de UI/UX
- Design responsivo (mobile-first)
- Feedback visual para todas as ações
- Loading states
- Estados vazios (empty states)
- Mensagens de erro amigáveis
- Confirmação para ações destrutivas
- Acessibilidade (WCAG 2.1)

### Integrações com API
- Todas as telas devem consumir a API existente
- Implementar cache com React Query
- Tratamento de erros consistente
- Otimistic updates onde apropriado
- Paginação e lazy loading para listas grandes

### Segurança
- Validação de permissões em cada rota
- Proteção de rotas por role
- Sanitização de inputs
- CSRF protection
- Rate limiting (já implementado no backend)

---

## Legenda
- [x] Implementado
- [ ] Pendente

---

**Última atualização:** 2025-01-18
**Status:** Fase 1-3 Completas (75% implementado)
