# 📚 Documentação da API - Sistema Grafos

## 🎯 O que é a API?

A **API (Interface de Programação de Aplicações)** é o "cérebro" do sistema Grafos. É ela que processa todas as informações, gerencia os dados e garante que tudo funcione de forma segura e organizada.

Pense na API como o **centro de comando** de uma instituição de ensino: ela recebe pedidos (do site, do aplicativo móvel, etc.), processa as informações e retorna as respostas adequadas.

---

## 🏗️ Arquitetura e Tecnologias

### Tecnologias Utilizadas

#### **NestJS 11** - Framework Backend Moderno
- **O que é**: Framework profissional para construção de APIs robustas e escaláveis
- **Por que usamos**:
  - Código organizado e fácil de manter
  - Suporte nativo para TypeScript (menos erros, mais segurança)
  - Arquitetura modular (cada funcionalidade é independente)
  - Amplamente usado por grandes empresas

#### **Prisma 6** - Gerenciador de Banco de Dados
- **O que é**: Ferramenta moderna para comunicação com o banco de dados
- **Por que usamos**:
  - Consultas seguras e otimizadas
  - Migração de dados facilitada
  - Tipagem automática (menos erros)
  - Validação de dados em tempo real

#### **PostgreSQL** - Banco de Dados Relacional
- **O que é**: Sistema de banco de dados confiável e poderoso
- **Por que usamos**:
  - Gratuito e open-source
  - Extremamente confiável e estável
  - Usado por milhões de empresas no mundo
  - Suporta grandes volumes de dados

#### **JWT (JSON Web Tokens)** - Autenticação Segura
- **O que é**: Padrão moderno para autenticação de usuários
- **Como funciona**: Após o login, o sistema gera uma "chave digital" única que identifica o usuário
- **Vantagens**:
  - Não precisa consultar o banco a cada requisição (mais rápido)
  - Token tem prazo de validade (mais seguro)
  - Impossível falsificar (criptografia)

#### **Swagger/OpenAPI** - Documentação Interativa
- **O que é**: Documentação visual e interativa da API
- **Para que serve**: Desenvolvedores podem testar todos os endpoints diretamente no navegador
- **Acesso**: `http://localhost:3333/api/docs`

---

## 🔐 Sistema de Segurança

### 1. Autenticação JWT

#### Como Funciona o Login?

1. **Usuário envia credenciais** (email + senha)
2. **API verifica no banco de dados** se o usuário existe
3. **Valida a senha** (comparando com o hash armazenado)
4. **Verifica se usuário e instituição estão ativos**
5. **Gera dois tokens**:
   - **Access Token**: válido por 1 dia (para requisições normais)
   - **Refresh Token**: válido por 7 dias (para renovar o access token)
6. **Retorna os tokens** junto com os dados básicos do usuário

#### O que é Hash de Senha?

