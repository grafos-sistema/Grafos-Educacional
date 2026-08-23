# PASSO A PASSO — TESTE COMPLETO DO GRAFOS

Este documento é o roteiro principal para implantação e validação do Grafos em uma instituição nova. Ele foi escrito para que uma pessoa consiga testar o sistema sozinha, seguindo a ordem correta e conferindo o resultado esperado de cada etapa.

O teste começa com o **Super Admin Global**, passa pelo **Diretor**, pela **Coordenação**, pelo **Professor** e pelo **Aluno**, e termina com o acesso do **Responsável**.

> Use este roteiro em ambiente de teste ou homologação. Os dados criados durante o percurso formam uma cadeia: instituição → anexo → estrutura acadêmica → equipe → turmas → alunos → responsáveis → operação pedagógica.

## 1. Perfis e responsabilidades

| Perfil | Responsabilidade principal no fluxo |
| --- | --- |
| **Super Admin Global** | Criar instituições, anexos e usuários administrativos; importar alunos e professores; acompanhar a configuração geral. |
| **Diretor** | Administrar a instituição/anexo, criar o ano letivo, períodos, cursos, disciplinas, turmas e usuários da unidade. |
| **Coordenador** | Organizar a operação acadêmica: professores, disciplinas, turmas, distribuição, horários, frequência, atividades e acompanhamento das notas. |
| **Professor** | Consultar suas disciplinas e turmas, registrar frequência, conteúdos, atividades e notas. |
| **Aluno** | Consultar sua turma, disciplinas, horários, atividades, frequência e notas publicadas. |
| **Responsável** | Acompanhar os alunos vinculados, comunicados destinados a responsáveis e notas publicadas. |

### Regras importantes antes de começar

- O **Super Admin Global** cria a instituição e seus anexos.
- O **Diretor** deve ficar vinculado ao anexo que irá administrar.
- O anexo é a unidade operacional da escola. Sempre confirme que o usuário, curso, turma, professor e aluno estão no mesmo contexto institucional.
- Apenas **Diretor** e **Coordenador** devem vincular professores a disciplinas e turmas. O Professor apenas consulta seus vínculos.
- O **Professor** só consegue operar turmas depois que sua disciplina e suas turmas estiverem distribuídas.
- O **Aluno** só consegue consultar o fluxo acadêmico depois de possuir matrícula ativa em uma turma.
- O **Responsável** só terá acesso ao sistema se tiver e-mail e uma conta de usuário criada automaticamente ou cadastrada pela equipe.

## 2. Preparação do teste do zero

### 2.1 Conferir o acesso inicial

1. Abra a aplicação pela URL oficial de homologação ou produção autorizada pela equipe.
2. Entre com o usuário **Super Admin Global**.
3. Confirme que o menu administrativo está disponível.
4. Confirme que o usuário está no ambiente correto antes de criar qualquer dado.

### 2.2 Resetar somente um ambiente de teste

O reset deve ser feito somente em banco de desenvolvimento/homologação e pela equipe autorizada.

Antes de limpar:

1. Faça um backup ou confirme que os dados podem ser descartados.
2. Consulte os Super Admin Globais e preserve suas contas:

```sql
select id, email, role, "institutionId"
from public.users
where role = 'SUPER_ADMIN_GLOBAL';
```

3. Liste as instituições e guarde o ID da instituição de teste:

```sql
select id, name, "isActive"
from public.institutions
order by name;
```

4. Use o procedimento de limpeza aprovado pela equipe de desenvolvimento, informando explicitamente o ID da instituição de teste.
5. Nunca use uma exclusão ampla no banco sem confirmar o ambiente, o ID da instituição e a existência de backup.
6. Depois do reset, confirme que os Super Admin Globais continuam acessíveis e que a instituição de teste não possui dados antigos.

## 3. ORDEM 01 — Super Admin Global cria a estrutura institucional

