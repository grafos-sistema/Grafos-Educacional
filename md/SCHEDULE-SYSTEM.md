# Sistema de Grade de Horários - Documentação Completa

## 📋 Visão Geral

O sistema de grade de horários foi completamente integrado ao sistema de gestão escolar, permitindo que coordenadores criem grades realistas e que todos os perfis de usuário possam visualizá-las.

## 🗂️ Estrutura de Dados

### ClassSchedule (Grade de Horários)

```prisma
model ClassSchedule {
  id              String       @id @default(uuid())
  classId         String
  classSubjectId  String
  dayOfWeek       DayOfWeek
  startTime       String
  endTime         String
  room            String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  class           Class        @relation(fields: [classId], references: [id])
  classSubject    ClassSubject @relation(fields: [classSubjectId], references: [id])
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

### Relacionamentos

```
Institution
  └─> AcademicYear
       └─> Class (Turma)
            ├─> ClassSubject (Disciplina + Professor)
            │    └─> ClassSchedule (Grade de Horários)
            └─> ClassEnrollment (Matrícula do Aluno)
```

## 🌱 Seeds Atualizados

### Dados Criados no Seed

O seed agora cria automaticamente:

1. **Instituição**: Escola Teste
2. **Usuários**: Super Admin, Admin, 2 Professores, Aluno, Responsável
3. **Ano Letivo**: 2024 (com 4 bimestres)
4. **Curso**: Ensino Fundamental II
5. **Disciplinas**: Matemática, Português, História, Geografia, Ciências, Inglês
6. **Turmas**: 
   - 7º Ano A (Matutino)
   - 8º Ano B (Vespertino)
7. **ClassSubjects** (Atribuições):
   - João Silva: Matemática e Ciências
   - Ana Costa: Português
8. **ClassSchedules** (Grades de Horários Realistas)

### Grade do 7º Ano A (Matutino: 7:30 - 12:30)

| Dia | 1ª Aula (7:30-8:20) | 2ª Aula (8:20-9:10) | Intervalo | 4ª Aula (10:30-11:20) |
|-----|---------------------|---------------------|-----------|----------------------|
| SEG | Matemática (João)   | Português (Ana)     | 9:10-10:30| Ciências (João)      |
| TER | Matemática (João)   | Português (Ana)     | 9:10-10:30| Ciências (João)      |
| QUA | Matemática (João)   | Português (Ana)     | 9:10-10:30| -                    |
| QUI | Matemática (João)   | Português (Ana)     | 9:10-10:30| Ciências (João)      |
| SEX | Matemática (João)   | Português (Ana)     | 9:10-10:30| Ciências (João)      |

**Total semanal**:
- Matemática: 5 aulas/semana
- Português: 5 aulas/semana
- Ciências: 4 aulas/semana

### Grade do 8º Ano B (Vespertino: 13:30 - 18:30)

| Dia | 1ª Aula (13:30-14:20) | 2ª Aula (14:20-15:10) | Intervalo |
|-----|-----------------------|-----------------------|-----------|
| SEG | Matemática (João)     | Português (Ana)       | 15:10-... |
| TER | Matemática (João)     | Português (Ana)       | 15:10-... |
| QUA | Matemática (João)     | Português (Ana)       | 15:10-... |
| QUI | Matemática (João)     | Português (Ana)       | 15:10-... |
| SEX | Matemática (João)     | Português (Ana)       | 15:10-... |

**Total semanal**:
- Matemática: 5 aulas/semana
- Português: 5 aulas/semana

## 👥 Acesso por Perfil de Usuário

### 1. Coordenador (`/coordinator/schedules`)

**Funcionalidades**:
- ✅ Visualizar todas as grades de todas as turmas
- ✅ Criar novos horários
- ✅ Editar horários existentes
- ✅ Remover horários
- ✅ Validação de conflitos de horário
- ✅ Atribuir salas de aula

**Fluxo de Cadastro**:
1. Acessar `/coordinator/schedules`
2. Selecionar a turma
3. Clicar em "Novo Horário"
4. Preencher:
   - Disciplina (das disciplinas atribuídas à turma)
   - Dia da semana
   - Horário de início
   - Horário de término
   - Sala (opcional)
5. O sistema valida conflitos automaticamente
6. Salvar

### 2. Professor (`/professor/attendance` - Tab "Grade de Horários")

**Funcionalidades**:
- ✅ Visualizar suas próprias grades (disciplinas que leciona)
- ✅ Ver horários organizados por dia da semana
- ✅ Filtrar por disciplina/turma
- ✅ Ver estatísticas (disciplinas, aulas semanais, carga horária)
- ❌ Não pode editar ou criar horários

**Como Acessar**:
1. Login como professor
2. Ir para `/professor/attendance`
3. Clicar na tab "Grade de Horários"
4. Visualizar todos os horários das suas disciplinas

### 3. Aluno (`/aluno/schedule`)

**Funcionalidades**:
- ✅ Visualizar a grade da sua turma
- ✅ Ver todos os horários organizados por dia
- ✅ Ver informações de professores e salas
- ✅ Ver estatísticas da grade
- ❌ Somente leitura

**Interface**:
- Design com gradiente colorido
- Cards organizados por dia da semana
- Cores das disciplinas para fácil identificação
- Estatísticas: total de disciplinas, aulas semanais, carga horária

### 4. Responsável (`/responsaveis/children/[id]/schedule`)

**Funcionalidades**:
- ✅ Visualizar a grade do filho
- ✅ Mesmas informações que o aluno
- ✅ Links rápidos para frequências e notas
- ❌ Somente leitura

**Como Acessar**:
1. Login como responsável
2. Selecionar o filho no dashboard
3. Navegar para "Grade de Horários"
4. Ver a grade completa da turma do filho

## 🔄 Integração com Sistema de Frequência

### Cálculo de Aulas Programadas

O sistema agora calcula automaticamente:

```typescript
// Exemplo de cálculo
const scheduledClassesCount = classSchedulesService.calculateScheduledClasses(
  schedules,        // Grade de horários da disciplina
  startDate,        // Início do período (ex: 01/02/2024)
  endDate           // Fim do período (ex: 15/04/2024)
);
// Resultado: 20 aulas programadas no 1º bimestre
```

### Visualização no Histórico

Na página de frequência do professor, o histórico agora mostra:

```
Histórico de Frequência - Matemática - 7º Ano A
Período: 01/02/2024 a 15/04/2024

