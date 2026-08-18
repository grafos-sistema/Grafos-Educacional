# Processo de Uso do Sistema

Este documento apresenta a sequência recomendada para implantar uma instituição do zero. Em cada etapa estão indicados o responsável, o que deve ser feito e os vínculos que precisam ser configurados para a etapa seguinte funcionar corretamente.

## Visão geral da sequência

Use esta ordem para evitar cadastros incompletos:

1. Super Admin Global cria a Instituição e os Anexos.
2. Super Admin Global cria os Diretores e vincula cada Diretor ao seu Anexo.
3. Diretor cria os Anos Letivos de cada Anexo sob sua responsabilidade.
4. Diretor cadastra os Cursos.
5. Diretor cadastra as Disciplinas de cada instituição.
6. Diretor cadastra os Coordenadores e os Professores com os dados pessoais e profissionais, sem misturar o cadastro com a distribuição acadêmica.
8. Administrador da Instituição ou Coordenação cria as Turmas, vinculando cada uma a um Curso e a um Ano Letivo.
9. Na tela **Distribuição Acadêmica**, a Coordenação primeiro habilita as Disciplinas de cada Professor e depois distribui Disciplina + Professor nas Turmas.
10. Administrador da Instituição ou Coordenação cadastra os Alunos e realiza suas matrículas nas Turmas.
11. Coordenação configura a Grade de Horários, com revisão do Diretor.
12. Todos os perfis conferem seus acessos e dados antes do início das aulas.

> Regra principal: não é possível vincular corretamente um Professor a uma Turma antes de existirem o Professor, a Disciplina e a Turma. O cadastro do Professor é uma etapa administrativa; os dois vínculos acadêmicos são concluídos pela Coordenação na **Distribuição Acadêmica**.

> **Atenção sobre os dois tipos de vínculo:** habilitar uma Disciplina para o Professor registra o que ele pode lecionar. Isso é diferente de colocar esse Professor em uma Turma. O vínculo operacional **Disciplina + Professor + Turma** é feito pela Coordenação na tela **Distribuição Acadêmica** ou no detalhe da Turma. O Diretor acompanha e revisa esses vínculos, mas não os altera.

## Antes de começar

Se a escola estiver sendo implantada do zero, a equipe de Desenvolvimento — **Super Admin Global**: Eric Victor, Jonhy Moreno e Wesley Martins — deve criar a Instituição e seus Anexos.

O Diretor só conseguirá administrar um Anexo depois que o Super Admin Global vincular seu usuário a esse Anexo. Um Diretor pode ser responsável por mais de um Anexo; nesse caso, o processo de Ano Letivo deve ser repetido para cada Anexo.

## 1. Super Admin Global — criar a estrutura inicial

### 1.1 Criar a Instituição

1. Acesse o cadastro de Instituições.
2. Crie a Instituição e informe os dados básicos, endereço e status.
3. Confirme que a Instituição está ativa.

### 1.2 Criar os Anexos

1. Acesse a Instituição criada.
2. Crie cada Anexo que pertence à Instituição.
3. Informe nome, código, endereço, contato e status de cada Anexo.
4. Revise os dados antes de vincular os responsáveis.

### 1.3 Criar e vincular o Diretor

1. Cadastre o usuário com o perfil **Diretor**.
2. Selecione a Instituição principal.
3. Vincule o Diretor ao Anexo pelo campo de responsabilidade do Anexo.
4. Confira se o Diretor aparece como responsável pelo Anexo correto.
5. Repita o vínculo somente quando o mesmo Diretor também administrar outro Anexo.

> O Super Admin Global prepara a estrutura institucional e os acessos iniciais. A criação dos Anos Letivos dos Anexos é responsabilidade do Diretor vinculado a eles.

## 2. Diretor — criar os Anos Letivos por Anexo

Depois de receber o acesso, o Diretor deve:

1. Entrar no sistema e conferir seus dados pessoais.
2. Acessar **Anos Letivos**.
3. Selecionar o Anexo sob sua responsabilidade.
4. Clicar em **Novo Ano Letivo**.
5. Selecionar o ano; o nome sugerido será preenchido automaticamente, podendo ser alterado.
6. Informar as datas de início e término.
7. Salvar e confirmar que o Ano Letivo está ativo.
8. Repetir os passos para cada Anexo que administra.

> Cada Anexo possui seus próprios Anos Letivos. Não crie um único Ano Letivo e suponha que ele será automaticamente compartilhado por todos os Anexos.

## 3. Diretor — cadastrar Cursos

Os Cursos devem existir antes das Turmas, porque cada Turma precisa estar vinculada a um Curso.