> Em uma implantação nova, a equipe de Desenvolvimento pode executar essa etapa pela rota administrativa `/security`. Depois que a instituição, o anexo e o Diretor estiverem criados, o restante do teste pode ser realizado pelos perfis da própria instituição.

### 3.1 Criar a instituição

1. No menu administrativo, acesse **Instituições**.
2. Clique em **Nova Instituição**.
3. Preencha o nome oficial da instituição.
4. Preencha os dados de contato e endereço, quando disponíveis.
5. Salve.
6. Confirme que a instituição aparece na listagem sem recarregar manualmente a página.
7. Abra a instituição e confirme que os dados permanecem salvos após atualizar a página.

**Resultado esperado:** a instituição foi criada e está disponível para receber anexos e usuários.

### 3.2 Criar o anexo da instituição

1. Dentro da instituição, acesse a área de **Anexos/Unidades**.
2. Clique em **Novo Anexo**.
3. Informe o nome do anexo, endereço, município e UF.
4. Salve.
5. Confirme que o anexo aparece na instituição.
6. Abra a edição do anexo e confirme que a localização permanece preenchida depois de recarregar.

**Resultado esperado:** o anexo está salvo e poderá ser selecionado nos cadastros do Diretor, Coordenador, Professor e Aluno.

### 3.3 Criar o Diretor da instituição

1. Acesse **Todos os Usuários** ou o menu específico de **Diretores**.
2. Clique em **Novo Diretor**.
3. Informe nome, CPF, telefone, e-mail e demais dados obrigatórios.
4. Selecione a instituição.
5. Selecione o anexo que será administrado pelo Diretor.
6. Salve.
7. Anote o e-mail e a senha padrão exibida pelo sistema.
8. Se desejar testar a foto, adicione-a no cadastro ou posteriormente pelo perfil.

**Resultado esperado:** o Diretor aparece na listagem e está vinculado à instituição e ao anexo correto.

### 3.4 Testar o primeiro acesso do Diretor

1. Saia da conta do Super Admin Global.
2. Entre com o e-mail do Diretor e a senha padrão.
3. Confirme que o sistema direciona o usuário para a troca obrigatória de senha no primeiro acesso.
4. Informe a senha atual e uma nova senha diferente da padrão.
5. Confirme a nova senha.
6. Salve.
7. Confirme que o sistema encerra a sessão e volta para a tela de login.
8. Entre novamente com a nova senha.
9. Confirme que o Diretor entra no painel da instituição e do anexo corretos.

> Se o usuário clicar em **Voltar** na tela de troca de senha, o comportamento esperado é sair da sessão e retornar ao login. No próximo acesso, a troca continuará obrigatória.

## 4. ORDEM 02 — Diretor prepara o ano letivo e a estrutura acadêmica

O Diretor deve preparar a estrutura antes de cadastrar a equipe e os alunos. Essa ordem evita que usuários sejam criados sem contexto acadêmico.

### 4.1 Criar o ano letivo

1. Acesse **Anos Letivos**.
2. Clique em **Novo Ano Letivo**.
3. Informe o ano.
4. Confirme que o nome sugerido acompanha o ano selecionado, por exemplo, **Ano Letivo 2026**.
5. Ajuste o nome somente se necessário.
6. Informe a data de início e a data de término.
7. Salve.
8. Abra a visualização e depois a edição.
9. Confirme que o ano, as datas e o status permanecem preenchidos.

### 4.2 Criar os períodos acadêmicos

1. Abra o ano letivo criado.
2. Clique em **Adicionar Período**.
3. Crie os períodos usados pela instituição, por exemplo:
   - 1º Bimestre;
   - 2º Bimestre;
   - 3º Bimestre;
   - 4º Bimestre.
4. Informe nome, tipo, ordem e datas de início e término.
5. Marque os períodos como ativos quando estiverem disponíveis para notas e avaliações.
6. Salve cada período.
7. Confirme que todos aparecem no ano letivo.

**Resultado esperado:** os períodos ativos poderão ser selecionados no lançamento de notas.