- **Problema**: Nunca armazenamos senhas em texto puro no banco de dados
- **Solução**: Usamos **bcrypt** para transformar a senha em um código irreversível
- **Exemplo**:
  - Senha: `minhaSenha123`
  - Hash armazenado: `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- **Segurança**: Mesmo que o banco seja invadido, as senhas reais não podem ser recuperadas

### 2. Controle de Acesso (RBAC)

**RBAC** = Role-Based Access Control (Controle de Acesso Baseado em Funções)

#### 6 Níveis de Acesso

| Papel | Descrição | Permissões |
|-------|-----------|------------|
| **SUPER_ADMIN** | Administrador do Sistema | Acesso total, pode gerenciar todas as instituições |
| **INSTITUTION_ADMIN** | Administrador da Instituição | Gerencia tudo dentro da sua instituição |
| **COORDINATOR** | Coordenador Pedagógico | Acompanha professores e alunos, gera relatórios |
| **TEACHER** | Professor | Lança notas, frequências, cria atividades |
| **STUDENT** | Aluno | Consulta suas notas, frequências e tarefas |
| **PARENT** | Pai/Responsável | Acompanha vida escolar dos filhos |

#### Como Funciona na Prática?

**Exemplo 1**: Professor tentando acessar área administrativa
```
❌ NEGADO - Professores não têm permissão para acessar área administrativa
```

**Exemplo 2**: Aluno consultando suas próprias notas
```
✅ PERMITIDO - Alunos podem ver suas próprias informações
```

**Exemplo 3**: Coordenador gerando relatório de uma turma
```
✅ PERMITIDO - Coordenadores têm acesso a relatórios pedagógicos
```

### 3. Proteção Multi-Tenant

**Multi-Tenant** = Múltiplas instituições no mesmo sistema

- Cada instituição **só acessa seus próprios dados**
- Um professor da Escola A **nunca** verá dados da Escola B
- Verificação automática em **todas** as requisições
- Isolamento total entre instituições

### 4. Segurança Adicional

#### Helmet
- Protege contra ataques comuns da web
- Configura headers HTTP seguros
- Previne clickjacking, XSS, etc.

#### Rate Limiting (Throttler)
- Limita número de requisições por IP
- Previne ataques de força bruta
- Previne sobrecarga do servidor

#### CORS (Cross-Origin Resource Sharing)
- Controla quais domínios podem acessar a API
- Configurável por ambiente
- Previne requisições maliciosas

#### Validação de Entrada
- **Todos** os dados recebidos são validados
- Remove campos não esperados automaticamente
- Previne injeção de código malicioso
- Retorna erros claros quando dados são inválidos

---

## 📋 Módulos da API

A API está organizada em **módulos independentes**. Cada módulo cuida de uma área específica do sistema.

### 1️⃣ Módulo de Autenticação (Auth)

**Responsabilidade**: Gerenciar login, registro e tokens

**Endpoints Principais**:
- `POST /api/v1/auth/login` - Login de usuário
- `POST /api/v1/auth/register` - Registro de novo usuário
- `POST /api/v1/auth/refresh` - Renovar access token
- `GET /api/v1/auth/me` - Obter dados do usuário logado

**Exemplo de Login**:
```json
// Requisição
{
  "email": "professor@escola.com",
  "password": "senhaSegura123"
}