1. Acesse **Cursos**.
2. Cadastre o Curso, seu nome, código, nível e demais informações solicitadas.
3. Confirme que o Curso está ativo.
4. Repita o cadastro para todos os Cursos oferecidos pela Instituição.

## 4. Diretor — cadastrar Disciplinas

As Disciplinas devem existir antes da distribuição acadêmica, pois a Coordenação precisará selecioná-las para habilitar os Professores e distribuí-las nas Turmas.

1. Acesse **Disciplinas**.
2. Cadastre cada Disciplina da Instituição.
3. Informe nome, código, descrição e demais dados solicitados.
4. Confirme que as Disciplinas estão ativas.
5. Revise se a Disciplina pertence à Instituição correta.

## 5. Diretor — cadastrar Coordenadores

1. Acesse **Coordenadores** ou **Todos os Usuários**.
2. Clique em **Novo Coordenador**.
3. Preencha os dados pessoais, contato, Instituição e acesso.
4. Salve o cadastro.
5. Confira se o Coordenador aparece na listagem e se consegue acessar os módulos pedagógicos permitidos.

O Coordenador será responsável principalmente pela distribuição pedagógica: conferir as Turmas, vincular Disciplinas e indicar os Professores responsáveis por cada componente.

## 6. Diretor — cadastrar Professores

O Diretor cadastra a pessoa e o perfil profissional. A distribuição acadêmica fica em uma etapa separada, executada pela Coordenação, para evitar que o cadastro do Professor seja confundido com sua lotação em Turmas.

### 6.1 Criar o Professor

1. Acesse **Professores** ou **Todos os Usuários**.
2. Clique em **Novo Professor**.
3. Preencha os dados pessoais, contato, Instituição e dados profissionais.
4. Salve o cadastro do Professor.
5. Não é necessário escolher Disciplinas ou Turmas nesta etapa.

O Professor aparecerá imediatamente para a Coordenação na tela **Distribuição Acadêmica**.

## 7. Administrador da Instituição ou Coordenação — criar as Turmas

Cada Turma precisa de três referências obrigatórias: **Curso**, **Ano Letivo** e estrutura da Turma.

1. Acesse **Turmas** e clique em **Nova Turma**.
2. Selecione o Curso.
3. Selecione o Ano Letivo do Anexo correto.
4. Selecione a série/ano, seção e turno.
5. Revise o nome sugerido da Turma e a sala, que são preenchidos conforme a configuração.
6. Informe a capacidade máxima de alunos, se necessário.
7. Salve a Turma.
8. Repita para todas as séries, seções e turnos da Instituição.

Após criar cada Turma, siga a etapa **8** para distribuir suas Disciplinas e Professores. O Diretor revisa a estrutura pedagógica; a criação da Turma é executada pelo Administrador da Instituição ou pela Coordenação.

## 8. Coordenação — distribuir Disciplinas, Professores e carga horária

Essa é a etapa que completa o vínculo acadêmico do Professor com as Turmas. O Diretor acompanha e valida a organização; a Coordenação executa a distribuição pedagógica. O Administrador da Instituição apoia os cadastros, mas não substitui a Coordenação na inclusão/remoção da Disciplina da Turma.

O fluxo recomendado é usar **Distribuição Acadêmica**:

1. Acesse **Distribuição Acadêmica**.
2. Selecione um Professor.
3. Marque as Disciplinas que ele pode lecionar e clique em **Salvar disciplinas**.
4. Selecione uma Turma.
5. No painel **Disciplinas da turma selecionada**, escolha uma Disciplina.
6. O seletor de Professor mostrará somente professores habilitados para aquela Disciplina.
7. Informe as horas semanais e clique em **Vincular**.
8. Confira a lista e repita até completar a Turma.

Também é possível abrir o detalhe da Turma e usar o mesmo painel **Disciplinas da Turma**.

Se uma Disciplina ou Professor não aparecer no seletor, revise nesta ordem:

- a Disciplina está cadastrada e ativa;
- o Professor está ativo;
- a Coordenação habilitou a Disciplina no perfil do Professor;
- o Professor e a Turma pertencem à Instituição correta;
- a Turma está vinculada ao Ano Letivo correto.

## 9. Administrador da Instituição ou Coordenação — cadastrar e matricular Alunos

1. Acesse **Alunos** ou **Todos os Usuários**.
2. Cadastre o Aluno com os dados pessoais e escolares solicitados.
3. Informe a Instituição e os dados obrigatórios do cadastro.
4. Cadastre ou vincule pelo menos um Responsável ao Aluno.
5. Matricule o Aluno na Turma correspondente.
6. Confira se a Turma, o Ano Letivo e o Curso estão corretos.
7. Revise documentos, dados de saúde, transporte e contatos quando aplicável.