### 4.3 Criar os cursos

1. Acesse **Cursos**.
2. Clique em **Novo Curso**.
3. Selecione o nível de ensino.
4. Confirme que o título e o código são sugeridos automaticamente.
5. Revise a sugestão e ajuste se necessário.
6. Salve.
7. Confirme que o curso aparece na listagem imediatamente.

Crie os cursos necessários para o teste, por exemplo:

- Ensino Fundamental I;
- Ensino Fundamental II;
- Ensino Médio.

### 4.4 Criar as disciplinas

1. Acesse **Disciplinas**.
2. Clique em **Nova Disciplina**.
3. Selecione uma disciplina da lista ou informe um nome personalizado.
4. Confirme que o código é sugerido automaticamente.
5. Não procure um campo de cor: a cor visual da disciplina é definida automaticamente pelo sistema.
6. Marque **Disciplina ativa**.
7. Salve.
8. Confirme que a disciplina aparece imediatamente na listagem.
9. Abra a visualização e confirme que ela é somente informativa.
10. Abra a edição para consultar ou alterar a distribuição de professores e turmas.

Para um teste completo, crie pelo menos Matemática, Língua Portuguesa e Ciências.

### 4.5 Criar as turmas

1. Acesse **Turmas**.
2. Clique em **Nova Turma**.
3. Selecione o curso.
4. Selecione o ano letivo.
5. Informe série/ano, nome da turma, turno e capacidade.
6. Marque a turma como ativa.
7. Salve.
8. Confirme que a turma aparece imediatamente na listagem.
9. Abra a edição e confirme que curso, ano, série, turno e status permanecem preenchidos.

Crie pelo menos duas turmas para testar distribuição e conflito de horários, por exemplo:

- EF1 | 1º Ano A | Matutino;
- EF1 | 1º Ano B | Matutino.

### 4.6 Conferir a estrutura antes de seguir

Antes de cadastrar a equipe, confirme:

- instituição e anexo corretos;
- ano letivo ativo;
- períodos acadêmicos ativos;
- cursos cadastrados;
- disciplinas ativas;
- turmas ativas;
- turno preenchido nas turmas.

## 5. ORDEM 03 — Diretor cadastra a equipe e os alunos

### 5.1 Criar o Coordenador

1. Acesse **Coordenadores** ou **Todos os Usuários**.
2. Clique em **Novo Coordenador**.
3. Preencha os dados pessoais, CPF, telefone e e-mail.
4. Selecione a instituição.
5. Escolha uma das opções de abrangência:
   - vincular a um anexo específico; ou
   - indicar que o Coordenador gerencia a instituição inteira e todos os seus anexos.
6. Salve.
7. Teste a validação informando um CPF inválido e confirme que o sistema exibe uma mensagem amigável.
8. Anote o e-mail e a senha padrão.
9. Teste o primeiro login e a troca obrigatória de senha.

### 5.2 Criar o Professor

1. Acesse **Professores**.
2. Clique em **Novo Professor**.
3. Preencha nome, CPF, telefone, e-mail, formação e demais dados profissionais.
4. Selecione a instituição.
5. Selecione o anexo ou os anexos em que o Professor dará aula.
6. Adicione a foto, se desejar testar o upload.
7. Salve.
8. Confirme que ele aparece na listagem.
9. Teste editar e visualizar o Professor.
10. Confirme que a lista de disciplinas dele é apenas para consulta quando o acesso for de Professor.

> O vínculo de disciplina e turma é feito pela Direção ou Coordenação. O Professor não deve configurar suas próprias disciplinas.

### 5.3 Criar o Aluno e seu Responsável

1. Acesse **Alunos** ou **Todos os Usuários**.
2. Clique em **Novo Aluno**.
3. Preencha os dados pessoais e adicione uma foto para testar o upload.
4. Em **Matrícula**, selecione:
   - ano letivo;
   - curso;
   - série/ano;
   - turma;
   - turno;
   - data da matrícula.
