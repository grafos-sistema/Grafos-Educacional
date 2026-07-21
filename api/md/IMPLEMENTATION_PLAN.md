# 📋 Plano de Implementação Completo - Sistema de Gestão Escolar

## 🎯 Visão Geral
Sistema completo de gestão escolar com autenticação JWT, controle de acesso baseado em roles (RBAC), documentação Swagger e API RESTful.

---

## 📦 FASE 1: Configuração Base e Infraestrutura

### 1.1 Configuração Inicial
- [X] Configurar variáveis de ambiente (.env)
- [X] Configurar Prisma Client e gerar tipos
- [X] Executar migrations do banco de dados
- [X] Criar PrismaModule e PrismaService
- [X] Configurar ConfigModule (@nestjs/config)
- [X] Configurar validação global (class-validator)
- [X] Configurar serialização global (class-transformer)

### 1.2 Documentação Swagger
- [X] Instalar @nestjs/swagger
- [X] Configurar Swagger no main.ts
- [X] Criar decorators customizados para documentação
- [X] Configurar Bearer Authentication no Swagger
- [X] Configurar tags e grupos de endpoints

### 1.3 Configuração de Segurança
- [X] Configurar CORS
- [X] Configurar Helmet para segurança HTTP
- [X] Configurar rate limiting (Throttler)
- [X] Configurar validação de entrada global
- [X] Configurar tratamento global de erros (Exception Filters)

---

## 🔐 FASE 2: Autenticação e Autorização

### 2.1 Módulo de Autenticação (Auth)
- [X] Criar AuthModule
- [X] Criar AuthService (login, register, refresh token)
- [X] Criar AuthController
- [X] Implementar hash de senha com bcrypt
- [X] Implementar geração de JWT tokens (access + refresh)
- [X] Criar DTOs de autenticação (LoginDto, RegisterDto)
- [X] Documentar endpoints de auth no Swagger

### 2.2 Guards e Estratégias JWT
- [X] Criar JwtStrategy (Passport)
- [X] Criar JwtAuthGuard
- [X] Criar RolesGuard (verificação de roles)
- [X] Criar decorator @Roles(...roles)
- [X] Criar decorator @CurrentUser()
- [X] Criar decorator @Public() para rotas públicas
- [X] Configurar guards globais

### 2.3 Controle de Acesso (RBAC)
- [X] Implementar verificação de roles por endpoint
- [X] Implementar verificação de ownership (usuário só acessa seus dados)
- [X] Implementar verificação de instituição (multi-tenant)
- [X] Criar guards específicos:
  - [X] SuperAdminGuard
  - [X] InstitutionAdminGuard
  - [X] TeacherGuard
  - [X] StudentGuard
  - [X] ParentGuard

---

## 👥 FASE 3: Módulos de Usuários e Perfis

### 3.1 Módulo de Instituições (Institutions)
- [X] Criar InstitutionsModule
- [X] Criar InstitutionsService (CRUD)
- [X] Criar InstitutionsController
- [X] Criar DTOs (CreateInstitutionDto, UpdateInstitutionDto)
- [X] Implementar filtros e paginação
- [X] Implementar validações de CNPJ
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /institutions (SUPER_ADMIN)
- [X] GET /institutions (SUPER_ADMIN)
- [X] GET /institutions/:id (SUPER_ADMIN, INSTITUTION_ADMIN)
- [X] PATCH /institutions/:id (SUPER_ADMIN, INSTITUTION_ADMIN)
- [X] DELETE /institutions/:id (SUPER_ADMIN)

### 3.2 Módulo de Usuários (Users)
- [X] Criar UsersModule
- [X] Criar UsersService (CRUD)
- [X] Criar UsersController
- [X] Criar DTOs (CreateUserDto, UpdateUserDto, ChangePasswordDto)
- [X] Implementar upload de avatar
- [X] Implementar validações de CPF
- [X] Implementar filtros por role e instituição
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /users (SUPER_ADMIN, INSTITUTION_ADMIN)
- [X] GET /users (filtros por role, instituição)
- [X] GET /users/me (usuário autenticado)
- [X] GET /users/:id
- [X] PATCH /users/:id
- [X] POST /users/:id/change-password
- [X] DELETE /users/:id
- [X] POST /users/:id/avatar

