# 🌐 API Endpoints - To Do List

> Referência rápida de todos os endpoints que precisam ser criados  
> Organize por prioridade de implementação

---

## 🎮 RANKINGS & GAMIFICAÇÃO

### Rankings
```typescript
// Ranking de escolas
GET    /rankings/schools
Query: ?institutionId, ?period (weekly, monthly, yearly)
Response: { schools: [{ id, name, totalPoints, rank, change }] }

// Ranking de turmas
GET    /rankings/schools/:schoolId/classes
Query: ?period
Response: { classes: [{ id, name, totalPoints, avgPoints, rank }] }

// Ranking de alunos da turma
GET    /rankings/classes/:classId
Query: ?period
Response: { students: [{ id, name, points, rank, change, avatar }] }

// Ranking geral de alunos
GET    /rankings/students/:institutionId
Query: ?gradeLevel, ?period
Response: { students: [{ id, name, class, points, rank }], total }

// Posição do aluno
GET    /rankings/student/:studentId
Query: ?period
Response: { rank, points, totalStudents, percentile, change }

// Histórico de ranking
GET    /rankings/student/:studentId/history
Query: ?startDate, ?endDate
Response: { history: [{ date, rank, points }] }

// Recalcular rankings (ADMIN only)
POST   /rankings/recalculate
Body: { period?: 'weekly' | 'monthly' | 'yearly' }
Response: { message, affectedStudents }
```

### Achievements & Badges
```typescript
// Listar badges disponíveis
GET    /achievements/available
Response: { badges: [{ id, name, description, icon, criteria }] }

// Badges do aluno
GET    /achievements/student/:studentId
Response: { 
  unlocked: [{ badgeId, unlockedAt, badge }],
  locked: [{ badgeId, progress, badge }]
}

// Desbloquear badge (automático via sistema)
POST   /achievements/unlock
Body: { studentId, badgeId, context }
Response: { success, badge }

// Histórico de conquistas
GET    /achievements/student/:studentId/history
Response: { achievements: [{ id, badge, unlockedAt }] }
```

### Points System
```typescript
// Calcular pontos (interno, chamado por outros serviços)
POST   /points/calculate
Body: { studentId, type, value, context }
Response: { pointsAwarded, newTotal }

// Histórico de pontos
GET    /points/student/:studentId/history
Query: ?startDate, ?endDate
Response: { transactions: [{ date, type, points, description }] }
```

---

## 📝 SIMULADOS E EXAMES

### Exams CRUD
```typescript
// Criar simulado
POST   /exams
Body: CreateExamDto { title, type, gradeLevel, subjectId, duration, questions }
Roles: TEACHER, ADMIN
Response: { exam }

// Listar simulados
GET    /exams
Query: ?type, ?subjectId, ?gradeLevel, ?institutionId
Response: { exams: [], total }

// Detalhes do simulado
GET    /exams/:examId
Response: { exam, questions: [], totalPoints }

// Simulados SAEB específicos
GET    /exams/saeb
Query: ?gradeLevel, ?subject
Response: { exams: [] }

// Atualizar simulado
PATCH  /exams/:examId
Body: UpdateExamDto
Roles: TEACHER, ADMIN
Response: { exam }

// Deletar simulado
DELETE /exams/:examId
Roles: TEACHER, ADMIN
Response: { message }

// Atribuir simulado a turma/alunos
POST   /exams/:examId/assign
Body: { classIds?: [], studentIds?: [], startDate, endDate }
Roles: TEACHER, ADMIN
Response: { assigned, students: [] }

// Simulados do aluno
GET    /exams/student/:studentId
Query: ?status (pending, completed, in_progress)
Response: { exams: [{ exam, attempt?, deadline }] }
```

### Realizar Simulado
```typescript
// Iniciar tentativa
POST   /exams/:examId/start
Body: { studentId }
Response: { attemptId, questions: [], startTime, duration }

// Responder questão
POST   /exams/:examId/answer
Body: { attemptId, questionId, selectedOption }
Response: { saved, questionNumber, totalQuestions }

// Auto-save (chamado a cada 30s)
POST   /exams/:examId/autosave
Body: { attemptId, answers: [{ questionId, selectedOption }] }
Response: { saved }

// Finalizar simulado
POST   /exams/:examId/submit
Body: { attemptId }
Response: { score, totalQuestions, correctAnswers, attemptId }

// Ver tentativa (review)
GET    /exams/:examId/attempt/:attemptId
Response: { 
  attempt, 
  questions: [{ question, selectedOption, correctOption, isCorrect }],
  score 
}
```