5. Confirme que a escola e o anexo correspondem ao contexto do Diretor.
6. Em **Responsáveis**, clique em **Adicionar Responsável**.
7. Preencha nome, data de nascimento, CPF, e-mail, celular e WhatsApp.
8. Selecione o parentesco: Pai, Mãe, Padrasto, Madrasta, Tio, Tia, Avô, Avó, Primo, Prima, Irmão ou Irmã.
9. Marque, conforme o caso:
   - responsável financeiro;
   - recebe notificações;
   - pode retirar o aluno;
   - contato de emergência.
10. Para parentesco Primo/Prima/Irmão/Irmã, confirme a data de nascimento e a maioridade exigida pelo sistema.
11. Se necessário, adicione um segundo responsável. O aluno pode ter até dois contatos de emergência.
12. Preencha Saúde, incluindo alergias, medicamentos, necessidades especiais, restrições alimentares e convênio médico como tags.
13. Salve o aluno.
14. Reabra a edição e confirme especialmente:
   - data de nascimento do responsável;
   - WhatsApp;
   - marcadores de permissões;
   - contato de emergência;
   - turma da matrícula;
   - foto do aluno.
15. Abra a visualização do aluno e confirme que o responsável e a turma aparecem.

Se o responsável tiver e-mail, o sistema poderá criar uma conta para ele. Sem e-mail, ele permanece apenas como registro vinculado ao aluno.

## 6. Importação em massa — somente Super Admin Global

Use a importação em massa quando houver muitos alunos ou professores. Para poucos registros, o cadastro manual facilita a conferência.

### 6.1 Abrir o fluxo

1. Entre como **Super Admin Global**.
2. Acesse **Todos os Usuários**, **Professores** ou **Alunos**.
3. Clique em **Importar em massa**.
4. Selecione a instituição usando a busca pelo nome.
5. Selecione o anexo daquela instituição.
6. Escolha o tipo:
   - Alunos e Professores;
   - somente Professores;
   - somente Alunos.
7. Baixe o modelo correspondente ao tipo escolhido.

O arquivo não precisa repetir instituição e anexo em cada linha, porque esses dados são definidos antes do upload.

### 6.2 Preencher o modelo

1. Não altere os nomes das colunas.
2. Mantenha uma linha de exemplo completa para entender o formato.
3. Para professores, preencha os dados pessoais e profissionais.
4. Para alunos, preencha matrícula, turma e dados completos do responsável.
5. Inclua, quando aplicável, data de nascimento do responsável, parentesco, CPF, e-mail, celular, WhatsApp, responsável financeiro, notificações, retirada do aluno e contato de emergência.
6. Salve o arquivo em CSV ou no formato aceito pelo sistema.

### 6.3 Validar e importar

1. Selecione o arquivo.
2. Confira a pré-visualização.
3. Para professores, confirme que não aparece responsável como campo obrigatório.
4. Para alunos, confirme que o responsável está preenchido.
5. Escolha o modo de importação:
   - **Sequencial:** processa um usuário por vez e facilita a identificação da linha que falhou;
   - **Grupo de 3 a 5:** reduz o tempo sem enviar todos de uma vez;
   - **Grupo de 6 a 10:** indicado para arquivos maiores, mantendo controle do processamento.
6. Passe o mouse no ícone de informação para ler a explicação do modo escolhido.
7. Clique em **Importar**.
8. Acompanhe a barra de progresso verde.
9. Aguarde a conclusão antes de fechar o modal ou atualizar a página.
10. Confira o relatório:
    - linhas verdes: usuários importados com sucesso;
    - linhas vermelhas: falhas com mensagem amigável, por exemplo, **CPF duplicado** ou **e-mail inválido**.
11. Abra a listagem e confirme os usuários criados.
12. Para alunos, abra alguns registros e confira matrícula, responsável e vínculo com a turma.

## 7. ORDEM 04 — Coordenador organiza professores, disciplinas e turmas