📊 Aulas Programadas: 20
✅ Aulas Realizadas: 18
⏸️  Aulas Pendentes: 2
```

Isso permite:
- Comparar aulas programadas vs realizadas
- Identificar atrasos no cronograma
- Planejar melhor as próximas aulas

## 🛠️ API Endpoints

### Coordenador / Admin

```typescript
// Criar horário
POST /classes/:classId/schedules
Body: {
  classSubjectId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | ...;
  startTime: string; // "07:30"
  endTime: string;   // "08:20"
  room?: string;
}

// Listar horários da turma
GET /classes/:classId/schedules

// Atualizar horário
PATCH /schedules/:id
Body: { dayOfWeek?, startTime?, endTime?, room? }

// Remover horário
DELETE /schedules/:id
```

### Professor / Aluno / Responsável

```typescript
// Listar horários da turma
GET /classes/:classId/schedules

// Listar horários de uma disciplina específica
GET /class-subjects/:classSubjectId/schedules
```

## ✅ Validações

### Backend

1. **Conflito de Horário**: Impede criar horários sobrepostos no mesmo dia
2. **Data Validation**: Valida formato de horário (HH:mm)
3. **Relações**: Verifica se ClassSubject pertence à Class
4. **Autorização**: Apenas COORDINATOR e ADMIN podem criar/editar

### Frontend

1. **Conflito de Horário**: Validação local antes de enviar ao backend
2. **Horários Válidos**: Início deve ser antes do término
3. **Campos Obrigatórios**: Disciplina, dia, horário início/fim
4. **Feedback Visual**: Toast notifications para sucesso/erro

## 📊 Utilidades dos Services

### schedulesService.ts

```typescript
// Verificar conflito de horário
hasTimeConflict(schedules, dayOfWeek, startTime, endTime, excludeId?)