### 3.3 Módulo de Professores (Teachers)
- [X] Criar TeachersModule
- [X] Criar TeachersService (CRUD + lógica específica)
- [X] Criar TeachersController
- [X] Criar DTOs (CreateTeacherDto, UpdateTeacherDto)
- [X] Implementar listagem de turmas do professor
- [X] Implementar listagem de disciplinas
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /teachers
- [X] GET /teachers
- [X] GET /teachers/:id
- [X] GET /teachers/:id/classes
- [X] GET /teachers/:id/subjects
- [X] PATCH /teachers/:id
- [X] DELETE /teachers/:id

### 3.4 Módulo de Alunos (Students)
- [X] Criar StudentsModule
- [X] Criar StudentsService (CRUD + lógica específica)
- [X] Criar StudentsController
- [X] Criar DTOs (CreateStudentDto, UpdateStudentDto)
- [X] Implementar matrícula em turmas
- [X] Implementar listagem de notas
- [X] Implementar listagem de faltas
- [X] Implementar relatório de desempenho
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /students
- [X] GET /students
- [X] GET /students/:id
- [X] GET /students/:id/grades
- [X] GET /students/:id/attendances
- [X] GET /students/:id/report
- [X] PATCH /students/:id
- [X] DELETE /students/:id

### 3.5 Módulo de Pais/Responsáveis (Parents)
- [X] Criar ParentsModule
- [X] Criar ParentsService (CRUD + lógica específica)
- [X] Criar ParentsController
- [X] Criar DTOs (CreateParentDto, UpdateParentDto, LinkStudentDto)
- [X] Implementar vinculação com alunos
- [X] Implementar listagem de filhos
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /parents
- [X] GET /parents
- [X] GET /parents/:id
- [X] GET /parents/:id/students
- [X] POST /parents/:id/students
- [X] DELETE /parents/:id/students/:studentId
- [X] PATCH /parents/:id
- [X] DELETE /parents/:id

---

## 🏫 FASE 4: Estrutura Acadêmica

### 4.1 Módulo de Anos Letivos (Academic Years)
- [X] Criar AcademicYearsModule
- [X] Criar AcademicYearsService
- [X] Criar AcademicYearsController
- [X] Criar DTOs
- [X] Implementar validação de datas
- [X] Implementar ativação/desativação de ano letivo
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /academic-years
- [X] GET /academic-years
- [X] GET /academic-years/:id
- [X] GET /academic-years/active
- [X] PATCH /academic-years/:id
- [X] DELETE /academic-years/:id

### 4.2 Módulo de Períodos Acadêmicos (Academic Periods)
- [X] Criar AcademicPeriodsModule
- [X] Criar AcademicPeriodsService
- [X] Criar AcademicPeriodsController
- [X] Criar DTOs
- [X] Implementar validação de datas e ordem
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /academic-periods
- [X] GET /academic-periods
- [X] GET /academic-periods/:id
- [X] PATCH /academic-periods/:id
- [X] DELETE /academic-periods/:id

### 4.3 Módulo de Cursos (Courses)
- [X] Criar CoursesModule
- [X] Criar CoursesService
- [X] Criar CoursesController
- [X] Criar DTOs
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /courses
- [X] GET /courses
- [X] GET /courses/:id
- [X] PATCH /courses/:id
- [X] DELETE /courses/:id

### 4.4 Módulo de Disciplinas (Subjects)
- [X] Criar SubjectsModule
- [X] Criar SubjectsService
- [X] Criar SubjectsController
- [X] Criar DTOs
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /subjects
- [X] GET /subjects
- [X] GET /subjects/:id
- [X] PATCH /subjects/:id
- [X] DELETE /subjects/:id

### 4.5 Módulo de Turmas (Classes)
- [X] Criar ClassesModule
- [X] Criar ClassesService
- [X] Criar ClassesController
- [X] Criar DTOs
- [X] Implementar listagem de alunos matriculados
- [X] Implementar listagem de disciplinas
- [X] Implementar grade horária
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /classes
- [X] GET /classes
- [X] GET /classes/:id
- [X] GET /classes/:id/students
- [X] GET /classes/:id/subjects
- [X] GET /classes/:id/schedule
- [X] PATCH /classes/:id
- [X] DELETE /classes/:id

