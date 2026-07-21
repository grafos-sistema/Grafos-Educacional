# StepByStep

## Objetivo

Este documento descreve o fluxo ideal para colocar uma instituicao em operacao na Grafos, saindo de um ambiente vazio ate um cenario funcional para administradores, coordenadores, professores, alunos e responsaveis.

O foco deste roteiro e seguir a ordem correta de criacao para evitar cadastros incompletos, vinculos quebrados e telas sem dados.

## Visao Geral

O melhor fluxo de implantacao da Grafos nao e fazer tudo com o `SUPER_ADMIN` ate o final.

O fluxo recomendado e:

1. `SUPER_ADMIN` cria a estrutura global e a instituicao.
2. `SUPER_ADMIN` cria o primeiro `INSTITUTION_ADMIN`.
3. `INSTITUTION_ADMIN` estrutura a operacao da escola.
4. `COORDINATOR` e `TEACHER` passam a operar os fluxos pedagogicos.

Essa ordem respeita a arquitetura atual de autenticacao, perfis e acesso por instituicao.

## Regras Importantes

- Todo usuario precisa existir como conta autenticavel e como perfil da aplicacao.
- Professor so fica funcional quando existir como usuario, professor e vinculo com turma/disciplina.
- Aluno so fica funcional quando existir como usuario, aluno e matricula ativa.
- Responsavel so fica funcional quando existir como usuario, responsavel e vinculo com aluno.
- Turma so deve ser criada depois de `Ano Letivo` e `Curso`.
- Ranking, frequencia, notas e monitoramento so fazem sentido depois que a base academica estiver pronta.

## Ordem Ideal de Implantacao

### Passo 1. Criar a instituicao

Responsavel: `SUPER_ADMIN`

Objetivo:
- Criar a escola ou rede que sera operada dentro da Grafos.

O que cadastrar:
- Nome da instituicao
- Dados institucionais basicos
- Status ativo

Resultado esperado:
- A instituicao passa a existir e pode receber usuarios, turmas e configuracoes.

### Passo 2. Criar o primeiro administrador da instituicao

Responsavel: `SUPER_ADMIN`

Objetivo:
- Criar o usuario que vai administrar a escola no dia a dia.

Perfil recomendado:
- `INSTITUTION_ADMIN`

Observacoes:
- O `SUPER_ADMIN` deve delegar a operacao para o administrador da instituicao o quanto antes.
- Isso reduz risco de cadastros feitos no contexto errado e respeita a separacao de acesso por instituicao.

Resultado esperado:
- Existe um usuario responsavel por estruturar toda a operacao da escola.

### Passo 3. Acessar o sistema com o administrador da instituicao

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Passar a fazer os cadastros operacionais no contexto correto da escola.

Resultado esperado:
- Todos os proximos cadastros passam a ser feitos dentro da propria instituicao.

### Passo 4. Criar o ano letivo

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Definir o ciclo academico em que a escola vai operar.

O que cadastrar:
- Ano
- Nome do ano letivo
- Data de inicio
- Data de fim
- Status ativo

Por que esse passo vem cedo:
- Turmas, eventos e parte da estrutura academica dependem do ano letivo.

Resultado esperado:
- A escola passa a ter um ano letivo ativo para vinculacao das turmas.

### Passo 5. Criar cursos

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Definir a estrutura macro da escola.

Exemplos:
- Ensino Fundamental I
- Ensino Fundamental II
- Ensino Medio

Resultado esperado:
- A base de cursos fica pronta para criacao das turmas.

### Passo 6. Criar disciplinas

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Montar a grade de disciplinas da instituicao.

Exemplos:
- Matematica
- Portugues
- Historia
- Ciencias

Resultado esperado:
- A escola passa a ter disciplinas disponiveis para vincular em turmas, horarios, atividades e simulados.

### Passo 7. Criar a equipe de gestao pedagogica

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Estruturar os usuarios que vao coordenar e acompanhar o uso do sistema.

Perfis principais:
- `COORDINATOR`
- `INSTITUTION_ADMIN`