### 7.1 Vincular uma disciplina a um professor e às turmas

O fluxo recomendado é centralizar a distribuição na própria disciplina:

1. Entre como **Coordenador**.
2. Acesse **Disciplinas**.
3. Abra a edição da disciplina desejada.
4. Na seção de distribuição, localize o professor pelo campo de busca.
5. Selecione o professor que lecionará a disciplina.
6. Filtre as turmas por curso e turno para reduzir a lista.
7. Selecione as turmas que receberão aquela disciplina.
8. Confira se o professor aparece apenas uma vez e se suas turmas ficam agrupadas.
9. Clique em **Salvar**.
10. Abra a visualização da disciplina e confirme:
    - professor com nome, foto e contato;
    - turmas vinculadas;
    - ausência de controles de edição na visualização.

O mesmo vínculo pode ser consultado no perfil do professor, mas a alteração deve ser feita somente pela Direção ou Coordenação.

### 7.2 Conferir a turma

1. Acesse **Turmas**.
2. Abra a edição ou visualização de uma turma.
3. Confira o bloco de disciplinas da turma.
4. Confira o bloco de professores da turma.
5. Confira os alunos vinculados, com foto e informações básicas.
6. Use a busca para localizar um aluno.
7. Remova um aluno somente se for necessário corrigir a matrícula.
8. Confirme que a alteração também aparece no perfil do aluno, em **Matrícula**.

### 7.3 Criar a grade de horários

1. Acesse **Grade de Horários**.
2. Clique em **Novo Horário**.
3. Selecione turma, disciplina, professor, dia da semana, horário inicial e horário final.
4. Salve.
5. Repita o processo para montar a grade da turma.
6. Filtre por professor e confira seus horários.
7. Teste intencionalmente um conflito:
   - crie uma aula do Professor na segunda-feira, das 08:00 às 08:50;
   - tente criar aula do mesmo Professor em outra turma no mesmo intervalo;
   - tente criar das 08:49 às 09:40.
8. Confirme que o sistema bloqueia os dois casos e explica que o Professor já possui aula naquele horário.

O conflito é proibido quando os intervalos se sobrepõem, mesmo que seja por apenas um minuto. A carga horária do Professor deve ser calculada pela grade, e não digitada manualmente na disciplina.

## 8. ORDEM 05 — Operação do Professor

Entre com o usuário Professor e faça os testes abaixo.

### 8.1 Minhas disciplinas e Minhas turmas

1. Acesse **Minhas Disciplinas**.
2. Confirme que aparecem somente as disciplinas atribuídas ao Professor.
3. Acesse **Minhas Turmas**.
4. Confirme que aparecem apenas turmas nas quais ele possui distribuição.
5. Abra **Ver detalhes** de uma turma.
6. Confirme que a turma abre sem tela branca ou erro de rota.
7. Confira disciplina, alunos, horários e status da turma.

### 8.2 Registrar frequência

1. Acesse **Frequência**.
2. Clique em **Registrar Frequência**.
3. Selecione turma e disciplina.
4. Selecione a data.
5. Confirme que cada aluno aparece com nome e foto.
6. Marque presença, falta ou justificativa.
7. Salve.
8. Reabra o registro e confirme que os dados permanecem salvos.

### 8.3 Registrar conteúdo ministrado

1. Acesse **Conteúdo Ministrado**.
2. Clique em **Novo Conteúdo**.
3. Selecione uma disciplina atribuída ao Professor.
4. Selecione uma turma vinculada, seguindo a sequência curso → série → turma → turno.
5. Informe a data e a descrição do conteúdo.
6. Salve.
7. Confira o conteúdo na listagem.

### 8.4 Criar atividade

1. Acesse **Atividades**.
2. Clique em **Nova Atividade**.
3. Selecione uma disciplina do Professor.
4. Selecione uma turma vinculada.
5. Informe título, descrição, data de aplicação e demais campos.
6. Salve.
7. Confirme que a atividade aparece para a turma correta.

