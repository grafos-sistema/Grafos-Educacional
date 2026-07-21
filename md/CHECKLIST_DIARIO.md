# ✅ Checklist Diário - Grafos para 100%

> Versão simplificada para tracking diário  
> Marque com `[x]` conforme completar cada item

---

## 🔥 CRÍTICO (FAZER AGORA)

### Bugs Bloqueadores
- [x] Criar página /select-profile
- [x] Link "Criar Conta" na landing page
- [ ] Profile Switcher na navbar
- [ ] Notificações de aprovação para admin
- [ ] Email de aprovação de cadastro

---

## 1️⃣ RANKINGS E PREMIAÇÕES

### Backend
- [ ] Criar módulo rankings (module, controller, service)
- [ ] Schema Prisma (Ranking, Achievement, Badge)
- [ ] Executar migration
- [ ] Endpoints de rankings (6 endpoints)
- [ ] Sistema de pontuação (calculator service)
- [ ] Sistema de badges (achievements service)
- [ ] Cron job para cálculo diário

### Frontend
- [ ] Página aluno/rankings
- [ ] Página professor/rankings
- [ ] Página admin/rankings
- [ ] Componente RankingCard
- [ ] Componente RankingTable
- [ ] Componente BadgeDisplay
- [ ] Componente AchievementModal
- [ ] Animações de gamificação
- [ ] Design de badges (assets)

**Endpoints necessários:**
```
GET  /rankings/schools
GET  /rankings/classes/:classId
GET  /rankings/students/:institutionId
GET  /rankings/student/:id
GET  /rankings/student/:id/history
POST /rankings/recalculate
GET  /achievements/available
GET  /achievements/student/:id
POST /achievements/unlock
```

---

## 2️⃣ SIMULADOS SAEB

### Backend
- [ ] Criar módulo exams (module, controller, service)
- [ ] Schema Prisma (Exam, ExamQuestion, ExamAttempt, ExamAnswer, SAEBDescriptor)
- [ ] Executar migration
- [ ] Importar matriz SAEB (descritores)
- [ ] Endpoints de CRUD de exams (7 endpoints)
- [ ] Endpoints de realização (4 endpoints)
- [ ] Endpoints de resultados (4 endpoints)
- [ ] Sistema de correção automática
- [ ] Auto-save de respostas parciais

### Frontend
- [ ] Página professor/exams (listar)
- [ ] Página professor/exams/new (criar)
- [ ] Página aluno/exams (listar)
- [ ] Página aluno/exams/[id]/take (realizar)
- [ ] Página aluno/exams/[id]/results (resultados)
- [ ] Página professor/exams/[id]/analytics (estatísticas)
- [ ] Componente ExamCard
- [ ] Componente QuestionDisplay
- [ ] Componente ExamTimer
- [ ] Componente ProgressBar
- [ ] Componente ResultsChart
- [ ] Componente DescriptorRadar

**Endpoints necessários:**
```
POST   /exams
GET    /exams
GET    /exams/:id
GET    /exams/saeb
PATCH  /exams/:id
DELETE /exams/:id
POST   /exams/:id/assign
GET    /exams/student/:studentId
POST   /exams/:id/start
POST   /exams/:id/answer
POST   /exams/:id/submit
GET    /exams/:id/attempt/:attemptId
GET    /exams/:id/results
GET    /exams/:id/statistics
GET    /exams/student/:id/performance
GET    /saeb/descriptors
```

---

## 3️⃣ TRACKING DE IDEB

### Backend
- [ ] Criar módulo ideb (module, controller, service)
- [ ] Criar ideb-calculator service
- [ ] Schema Prisma (IDEBRecord, IDEBGoal, IDEBIndicator, SchoolFlowData)
- [ ] Executar migration
- [ ] Implementar fórmula IDEB (N x P)
- [ ] Endpoints de IDEB (9 endpoints)
- [ ] Sistema de projeções
- [ ] Sistema de recomendações

### Frontend
- [ ] Página admin/ideb (dashboard principal)
- [ ] Aba "Indicadores"
- [ ] Aba "Projeções"
- [ ] Aba "Comparativos"
- [ ] Página admin/ideb/action-plans
- [ ] Componente IDEBCard
- [ ] Componente IDEBTrend
- [ ] Componente IDEBHistory
- [ ] Componente IDEBProjection
- [ ] Componente ActionPlanCard
- [ ] Componente IDEBComparison

**Endpoints necessários:**
```
GET  /ideb/institution/:id
GET  /ideb/institution/:id/history
GET  /ideb/institution/:id/projection
POST /ideb/goals
GET  /ideb/goals/:institutionId
GET  /ideb/indicators/:institutionId
GET  /ideb/comparison
POST /ideb/action-plans
GET  /ideb/action-plans/:institutionId
```

---

## 4️⃣ GRÁFICOS INTERATIVOS

### Setup
- [ ] Instalar recharts (`npm install recharts`)
- [ ] Criar componentes wrapper de gráficos
- [ ] Configurar temas/cores padrão

### Componentes
- [ ] LineChart.tsx
- [ ] BarChart.tsx
- [ ] RadarChart.tsx
- [ ] PieChart.tsx
- [ ] AreaChart.tsx
- [ ] HeatMap.tsx
- [ ] GaugeChart.tsx
- [ ] TrendIndicator.tsx

### Implementação
- [ ] Dashboard aluno - 6 gráficos
- [ ] Dashboard professor - 5 gráficos
- [ ] Dashboard admin - 6 gráficos
- [ ] Página aluno/performance
- [ ] Página professor/analytics
- [ ] Tooltips interativos
- [ ] Download de gráficos (PNG)
- [ ] Filtros de período