### 4.6 Módulo de Matrículas (Enrollments)
- [X] Criar EnrollmentsModule
- [X] Criar EnrollmentsService
- [X] Criar EnrollmentsController
- [X] Criar DTOs
- [X] Implementar validação de capacidade da turma
- [X] Implementar transferência de turma
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /enrollments (matricular aluno)
- [X] GET /enrollments
- [X] GET /enrollments/:id
- [X] PATCH /enrollments/:id/transfer (transferir turma)
- [X] DELETE /enrollments/:id (cancelar matrícula)

### 4.7 Módulo de Grade Horária (Schedules)
- [X] Criar SchedulesModule
- [X] Criar SchedulesService
- [X] Criar SchedulesController
- [X] Criar DTOs
- [X] Implementar validação de conflitos de horário
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /classes/:classId/schedules
- [X] GET /classes/:classId/schedules
- [X] GET /schedules/:id
- [X] PATCH /schedules/:id
- [X] DELETE /schedules/:id

---

## 📚 FASE 5: Gestão Pedagógica

### 5.1 Módulo de Frequência (Attendances)
- [X] Criar AttendancesModule
- [X] Criar AttendancesService
- [X] Criar AttendancesController
- [X] Criar DTOs (CreateAttendanceDto, BulkAttendanceDto)
- [X] Implementar lançamento em lote
- [X] Implementar relatórios de frequência
- [ ] Implementar alertas de faltas excessivas
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /attendances (lançamento individual)
- [X] POST /attendances/bulk (lançamento em lote)
- [X] GET /attendances (filtros por turma, disciplina, data)
- [X] GET /attendances/report/:studentId
- [X] PATCH /attendances/:id
- [X] DELETE /attendances/:id

### 5.2 Módulo de Conteúdo de Aula (Lesson Contents)
- [X] Criar LessonContentsModule
- [X] Criar LessonContentsService
- [X] Criar LessonContentsController
- [X] Criar DTOs
- [ ] Implementar anexo de arquivos
- [X] Implementar listagem por turma/disciplina
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /lesson-contents
- [X] GET /lesson-contents (filtros)
- [X] GET /lesson-contents/:id
- [X] PATCH /lesson-contents/:id
- [X] DELETE /lesson-contents/:id

### 5.3 Módulo de Plano de Ensino (Lesson Plans)
- [X] Criar LessonPlansModule
- [X] Criar LessonPlansService
- [X] Criar LessonPlansController
- [X] Criar DTOs
- [X] Implementar validação de datas
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /lesson-plans
- [X] GET /lesson-plans (filtros)
- [X] GET /lesson-plans/:id
- [X] PATCH /lesson-plans/:id
- [X] DELETE /lesson-plans/:id

### 5.4 Módulo de Notas (Grades)
- [X] Criar GradesModule
- [X] Criar GradesService
- [X] Criar GradesController
- [X] Criar DTOs
- [X] Implementar cálculo de médias
- [X] Implementar publicação de notas
- [X] Implementar relatórios
- [ ] Implementar alertas de nota baixa
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /grades
- [X] POST /grades/bulk
- [X] GET /grades (filtros)
- [X] GET /grades/:id
- [X] GET /grades/student/:studentId
- [X] PATCH /grades/:id
- [X] PATCH /grades/:id/publish
- [X] DELETE /grades/:id

### 5.5 Módulo de Tarefas/Atividades Online (Assignments)
- [X] Criar AssignmentsModule
- [X] Criar AssignmentsService
- [X] Criar AssignmentsController
- [X] Criar DTOs
- [X] Implementar upload de anexos
- [X] Implementar submissão de tarefas (alunos)
- [X] Implementar correção e feedback
- [ ] Implementar alertas de prazo
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /assignments (criar tarefa - professor)
- [X] GET /assignments (filtros)
- [X] GET /assignments/:id
- [X] PATCH /assignments/:id
- [X] DELETE /assignments/:id
- [X] POST /assignments/:id/submit (aluno envia)
- [X] GET /assignments/:id/submissions (professor vê entregas)
- [X] PATCH /submissions/:id/grade (professor corrige)

### 5.6 Módulo de Observações (Student Observations)
- [X] Criar ObservationsModule
- [X] Criar ObservationsService
- [X] Criar ObservationsController
- [X] Criar DTOs
- [X] Implementar filtros de privacidade
- [X] Implementar alertas para pais
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /observations
- [X] GET /observations (filtros)
- [X] GET /observations/student/:studentId
- [X] GET /observations/:id
- [X] PATCH /observations/:id
- [X] DELETE /observations/:id