Resultado esperado:
- A escola passa a ter usuarios capazes de acompanhar a operacao pedagogica e administrativa.

### Passo 8. Criar professores

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Cadastrar os professores antes das turmas entrarem em operacao.

Recomendacao:
- Para professores que realmente vao acessar o sistema, prefira fluxo de convite/onboarding quando fizer sentido.
- Para implantacao inicial rapida, o cadastro administrativo direto tambem funciona.

Resultado esperado:
- Os professores passam a existir no sistema como usuarios e como perfis docentes.

### Passo 9. Criar turmas

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Criar as turmas da escola com base na estrutura academica ja pronta.

Dependencias:
- Instituicao criada
- Ano letivo criado
- Curso criado

Exemplos:
- 1 Ano A
- 5 Ano B
- 9 Ano A

Resultado esperado:
- A escola passa a ter turmas prontas para receber alunos, professores e disciplinas.

### Passo 10. Vincular professores, turmas e disciplinas

Responsavel: `INSTITUTION_ADMIN` ou `COORDINATOR`

Objetivo:
- Fazer o professor operar no contexto correto.

Esse e um dos passos mais importantes da implantacao.

Sem esse vinculo:
- O professor existe, mas nao enxerga corretamente `Minhas Disciplinas`.
- O professor nao opera bem frequencia, notas, conteudos e atividades.

O que precisa ficar definido:
- Qual professor leciona cada disciplina
- Em qual turma ele atua
- Qual professor principal da turma, quando aplicavel

Resultado esperado:
- O ambiente do professor passa a funcionar de forma real.

### Passo 11. Criar horarios

Responsavel: `INSTITUTION_ADMIN` ou `COORDINATOR`

Objetivo:
- Organizar a grade semanal das turmas.

Dependencias:
- Turmas criadas
- Disciplinas criadas
- Vinculos entre professor e disciplina ja definidos

Resultado esperado:
- O sistema passa a ter estrutura de horarios consistente para alunos, professores e coordenacao.

### Passo 12. Criar alunos

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Cadastrar os alunos que vao utilizar a escola no sistema.

Observacao importante:
- Criar o aluno como usuario nao e suficiente.
- Ele precisa tambem existir como perfil de aluno.

Resultado esperado:
- Os alunos passam a existir formalmente na base da escola.

### Passo 13. Matricular alunos nas turmas

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Ativar o aluno academicamente.

Esse passo e obrigatorio para que o aluno realmente funcione no sistema.

Sem matricula:
- O aluno existe no cadastro, mas nao opera corretamente.
- Ele pode ficar sem turma, sem horarios e sem contexto academico valido.

Resultado esperado:
- Cada aluno fica vinculado a uma turma de forma ativa.

### Passo 14. Vincular responsaveis aos alunos

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Permitir que o perfil de responsavel tenha filhos vinculados e visualize informacoes corretas.

Observacao:
- No caso de alunos, esse vinculo deve ser tratado como parte natural da implantacao.

Resultado esperado:
- Os responsaveis passam a enxergar os alunos corretos no sistema.

### Passo 15. Validar os acessos por perfil

Responsavel: `INSTITUTION_ADMIN`

Objetivo:
- Confirmar que cada papel esta vendo o que deveria ver.

Checklist:
- O `INSTITUTION_ADMIN` enxerga a operacao da propria escola.
- O `COORDINATOR` enxerga acompanhamento, observacoes e rotinas de coordenacao.
- O `TEACHER` enxerga suas turmas e disciplinas.
- O `STUDENT` enxerga seu dashboard, turma, horarios e dados academicos.
- O `PARENT` enxerga corretamente os filhos vinculados.

Resultado esperado:
- A base de usuarios e acessos fica validada antes da operacao real.

### Passo 16. Iniciar a operacao pedagogica

Responsavel: `TEACHER`, `COORDINATOR` e `INSTITUTION_ADMIN`

Objetivo:
- Comecar o uso real da plataforma.

Fluxos que passam a fazer sentido:
- Lancamento de frequencia
- Lancamento de notas
- Registro de conteudos
- Criacao de atividades
- Criacao de simulados
- Observacoes pedagogicas
- Comunicados
- Monitoramento
- Rankings e gamificacao