### 8.5 Lançar notas

1. Acesse **Notas**.
2. Na aba **Lançar Notas**, selecione nesta ordem:
   - turma;
   - disciplina disponível naquela turma;
   - período acadêmico do ano letivo;
   - tipo de avaliação.
3. Informe a data da avaliação, peso e descrição, quando necessário.
4. Confirme que os alunos da turma aparecem com nome e foto.
5. Lance a nota de um aluno e salve.
6. Lance a nota de outro aluno em outro dia, se desejar. Não é necessário lançar todos de uma vez.
7. Acesse **Notas Lançadas**.
8. Filtre pela mesma turma, disciplina e período.
9. Use a lupa para pesquisar um aluno.
10. Revise valores e observações.
11. Antes de publicar, abra a visualização de revisão.
12. Mantenha o toggle **Mostrar para alunos** desativado para deixar a nota privada.
13. Publique.
14. Confirme que a Coordenação e a Direção conseguem consultar a nota, mas o Aluno e o Responsável não conseguem vê-la enquanto estiver oculta.
15. Ative **Mostrar para alunos**, publique novamente e confirme que a nota passa a aparecer para o Aluno e o Responsável.

> A data da avaliação é a data em que a prova, trabalho ou outra avaliação ocorreu. Ela não precisa ser a data do lançamento no sistema.

## 9. ORDEM 06 — Acompanhamento da Coordenação e da Direção

Entre como Coordenador e depois como Diretor.

1. Acesse **Notas**.
2. Confira notas lançadas, inclusive as que ainda não foram publicadas para alunos e responsáveis.
3. Confirme turma, disciplina, período, aluno, nota e professor.
4. Acesse **Frequência** e confira os registros feitos pelo Professor.
5. Acesse **Grade de Horários** e filtre por turma e por Professor.
6. Acesse **Atividades** e **Conteúdo Ministrado**.
7. Acesse **Comunicados**.
8. Em **Próximos Eventos**, confira o calendário anual.
9. Crie um evento como Diretor ou Coordenador, selecionando data, tipo, público, local e detalhes.
10. Clique em um dia com evento e confira a visualização do evento.
11. Confirme que usuários sem permissão não conseguem criar eventos.

## 10. ORDEM 07 — Teste do Aluno

1. Saia da conta do Professor.
2. Entre com um usuário Aluno que tenha matrícula ativa.
3. Acesse **Minhas Disciplinas**.
4. Confirme que aparecem somente as disciplinas da turma do Aluno.
5. Acesse **Horários**.
6. Confirme que a grade da turma é exibida.
7. Acesse **Frequência** e confirme os registros publicados para ele.
8. Acesse **Notas**.
9. Confirme que notas ocultas não aparecem.
10. Confirme que notas publicadas aparecem com disciplina, período e avaliação.
11. Acesse **Atividades** e confira as atividades da turma.
12. Acesse **Comunicados** e confirme que o Aluno vê somente comunicados destinados a alunos.
13. Acesse **Configurações** e **Meu Perfil**.
14. Confirme que essas telas carregam normalmente.

## 11. ORDEM 08 — Teste do Responsável

Este é o último teste, porque depende de um Aluno, de uma matrícula, de um responsável vinculado e, quando houver acesso, de um e-mail válido.

1. Abra o perfil do Aluno como Diretor.
2. Acesse **Responsáveis**.
3. Confirme nome, parentesco, data de nascimento, celular, WhatsApp e permissões.
4. Confirme que o responsável está vinculado somente àquele aluno.
5. Confirme que a conta foi criada quando existe e-mail.
6. Saia da conta administrativa.
7. Entre com o e-mail do Responsável e a senha padrão.
8. Se for o primeiro acesso, troque a senha por uma senha diferente da padrão.
9. Entre novamente com a nova senha.
10. Acesse a área de alunos e abra o aluno vinculado.
11. Confira notas publicadas.
12. Confirme que notas ocultas não aparecem.
13. Confira comunicados destinados a responsáveis.
14. Confira dados acadêmicos e demais informações liberadas para esse perfil.
15. Confirme que o Responsável não consegue acessar alunos de outra família.