---

## ❓ FASE 6: Banco de Questões e Atividades Impressas

### 6.1 Módulo de Categorias de Questões (Question Categories)
- [X] Criar QuestionCategoriesModule
- [X] Criar QuestionCategoriesService
- [X] Criar QuestionCategoriesController
- [X] Criar DTOs
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /question-categories (SUPER_ADMIN)
- [X] GET /question-categories
- [X] GET /question-categories/:id
- [X] GET /question-categories/:id/statistics
- [X] PATCH /question-categories/:id
- [X] DELETE /question-categories/:id

### 6.2 Módulo de Questões (Questions)
- [X] Criar QuestionsModule
- [X] Criar QuestionsService
- [X] Criar QuestionsController
- [X] Criar DTOs (CreateQuestionDto, UpdateQuestionDto)
- [ ] Implementar upload de imagens
- [X] Implementar busca avançada (tags, dificuldade, tipo)
- [X] Implementar contador de uso
- [X] Implementar duplicação de questões
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /questions (SUPER_ADMIN)
- [X] GET /questions (busca avançada)
- [X] GET /questions/statistics
- [X] GET /questions/:id
- [X] POST /questions/:id/duplicate
- [X] PATCH /questions/:id (SUPER_ADMIN)
- [X] DELETE /questions/:id (SUPER_ADMIN)

### 6.3 Módulo de Atividades para Impressão (Activities)
- [X] Criar ActivitiesModule
- [X] Criar ActivitiesService
- [X] Criar ActivitiesController
- [X] Criar DTOs (CreateActivityDto, UpdateActivityDto, AddQuestionDto)
- [X] Implementar seleção de questões
- [X] Implementar ordenação de questões
- [X] Implementar cálculo automático de pontuação
- [ ] Implementar geração de PDF para impressão
- [X] Implementar geração de gabarito
- [X] Implementar templates de cabeçalho/rodapé
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /activities (professor)
- [X] GET /activities (filtros)
- [X] GET /activities/:id
- [X] POST /activities/:id/questions (adicionar questão)
- [X] PATCH /activities/:id/questions/:questionId (reordenar, customizar)
- [X] DELETE /activities/:id/questions/:questionId
- [X] GET /activities/:id/preview (visualizar)
- [ ] GET /activities/:id/export/pdf (gerar PDF)
- [X] GET /activities/:id/answer-key (gerar gabarito)
- [X] PATCH /activities/:id
- [X] DELETE /activities/:id

---

## 📢 FASE 7: Comunicação e Notificações

### 7.1 Módulo de Comunicados (Announcements)
- [X] Criar AnnouncementsModule
- [X] Criar AnnouncementsService
- [X] Criar AnnouncementsController
- [X] Criar DTOs
- [X] Implementar filtros por role de destino
- [X] Implementar anexos
- [X] Implementar agendamento de publicação
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /announcements
- [X] GET /announcements (filtros)
- [X] GET /announcements/:id
- [X] PATCH /announcements/:id
- [X] PATCH /announcements/:id/publish
- [X] PATCH /announcements/:id/unpublish
- [X] DELETE /announcements/:id

### 7.2 Módulo de Notificações (Notifications)
- [X] Criar NotificationsModule
- [X] Criar NotificationsService
- [X] Criar NotificationsController
- [X] Criar DTOs
- [X] Implementar envio automático (faltas, notas baixas)
- [X] Implementar marcação de lida/não lida
- [X] Implementar listagem para pais
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /notifications (system use)
- [X] GET /notifications (minhas notificações)
- [X] GET /notifications/unread-count
- [X] GET /notifications/:id
- [X] PATCH /notifications/:id/read
- [X] PATCH /notifications/:id/unread
- [X] PATCH /notifications/read-all
- [X] DELETE /notifications/:id

### 7.3 Módulo de Eventos/Calendário (Events)
- [X] Criar EventsModule
- [X] Criar EventsService
- [X] Criar EventsController
- [X] Criar DTOs
- [X] Implementar calendário letivo
- [X] Implementar filtros por tipo
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] POST /events
- [X] GET /events (filtros por período)
- [X] GET /events/calendar/:year/:month
- [X] GET /events/:id
- [X] PATCH /events/:id
- [X] DELETE /events/:id

---