// Resposta
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "professor@escola.com",
    "firstName": "João",
    "lastName": "Silva",
    "role": "TEACHER",
    "institutionId": "uuid-da-instituicao"
  }
}
```

### 2️⃣ Módulo de Instituições (Institutions)

**Responsabilidade**: Gerenciar escolas e suas informações

**Funcionalidades**:
- Cadastro de instituições
- Configurações da escola (logo, endereço, contato)
- Ativação/desativação de instituições
- Validação de CNPJ

**Quem pode acessar**: Apenas SUPER_ADMIN

### 3️⃣ Módulo de Usuários (Users)

**Responsabilidade**: Gerenciar contas de usuários

**Funcionalidades**:
- Criar, editar e excluir usuários
- Upload de foto de perfil (avatar)
- Trocar senha
- Validação de CPF
- Filtrar usuários por papel e instituição

**Dados Armazenados**:
- Informações pessoais (nome, CPF, data de nascimento)
- Contato (email, telefone)
- Endereço
- Papel/função no sistema
- Instituição vinculada

### 4️⃣ Módulo de Professores (Teachers)

**Responsabilidade**: Gerenciar perfis de professores

**Funcionalidades**:
- Cadastro de dados profissionais (especialização, formação)
- Número de registro profissional
- Data de contratação
- Listagem de turmas que leciona
- Listagem de disciplinas

**Relações**:
- Um usuário pode ter perfil de professor
- Um professor pode lecionar várias disciplinas
- Um professor pode ter várias turmas

### 5️⃣ Módulo de Alunos (Students)

**Responsabilidade**: Gerenciar perfis de estudantes

**Funcionalidades**:
- Número de matrícula único
- Histórico de matrículas em turmas
- Consulta de notas
- Consulta de frequências
- Relatórios de desempenho

**Relações**:
- Um usuário pode ter perfil de aluno
- Um aluno pode ter vários responsáveis
- Um aluno pode estar matriculado em várias turmas (anos diferentes)

### 6️⃣ Módulo de Pais/Responsáveis (Parents)

**Responsabilidade**: Gerenciar perfis de familiares

**Funcionalidades**:
- Vinculação com estudantes (filhos)
- Definir responsável principal
- Tipo de parentesco (pai, mãe, avô, tio, etc.)
- Receber notificações sobre os filhos

**Importante**: Um responsável pode ter vários filhos matriculados

### 7️⃣ Módulo de Estrutura Acadêmica

#### Anos Letivos (Academic Years)
- Define período escolar (ex: 2024, 2024/2025)
- Datas de início e fim
- Apenas um ano ativo por vez

#### Períodos Acadêmicos (Academic Periods)
- Divide o ano em períodos (bimestres, trimestres, semestres)
- Usado para lançamento de notas
- Cada período tem data de início e fim

#### Cursos (Courses)
- Ensino Fundamental I, II
- Ensino Médio
- Técnico, etc.

#### Disciplinas (Subjects)
- Matemática, Português, História, etc.
- Código e cor para organização

#### Turmas (Classes)
- Ex: "1º Ano A", "9º Ano B"
- Vinculadas a curso e ano letivo
- Capacidade máxima de alunos
- Turno (matutino, vespertino, noturno)

#### Matrículas (Enrollments)
- Vínculo entre aluno e turma
- Data de matrícula
- Status (ativo/inativo)
- Possibilidade de transferência

### 8️⃣ Módulo de Gestão Pedagógica

#### Frequência (Attendances)
- Lançamento individual ou em lote
- Status: Presente, Ausente, Atrasado, Justificado
- Alertas automáticos para faltas excessivas
- Relatórios de frequência

#### Conteúdo de Aula (Lesson Contents)
- Registro do que foi ministrado
- Objetivos da aula
- Atividades realizadas
- Tarefa de casa

#### Plano de Ensino (Lesson Plans)
- Planejamento pedagógico
- Objetivos de aprendizagem
- Metodologia
- Recursos didáticos
- Avaliação

#### Notas (Grades)
- Lançamento de notas
- Tipos de avaliação (prova, trabalho, participação)
- Peso das avaliações
- Cálculo automático de médias
- Publicação controlada (alunos só veem quando publicado)

#### Tarefas Online (Assignments)
- Professor cria tarefa
- Alunos submetem online
- Professor corrige e dá feedback
- Controle de prazo
- Anexos permitidos

#### Observações (Student Observations)
- Registros sobre comportamento
- Observações pedagógicas
- Público ou privado (só coordenação)
- Notifica responsáveis quando necessário

### 9️⃣ Módulo de Banco de Questões

#### Categorias de Questões
- Organização por assunto (Álgebra, Gramática, etc.)
- Vinculadas a disciplinas

#### Questões
- Dois tipos: Múltipla escolha ou Dissertativa
- Níveis de dificuldade (Muito Fácil a Muito Difícil)
- Enunciado e imagens
- Gabarito
- Tags para busca
- Contador de uso

**Importante**: Apenas SUPER_ADMIN pode criar questões (garantia de qualidade)

#### Atividades Impressas
- Professor seleciona questões do banco
- Monta atividade personalizada
- Ordena questões
- Define pontuação
- Gera PDF para impressão
- Gera gabarito separado

### 🔟 Módulo de Comunicação

#### Comunicados (Announcements)
- Avisos gerais da escola
- Define para quem vai (alunos, pais, professores)
- Prioridade (baixa, normal, alta, urgente)
- Anexos permitidos
- Agendamento de publicação
- Data de expiração

#### Notificações (Notifications)
- Enviadas automaticamente pelo sistema:
  - Faltas excessivas
  - Notas baixas
  - Prazo de tarefas
  - Eventos próximos
- Marcação de lida/não lida
- Contador de não lidas

#### Eventos (Events)
- Calendário escolar
- Provas, reuniões, feriados
- Eventos de dia inteiro ou com horário
- Localização
- Cores para organização

### 1️⃣1️⃣ Módulo de Relatórios e Dashboard

#### Relatórios
- Frequência por turma
- Notas por turma
- Desempenho individual
- Resumo pedagógico por professor
- Exportação futura em PDF/Excel

#### Dashboards
- **Coordenador**: Visão geral da instituição
- **Professor**: Suas turmas e pendências
- **Pai**: Desempenho dos filhos
- Estatísticas em tempo real
- Gráficos e indicadores

---

## 🔄 Fluxos Principais

### Fluxo 1: Login com Múltiplos Perfis

```
1. Usuário acessa página de login
2. Insere email e senha
3. API verifica credenciais
4. API busca perfis vinculados (Teacher, Student, Parent)
5. API gera tokens JWT
6. Retorna:
   - Tokens (accessToken, refreshToken)
   - Dados do usuário
   - Lista de perfis disponíveis