## 12. Checklist final de aprovação

Marque cada item somente depois de testar na aplicação:

- [ ] Super Admin Global acessa o sistema.
- [ ] Instituição é criada e listada.
- [ ] Anexo é criado, editado e permanece salvo.
- [ ] Diretor é criado e vinculado ao anexo.
- [ ] Primeiro login exige troca de senha.
- [ ] Ano letivo e datas permanecem salvos.
- [ ] Períodos acadêmicos aparecem no lançamento de notas.
- [ ] Cursos, disciplinas e turmas são criados e listados sem recarregar.
- [ ] Turno da turma permanece salvo após edição.
- [ ] Coordenador é criado com abrangência de anexo ou instituição.
- [ ] Professor é criado com seus anexos.
- [ ] Aluno é criado com matrícula ativa.
- [ ] Responsável é criado e permanece vinculado ao aluno.
- [ ] Data de nascimento e WhatsApp do responsável permanecem salvos.
- [ ] Foto de aluno, professor e responsável pode ser salva.
- [ ] Importação de professores funciona.
- [ ] Importação de alunos funciona com responsável completo.
- [ ] Linhas importadas com sucesso e falhas são exibidas no relatório.
- [ ] Professor é vinculado à disciplina e às turmas pela Direção/Coordenação.
- [ ] Professor aparece uma vez, com turmas agrupadas.
- [ ] Conflito de horário do Professor é bloqueado.
- [ ] Frequência exibe nome e foto dos alunos.
- [ ] Conteúdo e atividade são criados.
- [ ] Nota é lançada, revisada e publicada.
- [ ] Nota oculta não aparece para Aluno/Responsável.
- [ ] Nota publicada aparece para Aluno/Responsável.
- [ ] Comunicados e eventos respeitam o público selecionado.
- [ ] Aluno visualiza apenas seus dados.
- [ ] Responsável visualiza apenas os alunos vinculados.
- [ ] Meu Perfil e Configurações carregam para todos os perfis.

## 13. Ordem resumida do processo

1. Super Admin Global cria instituição e anexo.
2. Super Admin Global cria o Diretor.
3. Diretor cria ano letivo e períodos acadêmicos.
4. Diretor cria cursos, disciplinas e turmas.
5. Diretor cria Coordenadores e Professores.
6. Diretor cria Alunos e seus Responsáveis.
7. Coordenação distribui disciplinas, professores e turmas.
8. Coordenação cria a grade de horários.
9. Professor registra frequência, conteúdo, atividades e notas.
10. Direção e Coordenação acompanham os lançamentos.
11. Aluno consulta o que foi liberado.
12. Responsável acessa os alunos vinculados e notas publicadas.

## 14. Tarefas futuras

- [ ] Avaliar a migração do frontend, API e banco para regiões geograficamente próximas, reduzindo a latência entre Vercel, Railway e Supabase.
- [ ] Adicionar Redis para rate limiting compartilhado quando a API passar a executar com mais de uma réplica.
- [ ] Rotacionar a senha antiga do banco e revisar o histórico do repositório para garantir que nenhum segredo permaneça reutilizável.
- [ ] Criar testes E2E autenticados para os fluxos de Super Admin, Diretor, Coordenador, Professor, Aluno e Responsável, incluindo testes de IDOR.
- [ ] Monitorar consultas e rotas acima de 200 ms em produção e criar índices ou cache somente com base nos dados observados.
- [ ] Adicionar testes automatizados de navegador para login, matrícula, horários, notas, comunicados e upload de arquivos.
- [ ] Executar periodicamente um teste documentado de backup e restauração do banco de produção.
- [ ] Planejar a importação em massa de alunos e professores com validação, pré-visualização, relatório de erros e reprocessamento seguro.