### Resultados e Analytics
```typescript
// Resultados do simulado (turma)
GET    /exams/:examId/results
Query: ?classId
Response: { 
  average, 
  median, 
  stdDev,
  students: [{ studentId, name, score, status }]
}

// Resultado individual
GET    /exams/:examId/results/:studentId
Response: { 
  score, 
  totalQuestions,
  correctAnswers,
  timeSpent,
  proficiencyLevel,
  descriptorAnalysis: [{ descriptor, correct, total }]
}

// Estatísticas gerais do simulado
GET    /exams/:examId/statistics
Response: {
  totalAttempts,
  completed,
  inProgress,
  notStarted,
  averageScore,
  questionStats: [{ questionId, correctRate, avgTime }]
}

// Desempenho do aluno por descritor
GET    /exams/student/:studentId/performance
Query: ?subjectId, ?startDate, ?endDate
Response: {
  descriptors: [{ 
    descriptor, 
    attempts, 
    correctRate, 
    proficiencyLevel,
    recommendations: []
  }]
}
```

### Matriz SAEB
```typescript
// Listar descritores SAEB
GET    /saeb/descriptors
Query: ?subject, ?gradeLevel
Response: { descriptors: [{ code, description, subject, skill }] }

// Descritor por ID
GET    /saeb/descriptors/:descriptorId
Response: { descriptor, questions: [] }

// Questões por descritor
GET    /saeb/descriptors/:descriptorId/questions
Response: { questions: [] }
```

---

## 📊 IDEB TRACKING

### IDEB Básico
```typescript
// IDEB da instituição (atual)
GET    /ideb/institution/:institutionId
Response: { 
  currentIDEB, 
  year,
  approvalRate,
  avgPerformance,
  trend: 'up' | 'down' | 'stable'
}

// Histórico de IDEB
GET    /ideb/institution/:institutionId/history
Query: ?startYear, ?endYear
Response: { 
  history: [{ year, ideb, approvalRate, avgPerformance }]
}

// Projeção de IDEB
GET    /ideb/institution/:institutionId/projection
Response: {
  currentIDEB,
  projectedIDEB,
  projectionYear,
  assumptions: {},
  confidence: 'high' | 'medium' | 'low'
}
```

### Metas e Planos
```typescript
// Definir meta de IDEB
POST   /ideb/goals
Body: { institutionId, year, targetValue, actionPlan }
Roles: ADMIN
Response: { goal }

// Listar metas
GET    /ideb/goals/:institutionId
Response: { 
  goals: [{ id, year, targetValue, currentProgress, status }]
}

// Atualizar meta
PATCH  /ideb/goals/:goalId
Body: { targetValue?, actionPlan? }
Response: { goal }

// Deletar meta
DELETE /ideb/goals/:goalId
Response: { message }
```

### Indicadores
```typescript
// Indicadores detalhados
GET    /ideb/indicators/:institutionId
Query: ?year
Response: {
  approvalRate,
  dropoutRate,
  retentionRate,
  avgPerformance,
  flowIndicator,
  byGradeLevel: [{ grade, approvalRate, avgPerformance }]
}

// Comparar com outras escolas
GET    /ideb/comparison
Body: { institutionId, compareWith?: [] }
Response: {
  institution: { name, ideb },
  comparisons: [{ name, ideb, type }],
  municipal: { avg, rank },
  state: { avg, rank },
  national: { avg }
}
```

### Planos de Ação
```typescript
// Criar plano de ação
POST   /ideb/action-plans
Body: { 
  institutionId, 
  title, 
  description,
  objectives: [],
  actions: [{ action, responsible, deadline }]
}
Roles: ADMIN
Response: { actionPlan }

// Listar planos de ação
GET    /ideb/action-plans/:institutionId
Query: ?status (active, completed, cancelled)
Response: { actionPlans: [] }

// Atualizar plano
PATCH  /ideb/action-plans/:planId
Body: { status?, actions? }
Response: { actionPlan }

// Marcar ação como concluída
POST   /ideb/action-plans/:planId/actions/:actionId/complete
Response: { action, planProgress }
```

---

## 🔔 NOTIFICAÇÕES

### Notificações de Admin
```typescript
// Contar aprovações pendentes
GET    /notifications/pending-approvals-count
Roles: ADMIN
Response: { count }

// Listar notificações do admin
GET    /notifications/admin
Query: ?read (true/false), ?type
Response: { 
  notifications: [{ 
    id, 
    type, 
    title, 
    message, 
    read, 
    createdAt,
    data 
  }]
}

// Marcar como lida
PATCH  /notifications/:notificationId/read
Response: { notification }

// Marcar todas como lidas
POST   /notifications/read-all
Response: { updated }
```