// Converter horário para minutos
timeToMinutes(time: string): number

// Ordenar horários
sortSchedules(schedules): Schedule[]

// Agrupar por dia
groupByDay(schedules): Record<string, Schedule[]>

// Traduzir dia
translateDayOfWeek(day: string): string
```

### class-schedules.service.ts

```typescript
// Calcular aulas programadas em um período
calculateScheduledClasses(schedules, startDate, endDate): number

// Obter horários formatados por dia
getFormattedSchedules(schedules): Record<string, ClassSchedule[]>
```

## 🎯 Casos de Uso

### Caso 1: Coordenador criando uma nova grade

1. Coordenador acessa `/coordinator/schedules`
2. Seleciona "7º Ano A"
3. Clica em "Novo Horário"
4. Seleciona "Matemática" (João Silva)
5. Seleciona "Segunda-feira"
6. Define horário: 07:30 - 08:20
7. Define sala: "Sala 101"
8. Sistema valida que não há conflitos
9. Salva com sucesso

### Caso 2: Professor visualizando sua carga horária

1. Professor João acessa `/professor/attendance`
2. Clica na tab "Grade de Horários"
3. Vê todas as suas disciplinas:
   - Matemática - 7º Ano A (5 aulas/semana)
   - Ciências - 7º Ano A (4 aulas/semana)
   - Matemática - 8º Ano B (5 aulas/semana)
4. Filtra por "Matemática - 7º Ano A"
5. Vê horários detalhados de segunda a sexta

### Caso 3: Aluno consultando sua grade

1. Aluno Maria acessa `/aluno/schedule`
2. Vê automaticamente a grade do 7º Ano A
3. Consulta que na segunda-feira tem:
   - 7:30-8:20: Matemática (Prof. João Silva)
   - 8:20-9:10: Português (Profa. Ana Costa)
   - 10:30-11:20: Ciências (Prof. João Silva)

### Caso 4: Responsável verificando horários do filho

1. Pai Carlos acessa `/responsaveis/children/[id]/schedule`
2. Vê a mesma grade que o filho
3. Clica em "Ver Frequências" para verificar presenças
4. Clica em "Ver Notas" para acompanhar desempenho

## 🔐 Credenciais de Teste

Após rodar `npx prisma db seed`:

| Perfil | E-mail | Senha | Acesso à Grade |
|--------|--------|-------|----------------|
| Super Admin | superadmin@sistema.com | senha123 | Todas |
| Admin | admin@escola.com | senha123 | Todas da instituição |
| Coordenador | *(criar manualmente)* | senha123 | Gestão completa |
| Professor | professor@escola.com | senha123 | Suas disciplinas |
| Aluno | aluno@escola.com | senha123 | Sua turma |
| Responsável | pai@email.com | senha123 | Turma do filho |

## 📝 Próximos Passos Recomendados

1. ✅ **Concluído**: Seeds com grades realistas
2. ✅ **Concluído**: Acesso para todos os perfis
3. ✅ **Concluído**: Integração com frequência
4. **Sugerido**: Exportação de grade em PDF
5. **Sugerido**: Notificações de alterações de horário
6. **Sugerido**: Import/export de grades via CSV
7. **Sugerido**: Geração automática de grades (algoritmo)

## 🎉 Conclusão

O sistema de grade de horários está completamente integrado e funcional para todos os perfis de usuário. Os seeds agora criam dados realistas que podem ser usados imediatamente para testes e desenvolvimento.

**Principais Benefícios**:
- ✅ Grades realistas baseadas em turnos escolares
- ✅ Validação de conflitos automática
- ✅ Integração com sistema de frequência
- ✅ Acesso controlado por perfil
- ✅ Interface intuitiva e responsiva
- ✅ Cálculo automático de aulas programadas vs realizadas