## 📊 FASE 8: Relatórios e Dashboard

### 8.1 Módulo de Relatórios (Reports)
- [X] Criar ReportsModule
- [X] Criar ReportsService
- [X] Criar ReportsController
- [X] Implementar relatório de frequência por turma
- [X] Implementar relatório de notas por turma
- [X] Implementar relatório de desempenho individual
- [X] Implementar relatório pedagógico por professor
- [ ] Implementar relatório de uso de questões
- [ ] Implementar exportação em PDF
- [ ] Implementar exportação em Excel
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] GET /reports/attendance (filtros)
- [X] GET /reports/grades (filtros)
- [X] GET /reports/student/:studentId/performance
- [X] GET /reports/class/:classId/performance
- [X] GET /reports/teacher/:teacherId/summary
- [ ] GET /reports/questions/usage
- [ ] GET /reports/:type/export/pdf
- [ ] GET /reports/:type/export/excel

### 8.2 Módulo de Dashboard (Dashboard)
- [X] Criar DashboardModule
- [X] Criar DashboardService
- [X] Criar DashboardController
- [X] Implementar dashboard para coordenadores
- [X] Implementar dashboard para professores
- [X] Implementar dashboard para pais
- [X] Implementar estatísticas em tempo real
- [X] Documentar no Swagger
- [ ] Testes unitários

**Endpoints:**
- [X] GET /dashboard/coordinator
- [X] GET /dashboard/teacher
- [X] GET /dashboard/parent
- [X] GET /dashboard/statistics

---

## 🧪 FASE 9: Testes e Qualidade

### 9.1 Testes Unitários
- [ ] Configurar Jest
- [ ] Testes de Services (todos os módulos)
- [ ] Testes de Controllers (todos os módulos)
- [ ] Testes de Guards
- [ ] Testes de Decorators
- [ ] Testes de Validators
- [ ] Cobertura mínima de 80%

### 9.2 Testes de Integração (E2E)
- [ ] Configurar testes E2E
- [ ] Testes de autenticação
- [ ] Testes de fluxo de matrícula
- [ ] Testes de lançamento de notas
- [ ] Testes de lançamento de frequência
- [ ] Testes de criação de atividades
- [ ] Testes de permissões (RBAC)

### 9.3 Validações e Tratamento de Erros
- [ ] Criar custom exceptions
- [ ] Implementar exception filters
- [ ] Implementar validação de DTOs em todos os endpoints
- [ ] Implementar mensagens de erro padronizadas
- [ ] Implementar logging de erros

---

## 🚀 FASE 10: Otimizações e Deploy

### 10.1 Otimizações de Performance
- [ ] Implementar cache (Redis) para consultas frequentes
- [ ] Implementar paginação em todos os endpoints de listagem
- [ ] Otimizar queries do Prisma (includes, selects)
- [ ] Implementar índices no banco de dados
- [ ] Implementar compressão de respostas
- [ ] Implementar upload de arquivos para S3/storage

### 10.2 Logging e Monitoramento
- [ ] Configurar Winston/Pino para logging
- [ ] Implementar logs estruturados
- [ ] Implementar rastreamento de requisições
- [ ] Configurar health check endpoint

### 10.3 Documentação Final
- [ ] Revisar toda documentação Swagger
- [ ] Criar README.md completo
- [ ] Criar guia de instalação
- [ ] Criar guia de contribuição
- [ ] Documentar variáveis de ambiente
- [ ] Documentar estrutura do projeto
- [ ] Criar exemplos de uso da API

### 10.4 Deploy
- [ ] Configurar Docker
- [ ] Criar docker-compose.yml
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Configurar ambiente de staging
- [ ] Configurar ambiente de produção
- [ ] Configurar backup do banco de dados
- [ ] Configurar monitoramento de produção

---

## 📝 Estimativas de Tempo

| Fase | Descrição | Estimativa |
|------|-----------|------------|
| 1 | Configuração Base e Infraestrutura | 3-5 dias |
| 2 | Autenticação e Autorização | 5-7 dias |
| 3 | Módulos de Usuários e Perfis | 10-12 dias |
| 4 | Estrutura Acadêmica | 10-12 dias |
| 5 | Gestão Pedagógica | 12-15 dias |
| 6 | Banco de Questões e Atividades | 8-10 dias |
| 7 | Comunicação e Notificações | 5-7 dias |
| 8 | Relatórios e Dashboard | 8-10 dias |
| 9 | Testes e Qualidade | 10-12 dias |
| 10 | Otimizações e Deploy | 5-7 dias |
| **TOTAL** | | **76-97 dias (~3-4 meses)** |