### Notificações Gerais
```typescript
// Notificações do usuário
GET    /notifications/me
Query: ?read, ?type
Response: { notifications: [] }

// Configurações de notificação
GET    /notifications/settings
Response: { emailEnabled, pushEnabled, types: {} }

PATCH  /notifications/settings
Body: { emailEnabled?, pushEnabled?, types? }
Response: { settings }
```

---

## 👤 USERS - Endpoints Adicionais

### Aprovação Rápida
```typescript
// Aprovar usuário rapidamente
POST   /users/:userId/quick-approve
Body: { profileType: 'TEACHER' | 'STUDENT' | 'PARENT', profileData?: {} }
Roles: ADMIN
Response: { user, profile }

// Aprovação em massa
POST   /users/bulk-approve
Body: { 
  users: [{ userId, profileType, profileData? }]
}
Roles: ADMIN
Response: { approved: [], failed: [] }
```

### Perfil Padrão
```typescript
// Definir perfil padrão
PATCH  /users/me/default-profile
Body: { profileType: 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN' }
Response: { user }

// Histórico de acessos
GET    /users/me/access-history
Query: ?limit, ?offset
Response: { 
  accesses: [{ profile, timestamp, ip, userAgent }],
  total 
}
```

---

## 📈 ANALYTICS & REPORTS

### Dashboards
```typescript
// Dashboard do aluno
GET    /analytics/student/:studentId/dashboard
Response: {
  overallAverage,
  attendanceRate,
  currentRank,
  recentGrades: [],
  upcomingExams: [],
  achievements: []
}

// Dashboard do professor
GET    /analytics/teacher/:teacherId/dashboard
Response: {
  classes: [],
  studentsCount,
  avgClassPerformance,
  pendingGrades,
  upcomingClasses: []
}

// Dashboard do admin
GET    /analytics/institution/:institutionId/dashboard
Response: {
  totalStudents,
  totalTeachers,
  avgPerformance,
  attendanceRate,
  currentIDEB,
  trends: {},
  alerts: []
}
```

### Relatórios
```typescript
// Gerar relatório de desempenho
POST   /reports/performance
Body: { 
  type: 'student' | 'class' | 'institution',
  entityId,
  startDate,
  endDate,
  format: 'pdf' | 'csv' | 'xlsx'
}
Response: { reportUrl, expiresAt }

// Relatório de frequência
POST   /reports/attendance
Body: { classId, startDate, endDate, format }
Response: { reportUrl }

// Relatório de IDEB
POST   /reports/ideb
Body: { institutionId, year, format }
Response: { reportUrl }
```

---

## 🔧 CONFIGURAÇÕES E SISTEMA

### Sistema
```typescript
// Health check
GET    /health
Public: true
Response: { status: 'ok', timestamp, version }

// Versão da API
GET    /version
Public: true
Response: { version, buildDate, environment }

// Configurações do sistema (SUPER_ADMIN)
GET    /system/config
Roles: SUPER_ADMIN
Response: { configs: {} }

PATCH  /system/config
Body: { key, value }
Roles: SUPER_ADMIN
Response: { config }
```

---

## 📊 RESUMO POR PRIORIDADE

### ALTA PRIORIDADE (Implementar primeiro)
- ✅ Rankings (9 endpoints)
- ✅ Achievements (4 endpoints)
- ✅ Simulados SAEB (15 endpoints)
- ✅ IDEB (13 endpoints)

### MÉDIA PRIORIDADE
- Notificações (6 endpoints)
- Analytics (3 endpoints)
- Relatórios (3 endpoints)
- Users extras (3 endpoints)

### BAIXA PRIORIDADE
- Sistema (3 endpoints)
- Points detalhado (2 endpoints)

**TOTAL DE ENDPOINTS NOVOS: ~61**

---

**CONVENÇÕES:**
- Todos os endpoints protegidos usam `@UseGuards(JwtAuthGuard)`
- Endpoints de admin usam `@Roles()` decorator
- Responses sempre em formato: `{ data?, error?, message? }`
- Errors seguem padrão HTTP (400, 401, 403, 404, 500)
- Pagination: `?page=1&limit=20`
- Sorting: `?sortBy=createdAt&order=desc`

---

_Última atualização: 2025-11-15_