7. Frontend verifica:
   - Se 1 perfil: redireciona para dashboard correspondente
   - Se 2+ perfis: mostra tela de seleção de perfil
8. Usuário escolhe perfil ativo
9. Sistema armazena escolha
10. Redireciona para dashboard
```

**Exemplo de Resposta da API**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "abc-123",
    "email": "joao@escola.com",
    "firstName": "João",
    "lastName": "Silva",
    "role": "TEACHER",
    "institutionId": "inst-456",
    "teacherProfile": {
      "id": "teacher-789",
      "specialization": "Matemática",
      "isActive": true
    },
    "parentProfile": {
      "id": "parent-101",
      "isActive": true
    }
  }
}
```

No exemplo acima, João é **professor E pai** ao mesmo tempo.

### Fluxo 2: Professor Lançando Notas

```
1. Professor faz login
2. Acessa dashboard de professor
3. Seleciona turma
4. Seleciona disciplina
5. Escolhe período acadêmico
6. Escolhe tipo de avaliação (prova, trabalho)
7. Lança notas dos alunos
8. Pode lançar individualmente ou em lote
9. Notas ficam com status "PENDENTE"
10. Professor revisa
11. Publica as notas (status "PUBLICADO")
12. Sistema envia notificação para alunos e pais
13. Se nota baixa: notificação especial para responsáveis
```

### Fluxo 3: Pai Acompanhando Filho

```
1. Pai faz login
2. Acessa dashboard de pais
3. Vê lista de filhos vinculados
4. Seleciona um filho
5. Vê informações:
   - Notas de todas as disciplinas
   - Frequências (faltas, atrasos)
   - Próximas tarefas e prazos
   - Observações dos professores (não privadas)
   - Comunicados da escola
6. Pode ver relatório completo de desempenho
7. Recebe notificações automáticas sobre:
   - Faltas excessivas
   - Notas baixas
   - Reuniões de pais
```

### Fluxo 4: Criação de Atividade Impressa

```
1. Professor acessa banco de questões
2. Filtra por:
   - Disciplina
   - Categoria
   - Dificuldade
   - Tipo (múltipla escolha ou dissertativa)
   - Tags
3. Seleciona questões desejadas
4. Cria nova atividade
5. Adiciona questões selecionadas
6. Ordena questões
7. Define pontuação de cada questão
8. Customiza cabeçalho (nome da escola, turma, data)
9. Visualiza prévia
10. Gera PDF para impressão
11. Gera gabarito separado (opcional)
12. Sistema incrementa contador de uso das questões
```

---

## 📊 Banco de Dados

### Modelo de Dados

O banco de dados está organizado em **29 tabelas** principais:

#### Tabelas de Usuários e Autenticação
- `users` - Usuários do sistema
- `institutions` - Instituições/escolas
- `teachers` - Perfil de professor
- `students` - Perfil de aluno
- `parents` - Perfil de responsável
- `student_parents` - Vínculo aluno-responsável

#### Tabelas de Estrutura Acadêmica
- `academic_years` - Anos letivos
- `academic_periods` - Períodos (bimestres, etc.)
- `courses` - Cursos oferecidos
- `subjects` - Disciplinas
- `classes` - Turmas
- `class_subjects` - Disciplina em turma (professor que leciona)
- `class_enrollments` - Matrículas
- `class_schedules` - Grade horária