---

## 🎨 UX E FLUXO

### Profile Management
- [ ] Componente ProfileSwitcher.tsx
- [ ] Dropdown com perfis disponíveis
- [ ] Indicador visual de perfil ativo
- [ ] Salvar perfil padrão (backend + frontend)
- [ ] Integrar na navbar

### Notificações
- [ ] Backend: Módulo de notificações
- [ ] Endpoint GET /notifications/pending-approvals-count
- [ ] Endpoint GET /notifications/admin
- [ ] Frontend: Badge na navbar
- [ ] WebSocket ou polling (tempo real)

### Emails
- [ ] Configurar NodeMailer
- [ ] Template: Boas-vindas pós-registro
- [ ] Template: Aprovação de cadastro
- [ ] Variáveis dinâmicas
- [ ] Configurar SMTP (env)

### Aprovação Rápida
- [ ] Botão "Aprovar" na tabela de usuários
- [ ] Modal de aprovação rápida
- [ ] Endpoint POST /users/:id/quick-approve
- [ ] Aprovação em massa (checkbox + bulk action)
- [ ] Endpoint POST /users/bulk-approve

### Onboarding
- [ ] Instalar react-joyride
- [ ] Tour para Alunos (5-7 passos)
- [ ] Tour para Professores (7-10 passos)
- [ ] Tour para Admins (10-15 passos)
- [ ] Opção "Pular Tour"
- [ ] Salvar estado (não mostrar novamente)

### Central de Ajuda
- [ ] Criar página /help
- [ ] FAQs por categoria
- [ ] Busca de artigos
- [ ] Vídeos tutoriais (embeds)
- [ ] Guias em PDF

---

## 🔐 SEGURANÇA

### Auditoria
- [ ] Listar todos endpoints públicos
- [ ] Validar decorators @Public()
- [ ] Verificar @Roles() em todos endpoints
- [ ] Testar acesso negado por role
- [ ] Verificar isolamento por institutionId

### Rate Limiting
- [ ] Instalar @nestjs/throttler
- [ ] Configurar limites globais
- [ ] Limites /auth/login (5 req/min)
- [ ] Limites /auth/public-register (3 req/min)

### Logs
- [ ] Configurar Winston/Pino
- [ ] Logs de erro
- [ ] Logs de autenticação
- [ ] Logs de ações sensíveis
- [ ] Rotação de logs

---

## 📱 RESPONSIVIDADE

### Testar em:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)
- [ ] Landscape mode

### Corrigir:
- [ ] Tabelas de dados (admin)
- [ ] Formulário de registro
- [ ] Formulários longos (plano de aula, simulados)
- [ ] Dashboards
- [ ] Menu lateral → hambúrguer
- [ ] Gráficos responsivos

### Acessibilidade
- [ ] Contraste de cores (WCAG)
- [ ] Textos alternativos em imagens
- [ ] Labels em inputs
- [ ] Navegação por teclado
- [ ] Semântica HTML
- [ ] ARIA labels

---

## ⚡ PERFORMANCE

### Frontend
- [ ] Lazy load de rotas pesadas
- [ ] Dynamic imports
- [ ] Code splitting por role
- [ ] Otimizar imagens (WebP, lazy load)
- [ ] Analisar bundle (next build --analyze)
- [ ] Remover dependências não usadas
- [ ] Service Worker (PWA - opcional)

### Backend
- [ ] Adicionar índices no Prisma
- [ ] Otimizar N+1 queries
- [ ] Pagination em todas listagens
- [ ] Cache de rankings (Redis - opcional)
- [ ] Background jobs (BullMQ - opcional)

---

## 🚀 DEPLOY

- [ ] Configurar GitHub Actions
- [ ] Testes automatizados
- [ ] Lint e Type checking
- [ ] Build automático
- [ ] Deploy staging
- [ ] Deploy production
- [ ] Variáveis de ambiente
- [ ] Sentry (error tracking)
- [ ] Health checks

---

## 📝 DOCUMENTAÇÃO

- [ ] README.md atualizado
- [ ] Guia de setup dev
- [ ] Swagger API docs
- [ ] Diagramas de arquitetura
- [ ] Schema do banco (ERD)
- [ ] Manual do Aluno (PDF)
- [ ] Manual do Professor (PDF)
- [ ] Manual do Admin (PDF)
- [ ] Vídeos tutoriais

---

## 📊 PROGRESS TRACKER

**Progresso Geral:**
- ✅ Crítico: 2/5 (40%)
- ⬜ Rankings: 0/17 (0%)
- ⬜ SAEB: 0/27 (0%)
- ⬜ IDEB: 0/20 (0%)
- ⬜ Gráficos: 0/16 (0%)
- ⬜ UX: 0/23 (0%)
- ⬜ Segurança: 0/10 (0%)
- ⬜ Responsividade: 0/11 (0%)
- ⬜ Performance: 0/12 (0%)
- ⬜ Deploy: 0/10 (0%)
- ⬜ Docs: 0/9 (0%)

**TOTAL:** 2/160 tarefas (1.25%)

---

**PRÓXIMOS 3 PASSOS:**
1. [ ] Implementar Profile Switcher
2. [ ] Criar sistema de notificações para admin
3. [ ] Começar backend de Rankings

**META SEMANAL:** Completar seção "Crítico" + começar Rankings

**PRAZO ESTIMADO PARA 100%:** 3 meses (13 semanas)

---

_Última atualização: 2025-11-15_