## 10. Administrador da Instituição ou Coordenação — cadastrar Responsáveis

Quando o Responsável não tiver sido criado durante o cadastro do Aluno:

1. Acesse **Responsáveis** ou **Todos os Usuários**.
2. Cadastre os dados pessoais e de contato.
3. Vincule o Responsável ao Aluno correto.
4. Defina o parentesco e, quando aplicável, se é o contato principal, recebe notificações e está autorizado a retirar o Aluno.
5. Confira o acesso do Responsável ao filho correto.

## 11. Coordenação — configurar a Grade de Horários

Só configure os horários depois de criar as Turmas e distribuir suas Disciplinas e Professores. O Diretor revisa a grade e a Coordenação realiza a configuração operacional.

1. Acesse **Grade de Horários**.
2. Selecione o Ano Letivo, a Turma e a Disciplina.
3. Confira o Professor responsável.
4. Informe dia, horário, carga horária e sala, quando aplicável.
5. Salve e revise conflitos de horário.
6. Repita até completar a grade de cada Turma.

## 12. Coordenador — acompanhar a operação pedagógica

Depois que a estrutura estiver configurada, o Coordenador deve:

1. Conferir se todas as Turmas possuem Disciplinas distribuídas.
2. Conferir se cada Disciplina possui Professor responsável.
3. Revisar a Grade de Horários.
4. Acompanhar planos de aula, conteúdos, atividades e observações.
5. Acompanhar frequência, notas e indicadores.
6. Corrigir ou comunicar ao Diretor qualquer vínculo incorreto ou cadastro pendente.

## 13. Professor — iniciar a rotina escolar

Depois de ter Disciplinas e Turmas vinculadas, o Professor deve:

1. Acessar o sistema e conferir suas Disciplinas.
2. Conferir suas Turmas e a Grade de Horários.
3. Informar ao Coordenador qualquer Disciplina ou Turma ausente.
4. Criar planos de aula e registrar conteúdos.
5. Registrar frequência.
6. Criar atividades e lançar notas conforme o calendário da Instituição.

## 14. Aluno — acompanhar a vida escolar

1. Acessar suas Turmas, Disciplinas e horários.
2. Consultar frequência, notas, atividades e comunicados.
3. Entregar atividades e acompanhar pendências.
4. Solicitar correção de dados ao Diretor ou à Coordenação quando necessário.

## 15. Responsável — acompanhar o Aluno

1. Acessar os Alunos vinculados à sua conta.
2. Consultar notas, frequência, atividades e horários.
3. Conferir comunicados da Instituição.
4. Manter telefone, email e demais dados de contato atualizados.

## Checklist antes do início das aulas

- [ ] Instituição criada e ativa.
- [ ] Anexos criados, revisados e com seus responsáveis definidos.
- [ ] Diretores vinculados aos Anexos corretos.
- [ ] Ano Letivo criado para cada Anexo.
- [ ] Cursos cadastrados e ativos.
- [ ] Disciplinas cadastradas e ativas.
- [ ] Coordenadores cadastrados.
- [ ] Professores cadastrados e vinculados a uma ou mais Disciplinas.
- [ ] Turmas criadas com Curso e Ano Letivo corretos.
- [ ] Disciplinas distribuídas nas Turmas.
- [ ] Professores vinculados às respectivas Turmas e Disciplinas.
- [ ] Carga horária semanal revisada.
- [ ] Alunos cadastrados e matriculados nas Turmas.
- [ ] Responsáveis vinculados aos Alunos.
- [ ] Grade de Horários configurada sem conflitos.
- [ ] Acessos testados com Diretor, Coordenação, Professor, Aluno e Responsável.

## Resumo por responsabilidade

| Responsável | Responsabilidades principais |
| --- | --- |
| Super Admin Global | Criar Instituições, Anexos, Diretores e estrutura global de acesso |
| Diretor | Criar Anos Letivos dos Anexos, Cursos, Disciplinas e usuários; revisar os vínculos acadêmicos |
| Administrador da Instituição / Secretário | Apoiar os cadastros administrativos e escolares conforme as permissões atribuídas |
| Coordenador | Acessar Distribuição Acadêmica, manter os vínculos Professor-Disciplina, distribuir Disciplinas e Professores nas Turmas, revisar horários e acompanhar a operação pedagógica |
| Professor | Conferir seus vínculos, planejar aulas, registrar conteúdos, frequência, atividades e notas |
| Aluno | Consultar sua vida escolar e acompanhar atividades e resultados |
| Responsável | Acompanhar a vida escolar dos Alunos vinculados e manter seus contatos atualizados |