#### Tabelas Pedagógicas
- `attendances` - Frequências
- `lesson_contents` - Conteúdo de aulas
- `lesson_plans` - Planos de ensino
- `grades` - Notas
- `assignments` - Tarefas online
- `assignment_submissions` - Entregas de tarefas
- `student_observations` - Observações

#### Tabelas de Questões
- `question_categories` - Categorias
- `questions` - Banco de questões
- `question_options` - Opções de múltipla escolha
- `activities` - Atividades impressas
- `activity_questions` - Questões em atividade

#### Tabelas de Comunicação
- `announcements` - Comunicados
- `notifications` - Notificações
- `events` - Eventos/calendário

### Relacionamentos Importantes

#### Um Usuário, Múltiplos Perfis
```
User (1) --- (0..1) Teacher
         --- (0..1) Student
         --- (0..1) Parent
```

**Interpretação**: Um usuário pode ser professor, aluno e pai simultaneamente, ou apenas um deles.

#### Estrutura Acadêmica
```
Institution (1) --- (*) AcademicYear
                --- (*) Course
                --- (*) Subject
                --- (*) Class

AcademicYear (1) --- (*) AcademicPeriod
                 --- (*) Class

Class (1) --- (*) ClassEnrollment (vínculo com alunos)
          --- (*) ClassSubject (vínculo com disciplinas e professor)
```

#### Sistema de Notas
```
Grade (*) --- (1) Student
          --- (1) ClassSubject (turma + disciplina + professor)
          --- (1) AcademicPeriod
          --- (1) Teacher
```

**Interpretação**: Cada nota está vinculada a um aluno, uma disciplina específica de uma turma, um período e o professor que lançou.

---

## 🚀 Desempenho e Escalabilidade

### Otimizações Implementadas

#### 1. Índices no Banco de Dados
- Consultas mais rápidas
- Busca por email, CPF, role, instituição otimizada

#### 2. Queries Otimizadas
- Uso de `select` para buscar apenas campos necessários
- Uso de `include` criterioso para relacionamentos
- Paginação em listagens

#### 3. Validação de Dados
- Validação no backend (não confia no frontend)
- Remoção automática de campos inválidos
- Conversão automática de tipos

### Capacidade do Sistema

- **Usuários simultâneos**: Suporta milhares de acessos simultâneos
- **Instituições**: Ilimitadas (multi-tenant)
- **Alunos por instituição**: Ilimitado
- **Questões no banco**: Ilimitadas
- **Armazenamento**: Escalável (suporta S3, Google Cloud Storage, etc.)

---

## 📖 Documentação Interativa (Swagger)

### Como Acessar

1. Inicie a API: `npm run start:dev`
2. Acesse no navegador: `http://localhost:3333/api/docs`

### O que Você Pode Fazer

✅ **Ver todos os endpoints** organizados por módulo
✅ **Ler descrição detalhada** de cada endpoint
✅ **Ver exemplos** de requisições e respostas
✅ **Testar endpoints diretamente** no navegador
✅ **Autenticar** uma vez e usar em todos os testes
✅ **Buscar** endpoints por palavra-chave
✅ **Ver tempo de resposta** de cada requisição

### Exemplo de Uso do Swagger

1. Abra `http://localhost:3333/api/docs`
2. Vá até a seção **Auth**
3. Clique em `POST /api/v1/auth/login`
4. Clique em **"Try it out"**
5. Preencha o JSON com email e senha
6. Clique em **"Execute"**
7. Copie o `accessToken` retornado
8. Clique no botão **"Authorize"** no topo
9. Cole o token e clique em **"Authorize"**
10. Agora você pode testar todos os endpoints protegidos!

---

## 🛡️ Segurança - Resumo

### Autenticação
✅ JWT com tokens de acesso e renovação
✅ Senhas com hash bcrypt (10 rounds)
✅ Tokens com tempo de expiração
✅ Verificação de usuário e instituição ativos

### Autorização
✅ RBAC (6 níveis de acesso)
✅ Verificação em cada endpoint
✅ Multi-tenant (isolamento entre instituições)
✅ Ownership (usuário só acessa seus dados)

