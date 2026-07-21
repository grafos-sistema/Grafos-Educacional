# 🎯 Roadmap para 100% Excelência - Sistema Grafos

> **Status Atual:** Sistema funcional com gaps em funcionalidades prometidas  
> **Objetivo:** Implementar todas as features da landing page e melhorias críticas  
> **Última atualização:** 2025-11-15

---

## 📋 ÍNDICE

1. [Correções Críticas](#correções-críticas)
2. [Funcionalidades Principais Faltando](#funcionalidades-principais-faltando)
3. [Melhorias de Fluxo e UX](#melhorias-de-fluxo-e-ux)
4. [Segurança e Permissões](#segurança-e-permissões)
5. [Layout e Responsividade](#layout-e-responsividade)
6. [Otimizações e Performance](#otimizações-e-performance)

---

## ✅ CORREÇÕES CRÍTICAS

### 🔧 Bugs Bloqueadores
- [x] **Criar página /select-profile faltando**
  - [x] Criar diretório `src/app/(auth)/select-profile/`
  - [x] Implementar page.tsx com lógica de seleção de perfil
  - [x] Listar todos os perfis ativos do usuário
  - [x] Redirecionar automaticamente se apenas 1 perfil
  - [x] Redirecionar para `/pending-approval` se sem perfis

- [x] **Adicionar link "Criar Conta" na landing page**
  - [x] Adicionar botão no header desktop
  - [x] Adicionar botão no header mobile
  - [x] Link apontando para `/register`

### 🚨 Fluxos Quebrados
- [ ] **Notificações de aprovação de cadastro**
  - [ ] Backend: Criar módulo de notificações
  - [ ] Endpoint `GET /notifications/pending-approvals-count`
  - [ ] Endpoint `GET /notifications/admin`
  - [ ] Frontend: Badge na navbar com contador
  - [ ] Badge no menu "Usuários" com número de pendentes
  - [ ] Atualização em tempo real (polling ou WebSocket)

- [ ] **Profile Switcher na Navbar**
  - [ ] Criar componente `ProfileSwitcher.tsx`
  - [ ] Dropdown com lista de perfis disponíveis
  - [ ] Indicador visual do perfil ativo
  - [ ] Função de troca sem novo login
  - [ ] Salvar preferência de perfil padrão
  - [ ] Integrar no layout autenticado

---

## 🎮 FUNCIONALIDADES PRINCIPAIS FALTANDO

## 1️⃣ RANKINGS E PREMIAÇÕES (ALTA PRIORIDADE)

### Backend - Rankings
- [ ] **Criar módulo de Rankings**
  - [ ] Criar `api/src/rankings/rankings.module.ts`
  - [ ] Criar `api/src/rankings/rankings.controller.ts`
  - [ ] Criar `api/src/rankings/rankings.service.ts`
  - [ ] Criar DTOs (ranking.dto.ts)

- [ ] **Schema do Prisma - Rankings**
  - [ ] Criar model `Ranking` (id, userId, institutionId, points, period, rank)
  - [ ] Criar model `Achievement` (id, userId, type, name, icon, date)
  - [ ] Criar model `Badge` (id, name, description, icon, criteria)
  - [ ] Criar relações com User, Institution
  - [ ] Executar migration

- [ ] **Endpoints de Rankings**
  - [ ] `GET /rankings/schools` - Ranking de escolas
  - [ ] `GET /rankings/schools/:id/classes` - Ranking de turmas por escola
  - [ ] `GET /rankings/classes/:classId` - Ranking de alunos da turma
  - [ ] `GET /rankings/students/:institutionId` - Ranking geral de alunos
  - [ ] `GET /rankings/student/:id` - Posição e pontos do aluno
  - [ ] `GET /rankings/student/:id/history` - Histórico de ranking
  - [ ] `POST /rankings/recalculate` - Recalcular rankings (ADMIN)

- [ ] **Sistema de Pontuação**
  - [ ] Criar `points-calculator.service.ts`
  - [ ] Lógica de pontos por nota (0-10 = 0-100 pontos)
  - [ ] Pontos por frequência (presença = +10 pontos)
  - [ ] Pontos por atividades entregues (+20 pontos)
  - [ ] Pontos por simulados SAEB (+50-100 pontos)
  - [ ] Multiplicador de streak (dias consecutivos estudando)
  - [ ] Cálculo automático diário (Cron job)

- [ ] **Sistema de Conquistas/Badges**
  - [ ] Criar `achievements.service.ts`
  - [ ] Badge "Primeira Nota 10"
  - [ ] Badge "100% de Frequência"
  - [ ] Badge "Destaque do Mês"
  - [ ] Badge "Top 3 da Turma"
  - [ ] Badge "Evolução +20%"
  - [ ] Troféu "Campeão da Escola"
  - [ ] Endpoint `GET /achievements/available` - Lista de badges
  - [ ] Endpoint `GET /achievements/student/:id` - Badges do aluno
  - [ ] Endpoint `POST /achievements/unlock` - Desbloquear badge

### Frontend - Rankings
- [ ] **Página de Rankings para Alunos**
  - [ ] Criar `frontend/src/app/(authenticated)/aluno/rankings/page.tsx`
  - [ ] Card com posição atual do aluno
  - [ ] Gráfico de evolução de pontos (última semana/mês)
  - [ ] Tabela de ranking da turma (top 10)
  - [ ] Tabela de ranking geral da escola (top 20)
  - [ ] Seção de conquistas/badges desbloqueados
  - [ ] Seção de badges a desbloquear (próximos)

- [ ] **Página de Rankings para Professores**
  - [ ] Criar `frontend/src/app/(authenticated)/professor/rankings/page.tsx`
  - [ ] Ranking de suas turmas
  - [ ] Comparativo entre turmas
  - [ ] Alunos destaque de cada turma
  - [ ] Filtros por período (semanal, mensal, anual)

- [ ] **Página de Rankings para Admins**
  - [ ] Criar `frontend/src/app/(authenticated)/admin/rankings/page.tsx`
  - [ ] Ranking geral da instituição
  - [ ] Ranking por turma
  - [ ] Ranking por série
  - [ ] Exportar rankings (CSV/PDF)
  - [ ] Configurar pesos de pontuação

- [ ] **Componentes de Rankings**
  - [ ] Criar `RankingCard.tsx` - Card de posição do usuário
  - [ ] Criar `RankingTable.tsx` - Tabela de ranking
  - [ ] Criar `BadgeDisplay.tsx` - Exibição de badge/troféu
  - [ ] Criar `AchievementModal.tsx` - Modal de conquista desbloqueada
  - [ ] Criar `PointsHistory.tsx` - Gráfico de evolução de pontos
  - [ ] Animação de subida/descida no ranking

- [ ] **Gamificação Visual**
  - [ ] Design de badges/troféus (SVG ou PNG)
  - [ ] Animação de conquista desbloqueada
  - [ ] Confete/efeitos visuais ao subir de posição
  - [ ] Cores/temas por nível (bronze, prata, ouro, platina)
  - [ ] Avatar com bordas especiais por nível

---

## 2️⃣ SIMULADOS SAEB (ALTA PRIORIDADE)

### Backend - Simulados
- [ ] **Criar módulo de Exams**
  - [ ] Criar `api/src/exams/exams.module.ts`
  - [ ] Criar `api/src/exams/exams.controller.ts`
  - [ ] Criar `api/src/exams/exams.service.ts`
  - [ ] Criar DTOs (create-exam.dto, take-exam.dto, exam-result.dto)

- [ ] **Schema do Prisma - Exams**
  - [ ] Model `Exam` (id, title, type, gradeLevel, subject, duration, totalPoints)
  - [ ] Model `ExamQuestion` (id, examId, questionId, order, points)
  - [ ] Model `ExamAttempt` (id, examId, studentId, startTime, endTime, score)
  - [ ] Model `ExamAnswer` (id, attemptId, questionId, selectedOption, isCorrect)
  - [ ] Model `SAEBDescriptor` (id, code, description, subject, skill)
  - [ ] Relações entre models
  - [ ] Executar migration

- [ ] **Matriz de Referência SAEB**
  - [ ] Criar `saeb-matrix.service.ts`
  - [ ] Importar descritores de Língua Portuguesa
  - [ ] Importar descritores de Matemática
  - [ ] Associar questões a descritores
  - [ ] Endpoint `GET /saeb/descriptors` - Lista descritores
  - [ ] Endpoint `GET /saeb/descriptors/:subjectId` - Por disciplina

- [ ] **Endpoints de Exams**
  - [ ] `POST /exams` - Criar simulado (PROFESSOR/ADMIN)
  - [ ] `GET /exams` - Listar simulados (com filtros)
  - [ ] `GET /exams/:id` - Detalhes do simulado
  - [ ] `GET /exams/saeb` - Simulados SAEB específicos
  - [ ] `PATCH /exams/:id` - Atualizar simulado
  - [ ] `DELETE /exams/:id` - Deletar simulado
  - [ ] `POST /exams/:id/assign` - Atribuir a turma/alunos
  - [ ] `GET /exams/student/:studentId` - Simulados do aluno

- [ ] **Realização de Simulados**
  - [ ] `POST /exams/:id/start` - Iniciar tentativa
  - [ ] `POST /exams/:id/answer` - Responder questão
  - [ ] `POST /exams/:id/submit` - Finalizar simulado
  - [ ] `GET /exams/:id/attempt/:attemptId` - Ver tentativa
  - [ ] Validar tempo de duração
  - [ ] Salvar respostas parciais (auto-save)
  - [ ] Correção automática

- [ ] **Resultados e Analytics**
  - [ ] `GET /exams/:id/results` - Resultados do simulado
  - [ ] `GET /exams/:id/results/:studentId` - Resultado do aluno
  - [ ] `GET /exams/:id/statistics` - Estatísticas gerais
  - [ ] `GET /exams/student/:id/performance` - Desempenho por descritor
  - [ ] Cálculo de proficiência (escala SAEB)
  - [ ] Identificação de descritores fracos
  - [ ] Sugestões de estudo personalizadas

### Frontend - Simulados
- [ ] **Página de Simulados para Professores**
  - [ ] Criar `frontend/src/app/(authenticated)/professor/exams/page.tsx`
  - [ ] Listar simulados criados
  - [ ] Botão "Criar Novo Simulado"
  - [ ] Filtros (tipo, disciplina, turma)
  - [ ] Ver estatísticas de cada simulado

- [ ] **Formulário de Criação de Simulado**
  - [ ] Criar `frontend/src/app/(authenticated)/professor/exams/new/page.tsx`
  - [ ] Dados básicos (título, tipo, disciplina, série)
  - [ ] Duração do simulado
  - [ ] Seleção de questões do banco
  - [ ] Filtro por descritor SAEB
  - [ ] Preview do simulado
  - [ ] Atribuir a turmas/alunos
  - [ ] Definir data de início/fim

- [ ] **Página de Simulados para Alunos**
  - [ ] Criar `frontend/src/app/(authenticated)/aluno/exams/page.tsx`
  - [ ] Listar simulados disponíveis
  - [ ] Status (Pendente, Em Andamento, Concluído)
  - [ ] Prazo de entrega
  - [ ] Botão "Iniciar Simulado"

- [ ] **Interface de Realização de Simulado**
  - [ ] Criar `frontend/src/app/(authenticated)/aluno/exams/[id]/take/page.tsx`
  - [ ] Header com timer countdown
  - [ ] Navegação entre questões
  - [ ] Marcação de questões para revisar
  - [ ] Barra de progresso
  - [ ] Auto-save a cada 30 segundos
  - [ ] Modal de confirmação ao finalizar
  - [ ] Avisos de tempo restante (10min, 5min, 1min)

- [ ] **Página de Resultados do Simulado**
  - [ ] Criar `frontend/src/app/(authenticated)/aluno/exams/[id]/results/page.tsx`
  - [ ] Pontuação final
  - [ ] Nota de proficiência SAEB
  - [ ] Porcentagem de acertos
  - [ ] Tempo gasto
  - [ ] Análise por descritor (gráfico radar)
  - [ ] Questões corretas/erradas
  - [ ] Gabarito com explicações
  - [ ] Descritores que precisa melhorar
  - [ ] Sugestões de estudo

- [ ] **Dashboard de Analytics (Professor)**
  - [ ] Criar `frontend/src/app/(authenticated)/professor/exams/[id]/analytics/page.tsx`
  - [ ] Estatísticas gerais (média, mediana, desvio padrão)
  - [ ] Gráfico de distribuição de notas
  - [ ] Taxa de acertos por questão
  - [ ] Análise por descritor da turma
  - [ ] Comparativo entre turmas
  - [ ] Alunos com dificuldades
  - [ ] Exportar relatório PDF

- [ ] **Componentes de Exams**
  - [ ] Criar `ExamCard.tsx` - Card de simulado
  - [ ] Criar `QuestionDisplay.tsx` - Exibir questão
  - [ ] Criar `ExamTimer.tsx` - Timer de simulado
  - [ ] Criar `ProgressBar.tsx` - Progresso do simulado
  - [ ] Criar `ResultsChart.tsx` - Gráficos de resultado
  - [ ] Criar `DescriptorRadar.tsx` - Gráfico radar de descritores

---

## 3️⃣ TRACKING DE IDEB (ALTA PRIORIDADE)

### Backend - IDEB
- [ ] **Criar módulo de IDEB**
  - [ ] Criar `api/src/ideb/ideb.module.ts`
  - [ ] Criar `api/src/ideb/ideb.controller.ts`
  - [ ] Criar `api/src/ideb/ideb.service.ts`
  - [ ] Criar `ideb-calculator.service.ts`
  - [ ] Criar DTOs

- [ ] **Schema do Prisma - IDEB**
  - [ ] Model `IDEBRecord` (id, institutionId, year, value, approvalRate, avgPerformance)
  - [ ] Model `IDEBGoal` (id, institutionId, year, targetValue, actionPlan)
  - [ ] Model `IDEBIndicator` (id, recordId, type, value, description)
  - [ ] Model `SchoolFlowData` (id, institutionId, year, approvalRate, dropoutRate, retentionRate)
  - [ ] Executar migration

- [ ] **Cálculo de IDEB**
  - [ ] Implementar fórmula oficial: IDEB = N x P
    - [ ] N = Nota média padronizada (0-10)
    - [ ] P = Indicador de rendimento (taxa de aprovação)
  - [ ] Cálculo de taxa de aprovação
  - [ ] Cálculo de nota média padronizada
  - [ ] Cálculo de fluxo escolar
  - [ ] Projeção de IDEB futuro

- [ ] **Endpoints de IDEB**
  - [ ] `GET /ideb/institution/:id` - IDEB da instituição
  - [ ] `GET /ideb/institution/:id/history` - Histórico IDEB
  - [ ] `GET /ideb/institution/:id/projection` - Projeção baseada em desempenho atual
  - [ ] `POST /ideb/goals` - Definir metas de IDEB
  - [ ] `GET /ideb/goals/:institutionId` - Ver metas
  - [ ] `GET /ideb/indicators/:institutionId` - Indicadores detalhados
  - [ ] `GET /ideb/comparison` - Comparar com outras escolas/estado/país
  - [ ] `POST /ideb/action-plans` - Criar plano de ação
  - [ ] `GET /ideb/action-plans/:institutionId` - Listar planos

- [ ] **Análises e Recomendações**
  - [ ] Identificar áreas de melhoria
  - [ ] Sugerir ações baseadas em dados
  - [ ] Alertas de queda de desempenho
  - [ ] Benchmarking com escolas similares

### Frontend - IDEB
- [ ] **Dashboard de IDEB (Admin)**
  - [ ] Criar `frontend/src/app/(authenticated)/admin/ideb/page.tsx`
  - [ ] Card principal com IDEB atual
  - [ ] Comparação com ano anterior
  - [ ] Gráfico de evolução histórica (últimos 5 anos)
  - [ ] Metas de IDEB
  - [ ] Progresso em direção à meta
  - [ ] Indicador de tendência (subindo/caindo)

- [ ] **Análise Detalhada de Indicadores**
  - [ ] Criar aba "Indicadores"
  - [ ] Taxa de aprovação por série
  - [ ] Taxa de evasão
  - [ ] Taxa de retenção
  - [ ] Nota média por disciplina
  - [ ] Desempenho em avaliações externas
  - [ ] Gráficos comparativos

- [ ] **Projeções e Simulações**
  - [ ] Criar aba "Projeções"
  - [ ] Projeção de IDEB para próximos 2 anos
  - [ ] Simulador: "E se...?"
    - [ ] Aumentar aprovação em X%
    - [ ] Melhorar nota média em Y pontos
    - [ ] Ver impacto no IDEB
  - [ ] Cenários otimista/pessimista/realista

- [ ] **Planos de Ação**
  - [ ] Criar `frontend/src/app/(authenticated)/admin/ideb/action-plans/page.tsx`
  - [ ] Listar planos de ação ativos
  - [ ] Criar novo plano de ação
  - [ ] Definir objetivos e metas
  - [ ] Atribuir responsáveis
  - [ ] Acompanhar progresso
  - [ ] Marcar ações como concluídas

- [ ] **Comparativos e Benchmarking**
  - [ ] Criar aba "Comparativos"
  - [ ] Comparar com média do município
  - [ ] Comparar com média do estado
  - [ ] Comparar com média nacional
  - [ ] Ranking de escolas similares
  - [ ] Melhores práticas de escolas top

- [ ] **Componentes de IDEB**
  - [ ] Criar `IDEBCard.tsx` - Card principal
  - [ ] Criar `IDEBTrend.tsx` - Indicador de tendência
  - [ ] Criar `IDEBHistory.tsx` - Gráfico histórico
  - [ ] Criar `IDEBProjection.tsx` - Gráfico de projeção
  - [ ] Criar `ActionPlanCard.tsx` - Card de plano de ação
  - [ ] Criar `IDEBComparison.tsx` - Gráfico comparativo

---

## 4️⃣ GRÁFICOS DE DESEMPENHO INTERATIVOS (MÉDIA PRIORIDADE)

### Biblioteca de Gráficos
- [ ] **Instalar e configurar Recharts**
  - [ ] `npm install recharts`
  - [ ] Criar componentes wrapper
  - [ ] Configurar temas/cores padrão

### Gráficos para Alunos
- [ ] **Dashboard do Aluno - Gráficos**
  - [ ] Gráfico de linha: Evolução de notas por disciplina (últimos 6 meses)
  - [ ] Gráfico de barras: Notas do bimestre atual
  - [ ] Gráfico radar: Competências/habilidades
  - [ ] Gráfico de pizza: Distribuição de tempo por disciplina
  - [ ] Gráfico de área: Frequência mensal
  - [ ] Comparativo: Aluno vs Média da Turma

- [ ] **Página de Desempenho Detalhado**
  - [ ] Criar `frontend/src/app/(authenticated)/aluno/performance/page.tsx`
  - [ ] Filtros: Período, Disciplina
  - [ ] Gráfico de crescimento percentual
  - [ ] Mapa de calor: Dificuldades por tópico
  - [ ] Timeline de avaliações
  - [ ] Previsão de nota final (IA/ML opcional)

### Gráficos para Professores
- [ ] **Dashboard do Professor - Gráficos**
  - [ ] Gráfico de linha: Evolução da turma
  - [ ] Gráfico de barras: Comparativo entre turmas
  - [ ] Gráfico box-plot: Distribuição de notas
  - [ ] Gráfico de dispersão: Correlação nota x frequência
  - [ ] Heatmap: Desempenho por aluno x conteúdo

- [ ] **Analytics de Turma**
  - [ ] Criar `frontend/src/app/(authenticated)/professor/analytics/page.tsx`
  - [ ] Análise de crescimento da turma
  - [ ] Identificação de alunos em risco
  - [ ] Análise de lacunas de aprendizagem
  - [ ] Efetividade de métodos de ensino
  - [ ] Exportar relatórios

### Gráficos para Admins
- [ ] **Dashboard Admin - Gráficos**
  - [ ] Visão geral da instituição
  - [ ] Comparativo entre turmas/séries
  - [ ] Evolução ano a ano
  - [ ] Taxa de aprovação por série
  - [ ] Análise de evasão escolar
  - [ ] Indicadores de qualidade

### Componentes de Gráficos
- [ ] **Criar componentes reutilizáveis**
  - [ ] Criar `LineChart.tsx` - Gráfico de linha
  - [ ] Criar `BarChart.tsx` - Gráfico de barras
  - [ ] Criar `RadarChart.tsx` - Gráfico radar
  - [ ] Criar `PieChart.tsx` - Gráfico de pizza
  - [ ] Criar `AreaChart.tsx` - Gráfico de área
  - [ ] Criar `HeatMap.tsx` - Mapa de calor
  - [ ] Criar `GaugeChart.tsx` - Medidor/gauge
  - [ ] Criar `TrendIndicator.tsx` - Seta de tendência

### Funcionalidades Interativas
- [ ] **Adicionar interatividade**
  - [ ] Tooltips informativos
  - [ ] Zoom e pan
  - [ ] Filtros de período
  - [ ] Download de gráficos (PNG/SVG)
  - [ ] Alternar tipos de visualização
  - [ ] Legendas clicáveis (show/hide dados)
  - [ ] Animações suaves

---

## 🎨 MELHORIAS DE FLUXO E UX

### Workflow de Aprovação Aprimorado
- [ ] **Notificações em Tempo Real**
  - [ ] Backend: Implementar WebSocket ou Server-Sent Events
  - [ ] Notificação quando novo usuário se cadastra
  - [ ] Badge com contador na navbar do admin
  - [ ] Som/notificação desktop (opcional)

- [ ] **Emails Automáticos**
  - [ ] Backend: Configurar NodeMailer
  - [ ] Template: Email de boas-vindas pós-registro
  - [ ] Template: Notificação de aprovação
  - [ ] Template: Credenciais de acesso
  - [ ] Variáveis dinâmicas nos templates
  - [ ] Configurar SMTP (env vars)

- [ ] **Aprovação Rápida na Tabela**
  - [ ] Adicionar coluna "Ações" na tabela de usuários pendentes
  - [ ] Botão "Aprovar" inline
  - [ ] Modal de aprovação rápida
  - [ ] Dropdown: Selecionar perfil a adicionar
  - [ ] Endpoint `POST /users/:id/quick-approve`
  - [ ] Confirmação visual (toast/snackbar)

- [ ] **Aprovação em Massa**
  - [ ] Checkbox para selecionar múltiplos usuários
  - [ ] Botão "Aprovar Selecionados"
  - [ ] Modal de confirmação
  - [ ] Barra de progresso da operação
  - [ ] Endpoint `POST /users/bulk-approve`

### Onboarding e Tutoriais
- [ ] **Tour Guiado (Primeiro Acesso)**
  - [ ] Instalar biblioteca (react-joyride ou intro.js)
  - [ ] Tour para Alunos (5-7 passos)
  - [ ] Tour para Professores (7-10 passos)
  - [ ] Tour para Admins (10-15 passos)
  - [ ] Opção "Pular Tour"
  - [ ] Salvar estado (não mostrar novamente)

- [ ] **Central de Ajuda**
  - [ ] Criar `frontend/src/app/(authenticated)/help/page.tsx`
  - [ ] FAQs organizadas por categoria
  - [ ] Busca de artigos
  - [ ] Vídeos tutoriais (embed YouTube)
  - [ ] Guias em PDF (download)
  - [ ] Chat de suporte (futuro)

- [ ] **Tooltips e Hints**
  - [ ] Criar componente `Tooltip.tsx`
  - [ ] Adicionar tooltips em campos complexos
  - [ ] Hints inline (ícone "?" com info)
  - [ ] Textos de ajuda contextuais

### Profile Management
- [ ] **Preferências de Perfil**
  - [ ] Backend: Campo `defaultProfile` na tabela User
  - [ ] Endpoint `PATCH /users/me/default-profile`
  - [ ] Frontend: Settings para escolher perfil padrão
  - [ ] Auto-redirect para perfil padrão no login

- [ ] **Histórico de Acessos**
  - [ ] Backend: Tabela `AccessLog` (userId, profile, timestamp)
  - [ ] Registrar cada acesso
  - [ ] Endpoint `GET /users/me/access-history`
  - [ ] Frontend: Página de histórico de acessos

---

## 🔐 SEGURANÇA E PERMISSÕES

### Auditoria de Endpoints
- [ ] **Revisar todos os endpoints públicos**
  - [ ] Listar endpoints sem `@UseGuards(JwtAuthGuard)`
  - [ ] Verificar se devem ser públicos
  - [ ] Adicionar `@Public()` decorator onde apropriado
  - [ ] Validar que não há vazamento de dados sensíveis

- [ ] **Revisar Guards e Roles**
  - [ ] Verificar `@Roles()` decorator em todos os endpoints
  - [ ] Confirmar `InstitutionAdminGuard` em rotas de admin
  - [ ] Confirmar `OwnershipGuard` em rotas de usuário
  - [ ] Testar acesso negado para roles não autorizados

### Isolamento de Dados por Instituição
- [ ] **Verificar queries de banco**
  - [ ] Todas as queries de admin devem filtrar por `institutionId`
  - [ ] Verificar `UsersService.findAll()` - linha 119
  - [ ] Verificar `ClassesService.findAll()`
  - [ ] Verificar `StudentsService.findAll()`
  - [ ] Verificar `TeachersService.findAll()`
  - [ ] Adicionar testes de isolamento

### Validação de Inputs
- [ ] **DTOs e Validação**
  - [ ] Verificar todos os DTOs têm validação adequada
  - [ ] Usar `@IsNotEmpty()` em campos obrigatórios
  - [ ] Usar `@IsEmail()`, `@IsUUID()`, etc.
  - [ ] Validar tamanhos máximos de strings
  - [ ] Sanitizar inputs (evitar XSS)

### Rate Limiting
- [ ] **Implementar rate limiting**
  - [ ] Instalar `@nestjs/throttler`
  - [ ] Configurar limites globais
  - [ ] Limites específicos para `/auth/login` (5 req/min)
  - [ ] Limites para `/auth/public-register` (3 req/min)
  - [ ] Headers de rate limit na resposta

### Logs e Monitoramento
- [ ] **Sistema de Logs**
  - [ ] Configurar Winston ou Pino
  - [ ] Logs de erro (erro 500)
  - [ ] Logs de autenticação (login/logout)
  - [ ] Logs de ações sensíveis (delete, update de roles)
  - [ ] Rotação de logs

---

## 📱 LAYOUT E RESPONSIVIDADE

### Mobile-First
- [ ] **Testar em dispositivos móveis**
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
  - [ ] Tablet (iPad)
  - [ ] Landscape mode

### Componentes Responsivos
- [ ] **Tabelas de Dados**
  - [ ] Tabela de usuários (admin)
  - [ ] Tabela de turmas
  - [ ] Tabela de notas
  - [ ] Tabela de frequência
  - [ ] Implementar scroll horizontal em mobile
  - [ ] Ou transformar em cards empilhados

- [ ] **Formulários Longos**
  - [ ] Formulário de registro (quebrar em steps?)
  - [ ] Formulário de plano de aula
  - [ ] Formulário de criação de simulado
  - [ ] Garantir inputs grandes o suficiente (mobile)
  - [ ] Teclado numérico para campos de número

- [ ] **Dashboards**
  - [ ] Dashboard admin
  - [ ] Dashboard professor
  - [ ] Dashboard aluno
  - [ ] Reorganizar cards em coluna única (mobile)
  - [ ] Gráficos responsivos

### Navegação Mobile
- [ ] **Menu Lateral (Sidebar)**
  - [ ] Transformar em menu hambúrguer (mobile)
  - [ ] Overlay com backdrop
  - [ ] Swipe para fechar
  - [ ] Animações suaves

- [ ] **Bottom Navigation (opcional)**
  - [ ] Considerar bottom nav bar para alunos
  - [ ] Ícones principais (Home, Notas, Frequência, Perfil)

### Acessibilidade
- [ ] **WCAG Compliance**
  - [ ] Contraste de cores adequado
  - [ ] Textos alternativos em imagens
  - [ ] Labels em inputs de formulário
  - [ ] Navegação por teclado (Tab)
  - [ ] Semântica HTML correta
  - [ ] ARIA labels onde necessário

---

## ⚡ OTIMIZAÇÕES E PERFORMANCE

### Frontend
- [ ] **Code Splitting**
  - [ ] Lazy load de rotas pesadas
  - [ ] Dynamic imports em componentes grandes
  - [ ] Chunks separados por role (admin, professor, aluno)

- [ ] **Otimização de Imagens**
  - [ ] Usar Next.js Image component
  - [ ] Formato WebP
  - [ ] Lazy loading de imagens
  - [ ] Placeholders blur

- [ ] **Bundle Size**
  - [ ] Analisar bundle (next build --analyze)
  - [ ] Tree-shaking
  - [ ] Remover dependências não usadas
  - [ ] Minificação

- [ ] **Caching**
  - [ ] Service Worker (PWA)
  - [ ] Cache de API responses (React Query)
  - [ ] LocalStorage para preferências
  - [ ] Stale-while-revalidate

### Backend
- [ ] **Database Queries**
  - [ ] Adicionar índices no Prisma
  - [ ] Otimizar N+1 queries (usar include/select adequadamente)
  - [ ] Pagination em todas as listagens
  - [ ] Limitar tamanho de respostas

- [ ] **Caching no Backend**
  - [ ] Implementar Redis (opcional)
  - [ ] Cache de queries frequentes
  - [ ] Cache de rankings (atualizar a cada hora)
  - [ ] Cache de IDEB (atualizar diariamente)

- [ ] **Background Jobs**
  - [ ] Configurar BullMQ ou similar
  - [ ] Job de cálculo de rankings (diário)
  - [ ] Job de backup de banco (diário)
  - [ ] Job de limpeza de logs antigos
  - [ ] Job de envio de emails em lote

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs para acompanhar
- [ ] **Técnicos**
  - [ ] Tempo de carregamento < 3s
  - [ ] Bundle size < 500KB (gzipped)
  - [ ] API response time < 500ms (P95)
  - [ ] Uptime > 99.5%

- [ ] **Negócio**
  - [ ] Taxa de conclusão de cadastro > 80%
  - [ ] Taxa de aprovação de cadastros > 90%
  - [ ] Engajamento de alunos (logins/semana)
  - [ ] Adoção de simulados SAEB
  - [ ] Evolução de IDEB das escolas

---

## 🚀 DEPLOY E CI/CD

- [ ] **Pipeline de Deploy**
  - [ ] Configurar GitHub Actions
  - [ ] Testes automatizados (unit + e2e)
  - [ ] Lint e Type checking
  - [ ] Build automático
  - [ ] Deploy staging
  - [ ] Deploy production (com aprovação manual)

- [ ] **Ambientes**
  - [ ] Development (local)
  - [ ] Staging (Vercel/Netlify)
  - [ ] Production (Vercel/AWS)
  - [ ] Variáveis de ambiente (.env)

- [ ] **Monitoramento**
  - [ ] Sentry para error tracking
  - [ ] Google Analytics ou Plausible
  - [ ] Health checks
  - [ ] Alertas (PagerDuty/Slack)

---

## 📝 DOCUMENTAÇÃO

- [ ] **Documentação Técnica**
  - [ ] README.md atualizado
  - [ ] Guia de setup (dev environment)
  - [ ] Documentação de API (Swagger)
  - [ ] Diagramas de arquitetura
  - [ ] Diagramas de fluxo
  - [ ] Schema do banco (ERD)

- [ ] **Documentação de Usuário**
  - [ ] Manual do Aluno (PDF)
  - [ ] Manual do Professor (PDF)
  - [ ] Manual do Administrador (PDF)
  - [ ] Vídeos tutoriais
  - [ ] FAQs

---

## 📈 ROADMAP RESUMIDO

### Sprint 1 (2 semanas) - CRÍTICO
- [x] Fix /select-profile
- [x] Link "Criar Conta" na landing
- [ ] Profile Switcher na navbar
- [ ] Notificações de aprovação
- [ ] Aprovação rápida

### Sprint 2 (3 semanas) - RANKINGS
- [ ] Backend completo de Rankings
- [ ] Frontend de Rankings (aluno, professor, admin)
- [ ] Sistema de badges/conquistas
- [ ] Gamificação visual

### Sprint 3 (4 semanas) - SIMULADOS SAEB
- [ ] Backend completo de Exams
- [ ] Matriz SAEB
- [ ] Interface de realização
- [ ] Analytics e resultados

### Sprint 4 (2 semanas) - IDEB
- [ ] Backend de IDEB
- [ ] Dashboard de IDEB
- [ ] Planos de ação
- [ ] Comparativos

### Sprint 5 (1 semana) - GRÁFICOS
- [ ] Implementar Recharts
- [ ] Gráficos em dashboards
- [ ] Analytics detalhados

### Sprint 6 (1 semana) - POLIMENTO
- [ ] Responsividade
- [ ] Performance
- [ ] Testes
- [ ] Deploy

---

**TOTAL ESTIMADO:** 13 semanas (~3 meses)

**ÚLTIMA ATUALIZAÇÃO:** 2025-11-15  
**RESPONSÁVEL:** Equipe Grafos  
**VERSÃO:** 1.0