---

## 🔑 Controle de Acesso por Módulo

### Legenda de Roles:
- **SA** - SUPER_ADMIN
- **IA** - INSTITUTION_ADMIN
- **CO** - COORDINATOR
- **TE** - TEACHER
- **ST** - STUDENT
- **PA** - PARENT

| Módulo | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Institutions | SA | SA, IA | SA, IA | SA |
| Users | SA, IA | SA, IA, CO | SA, IA, próprio | SA, IA |
| Teachers | SA, IA | SA, IA, CO, TE | SA, IA, próprio | SA, IA |
| Students | SA, IA | SA, IA, CO, TE, ST, PA | SA, IA, próprio | SA, IA |
| Parents | SA, IA | SA, IA, CO, PA | SA, IA, próprio | SA, IA |
| Academic Years | SA, IA | todos | SA, IA | SA, IA |
| Courses | SA, IA | todos | SA, IA, CO | SA, IA |
| Subjects | SA, IA | todos | SA, IA, CO | SA, IA |
| Classes | SA, IA, CO | todos | SA, IA, CO | SA, IA, CO |
| Enrollments | SA, IA, CO | SA, IA, CO, TE | SA, IA, CO | SA, IA, CO |
| Attendances | TE | SA, IA, CO, TE, ST, PA | TE | TE |
| Lesson Contents | TE | SA, IA, CO, TE, ST | TE | TE |
| Lesson Plans | TE | SA, IA, CO, TE | TE | TE |
| Grades | TE | SA, IA, CO, TE, ST, PA | TE | TE |
| Assignments | TE | SA, IA, CO, TE, ST | TE | TE |
| Observations | TE, CO | SA, IA, CO, TE, PA* | TE, CO | TE, CO |
| Questions | SA | todos | SA | SA |
| Activities | TE | SA, IA, CO, TE | TE | TE |
| Announcements | SA, IA, CO | todos | SA, IA, CO | SA, IA, CO |
| Events | SA, IA, CO | todos | SA, IA, CO | SA, IA, CO |

\* PA só vê observações não privadas

---

## 📚 Dependências Principais

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/jwt": "^11.0.1",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/swagger": "^8.0.0",
    "@nestjs/throttler": "^6.0.0",
    "@prisma/client": "^6.17.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^6.0.0",
    "class-validator": "^0.14.2",
    "class-transformer": "^0.5.1",
    "helmet": "^8.0.0",
    "pdfkit": "^0.15.0",
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/passport-jwt": "^4.0.1",
    "prisma": "^6.17.1"
  }
}
```

---

## 🎯 Prioridades de Implementação

### Sprint 1 (Crítico - Semanas 1-2)
1. Configuração base
2. Autenticação JWT
3. Módulo de usuários básico
4. Swagger básico

### Sprint 2 (Alta - Semanas 3-4)
1. Estrutura acadêmica (turmas, disciplinas)
2. Matrículas
3. RBAC completo

### Sprint 3 (Alta - Semanas 5-6)
1. Frequência
2. Notas
3. Conteúdo de aula

### Sprint 4 (Média - Semanas 7-8)
1. Banco de questões
2. Atividades impressas
3. Observações

### Sprint 5 (Média - Semanas 9-10)
1. Comunicados
2. Notificações
3. Eventos

### Sprint 6 (Baixa - Semanas 11-12)
1. Relatórios
2. Dashboard
3. Testes completos
4. Deploy

---

## ✅ Checklist de Conclusão

- [ ] Todos os módulos implementados
- [ ] Todos os endpoints documentados no Swagger
- [ ] Autenticação JWT funcionando
- [ ] RBAC implementado e testado
- [ ] Cobertura de testes > 80%
- [ ] Testes E2E passando
- [ ] Documentação completa (README, guias)
- [ ] Docker configurado
- [ ] CI/CD configurado
- [ ] Deploy em staging realizado
- [ ] Performance otimizada
- [ ] Segurança revisada
- [ ] Deploy em produção realizado

---

**Status do Projeto:** 🔴 Não Iniciado

**Última Atualização:** 2025-10-21