### Proteções
✅ Helmet (headers HTTP seguros)
✅ Rate limiting (limite de requisições)
✅ CORS configurável
✅ Validação de entrada
✅ Sanitização de dados
✅ Remoção automática de campos não autorizados

### Boas Práticas
✅ Senhas nunca armazenadas em texto puro
✅ Tokens armazenados em cookies httpOnly
✅ Logs de todas as ações importantes
✅ Validação em múltiplas camadas
✅ Mensagens de erro genéricas (não expõe informações sensíveis)

---

## 🔮 Próximos Passos

### Em Desenvolvimento
- [ ] Upload de arquivos para S3/Cloud Storage
- [ ] Geração de PDF de atividades
- [ ] Exportação de relatórios em Excel
- [ ] Sistema de cache (Redis) para melhor performance
- [ ] Notificações em tempo real (WebSockets)
- [ ] Integração com serviços de email
- [ ] Backup automático do banco de dados

### Planejado
- [ ] Aplicativo móvel (React Native)
- [ ] Sistema de mensagens entre usuários
- [ ] Videochamadas para reuniões online
- [ ] Biblioteca de recursos didáticos
- [ ] Sistema de gamificação para alunos
- [ ] Integração com sistemas de pagamento

---

## 📞 Informações Técnicas

### Requisitos do Sistema

**Servidor**:
- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- Memória RAM: 2GB mínimo, 4GB recomendado
- Armazenamento: 10GB mínimo

**Desenvolvimento**:
- npm ou yarn
- Git
- Editor de código (VS Code recomendado)

### Variáveis de Ambiente

```env
# Aplicação
APP_NAME=Sistema de Gestão Escolar
APP_PORT=3333
APP_ENV=development

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/grafos

# JWT
JWT_SECRET=chave-secreta-super-segura
JWT_REFRESH_SECRET=chave-refresh-super-segura
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Segurança
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3333
```

### Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar migrations do banco
npx prisma migrate dev

# Gerar client do Prisma
npx prisma generate

# Iniciar em modo desenvolvimento
npm run start:dev

# Iniciar em modo produção
npm run build
npm run start:prod

# Rodar testes
npm run test

# Ver documentação Swagger
# Inicie a aplicação e acesse: http://localhost:3333/api/docs
```

---

## 📝 Glossário

**API**: Interface de Programação de Aplicações - permite que sistemas conversem entre si

**Endpoint**: Um "endereço" específico na API (ex: `/api/v1/auth/login`)

**JWT**: JSON Web Token - formato de token de autenticação

**Hash**: Transformação irreversível de dados (usado para senhas)

**RBAC**: Role-Based Access Control - controle de acesso por função/papel

**Multi-tenant**: Múltiplas organizações usando o mesmo sistema, com dados isolados

**Middleware**: Código que roda antes de processar uma requisição (usado para autenticação, validação, etc.)

**Migration**: Versionamento e aplicação de mudanças no banco de dados

**DTO**: Data Transfer Object - objeto que define o formato de dados aceito

**Swagger**: Ferramenta de documentação interativa de APIs

**CORS**: Cross-Origin Resource Sharing - controle de acesso entre domínios diferentes

**Seed**: Dados iniciais/exemplos para popular o banco de dados

---

## ✅ Status do Projeto

### Implementado ✅
- [x] Autenticação JWT completa
- [x] Sistema de múltiplos perfis
- [x] Todos os módulos CRUD
- [x] RBAC completo
- [x] Documentação Swagger
- [x] Validações de dados
- [x] Segurança (Helmet, Rate Limiting, CORS)
- [x] Multi-tenant
- [x] Banco de questões
- [x] Sistema de atividades impressas
- [x] Dashboards
- [x] Relatórios básicos

### Em Desenvolvimento 🚧
- [ ] Testes automatizados (unitários e E2E)
- [ ] Upload de arquivos
- [ ] Geração de PDFs
- [ ] Sistema de cache


**Desenvolvido com ❤️ para transformar a educação**

*Grafos - Sistema de Gestão Escolar © 2025*