Resultado esperado:
- O sistema passa de implantado para operante.

## Melhor Estrategia de Cadastro de Usuarios

Hoje a Grafos suporta dois caminhos principais:

### Opcao 1. Convite e onboarding

Melhor para:
- Administradores
- Coordenadores
- Professores
- Usuarios reais que vao acessar com frequencia

Vantagens:
- Mantem o fluxo mais alinhado com autenticacao moderna
- Reduz erros de perfil
- Melhora a consistencia entre conta e contexto institucional

### Opcao 2. Cadastro administrativo direto

Melhor para:
- Implantacao inicial rapida
- Carga inicial de alunos
- Carga inicial de responsaveis
- Situacoes em que a escola precisa subir a base primeiro e refinar depois

Vantagens:
- Acelera a entrada operacional
- Facilita implantacao em massa

## Fluxo Ideal por Papel

### SUPER_ADMIN

Responsavel por:
- Criar instituicoes
- Criar o primeiro administrador institucional
- Manter governanca global do sistema

Nao deve ficar responsavel por:
- Toda a implantacao detalhada da escola

### INSTITUTION_ADMIN

Responsavel por:
- Estruturar academicamente a escola
- Criar equipe
- Criar cursos, disciplinas, turmas e alunos
- Garantir matriculas e vinculos corretos

### COORDINATOR

Responsavel por:
- Organizar a operacao pedagogica
- Acompanhar professores, turmas e planejamento
- Apoiar na validacao dos vinculos academicos

### TEACHER

Responsavel por:
- Operar o dia a dia pedagogico
- Lancar frequencia
- Lancar notas
- Criar atividades e simulados
- Registrar conteudos

## Erros Comuns a Evitar

- Criar alunos antes de a estrutura academica estar pronta.
- Criar turmas sem ano letivo.
- Criar professores sem vincular disciplina e turma.
- Criar alunos sem matricula ativa.
- Criar responsaveis sem vinculo com aluno.
- Tentar validar ranking antes de haver dados academicos suficientes.
- Fazer toda a operacao com o `SUPER_ADMIN` e depois precisar reorganizar a instituicao.

## Checklist Final de Sistema Operante

Antes de considerar a implantacao concluida, confirme:

- Existe pelo menos 1 instituicao ativa.
- Existe pelo menos 1 `INSTITUTION_ADMIN`.
- Existe 1 ano letivo ativo.
- Existem cursos cadastrados.
- Existem disciplinas cadastradas.
- Existem coordenadores cadastrados.
- Existem professores cadastrados e vinculados.
- Existem turmas cadastradas.
- Existem horarios configurados.
- Existem alunos cadastrados e matriculados.
- Existem responsaveis vinculados.
- Cada perfil consegue acessar o que precisa.

## Exemplo de Sequencia Real Recomendada

Se voce estiver implantando uma escola do zero, siga esta ordem:

1. Criar a instituicao.
2. Criar o primeiro `INSTITUTION_ADMIN`.
3. Entrar com esse administrador.
4. Criar o ano letivo.
5. Criar os cursos.
6. Criar as disciplinas.
7. Criar coordenadores.
8. Criar professores.
9. Criar as turmas.
10. Vincular professores, disciplinas e turmas.
11. Criar os horarios.
12. Criar os alunos.
13. Matricular os alunos.
14. Vincular os responsaveis.
15. Validar acesso de cada perfil.
16. Iniciar frequencia, notas, atividades e demais fluxos pedagogicos.

## Conclusao

O melhor fluxo para deixar a Grafos funcional e com todos os cadastros corretos e preparar primeiro a estrutura institucional e academica, depois a equipe, depois os alunos e por fim a operacao diaria.

Em resumo:

1. Estrutura
2. Equipe
3. Turmas e vinculos
4. Alunos e matriculas
5. Operacao

Seguir essa ordem deixa o sistema consistente, reduz retrabalho e evita que usuarios entrem em telas sem contexto academico completo.
