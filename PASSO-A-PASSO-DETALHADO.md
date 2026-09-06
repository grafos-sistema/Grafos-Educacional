Ao criar um novo usuário em Curso ou Ano Letivo ou qualquer outro menu sempre que confirmar a criação do novo usuário assim que ele volta para o menu ele deve dá meio que um reload para atualizar o que foi acabado de criar;

## Processo de Uso do Sistema

*Se voce estiver implantando uma escola do zero, siga esta ordem:*

Obs: *É necessário que a equipe de Desenvolvimento (Eric Victor, Jonhy Moreno e Wesley Martins) crie a instituição e o seu(s) anexos pela url /security.

# Ordem 01:

- Criar a Instituitção:
    ✅ Criar o Anexo da Institução.
    ✅ Criar Diretor da Instituição que será vinculado a aquele anexo.
        - Obs: Lembrando que para cadastrar o Diretor é necessário primeiro cadastrar a Instituição;

# Ordem 02 - Logado como Diretor:
    # Estrutura Acadêmica:
        ✅ Anos Letivos:
            1ª Criar Ano Letivo:
                - Clicar em "Novo Ano Letivo" para criar um novo Ano Letivo;
            
            2ª Criar Períodos Acadêmicos:
                - Clicar no botão "Acessar" do Ano Letivo que deseja;
                - Clicar em "Adicionar Período";
                - Selecionar Tipo de Periodo: "Bimestre", "Semestre", "Etc..";
                - Selecionar "Período";
                - Definir "Dia e Mês" do Início e Término do Período;

        ✅ Cursos:
            1ª Criar Cursos:
                - Clicar em "Novo Curso" para criar um novo Curso;
                - Preencher os campos do Curso:
                    - Nome do Curso;
                    - Código do Curso;
                    - Tipo de Curso: "Graduação", "Pos-Graduação", "Outro";
                    - Duração do Curso: Em Anos;
                    - Descrição do Curso;
                - Definir se o Curso estará "Ativo" ou não;

        ✅ Disciplinas:
            1ª Criar Disciplinas:
                - Clicar em "Novo Disciplina" para criar uma nova Disciplina;
                - Preencher os campos da Disciplina:
                    - Nome da Disciplina;
                    - Código da Disciplina;
                    - Descrição da Disciplina;
                - Definir se a Disciplina estará "Ativa" ou não;
                - Obs: 
                    - Disciplinas essenciais para aquele Curso já são criadas automaticamente;
                    - Usuário pode modificar as disciplinas ou criar novas;

        ✅ Turmas:
            1ª Criar Turmas:
                - Clicar em "Novo Turma" para criar uma nova Turma;
                - Preencher os campos da Turma:
                    - Curso: Selecionar o Curso que a Turma pertence;
                    - Ano Letivo: Selecionar o Ano Letivo que a Turma pertence;
                    - Série / Ano: Selecionar a Série / Ano que a Turma pertence;
                    - Turma: Letra da turma: "A", "B", "C", "D", "E", "F";
                    - Turno: Selecionar o Turno que a Turma pertence: "Matutino", "Vespertino";
                    - Nome da Turma: É a combinação do Curso, Ano Letivo, Série / Ano, Turma;
                        - Nome da Turma é gerado automaticamente de acordo com as opções selecionadas;
                    - Capacidade: Quantidade de alunos que podem estar na turma;
                    
# Ordem 03 - Logado como Diretor:
    # Pessoas:
        - Todos os Usuários:
            - Importar em massa: 
                - Clicar em "Importar Usuários"
                - Selecionar Instituição
                - Selecionar Anexo da Instituição
                - Selecioanr "O que deseja importar":
                    - Alunos e professores juntos
                    - Somente professores
                    - Somente alunos
        - Criar Coordenadores
            - Preencher as informações básicas par a criação de Coordenador e selecionar o Anexo que ele irá coordenar
            
            Obs: Caso o Coordenador gerencie Insitituição completa ele irá marcar o checkbox e o não será preciso a seleção de Anexo.

        - Criar Professores.
            - Preencher as informações básicas para a criação de Professor:
                - Dados Pessoais;
                - Contato;
                - Dados Profissionais;
                - Instituição;
                    - Selecionar os Anexos que o professor irá dar Aula;
        
        - Criar Alunos.
            - Preencher as informações básicas para a criação de Aluno:
                - Dados Pessoais;
                - Matrícula;
                - Endereço;
                - Contato;
                - Responsáveis;
                - Saúde;
                - Transporte;
                - Documentos;
            
        Obs: Logado como diretor o cadastro, exclusão e edição desse tipo de usuário são possíveis mas não será possível fazer importações em massa.

# Logado como Diretor ou Coordenador:

    - Para vincular um professor à disciplina:
        1. Entre como Diretor ou Coordenador.
        2. Acesse Professores.
        3. Clique em Editar no professor.
        4. Abra a seção Disciplinas.
        5. Clique em Adicionar disciplina.
        6. Selecione uma ou mais disciplinas e clique em Salvar.

# Ordem 03 - Logado como Super Admin Global:
    # Pessoas:
        - Criar Secretário.
                - Preenchar as informações básicas para a criação de Secretário (Caso a escola tenha)
                - Se o secretário da escola for o próprio diretor deve ser selecionar em: "Promover Diretor para Secretário"
        
        - Criar Coordenadores.
            - Preencher as informações básicas para a criação de Coordenador e selecionar o Anexo que ele irá coordenar

            Obs: Caso o Coordenador gerencie Insitituição completa ele irá marcar o checkbox e o não será preciso a seleção de Anexo.
        
        - Criar Professores.
            - Preencher as informações básicas para a criação de Professor:
                - Dados Pessoais;
                - Contato;
                - Dados Profissionais;
                - Instituição;
                - Disciplinas;
                - Turmas;

            - Importar em Massa:
                - Selecionar "Importar em massa"
                - Escolha a Instituição
                - Selecionar o Anexo da Instituição
                - Selecionar o arquivo
                - Clicar em "Importar"

        
        - Criar Alunos.
            - Preencher as informações básicas para a criação de Aluno:
                - Dados Pessoais;
                - Matrícula;
                - Endereço;
                - Contato;
                - Responsáveis;
                - Saúde;
                - Transporte;
                - Documentos;
        
        - Importar em Massa:
                - Selecionar "Importar em massa"
                - Escolha a Instituição
                - Selecionar o Anexo da Instituição
                - Selecionar o arquivo
                - Clicar em "Importar"
        
        Obs: Logado como super admin global é possível fazer tanto o cadastro individual de cada tipo de usuário mas professores e alunos podem ser importados em massa.

# Ordem 03 - Logado como Coordenador:
    
    ## Disciplinas:
        - Formas de Vincular Disciplinas a Professores:
            - Coordenador acessa o menu Professores e pode vincular disciplinas a cada professor.
            - Coordenador acessa o menu Disciplinas e pode vincular professor a disciplina.

    ## Turmas:
        - Acessando o menu turmas pode criar, editar, ex e vincular disciplinas a cada turma.
        - Acessando o menu de alunos você acessar um aluno e vincular ele a uma turma tanto pela edição do aluno quanto na visualização do aluno.
        

# Tarefa:

    - Chat um erro critico que está passando despercebido é que quando a coordenação tiver criando um Novo Horário por exemplo: se um professor tiver um horário em uma turma ele não poderá ter o mesmo horário em outra turma, resumindo os horário do professor não podem conflitar, ele não poderá estar em duas turmas diferentes na mesma janela de horário. Quando quem for responsável por criar um Novo Horário acabar criando o mesmo professor por exemplo que já tem um horário criado na Segunda das 08:00 as 08:50 e for tentar criar um horário para esse mesmo professor em outra turma diferente só que no mesmo dia e na mesma janela de horário ele deve informar que esse professor já tem aula nesse horário e não permitir a criação de horário para aquele professor nessa janela, se tentarem criar as 08:49 até as 09:40 não deve permitir também pois a aula do professor que já está criada é das 08:00 as 08:50 entende ? então é importane que resolva isso.

    - Dentro de configurações do super admin global deve ter uma tela só para subir essas importações em massa
    - Criar um template para subir professores e alunos em massa;
    - Subir importação em massa das questões;

    - Resolver questão de comunicados internos;

    - Coordenador e Diretor precisam ver os Lançamentos de notas;
    - Professor faz o lançamento da nota e ele irá ter um botão que ele poderá ocultar para todo os alunos e responsáveis mas ficará disponivel para coordenadores e diretores e quando ele quiser ele pode simplismente desocultar a nota e ela ficará disponivel para os alunos e responsáveis.


# Tarefas futuras

## Super Admin Global:
    - Deve conseguir importar professores e alunos em massa.


## Diretor:
    - Comunicados -> Eventos:
        - Poderá selecionar um evento para um aluno ou um grupo de alunos especifico;

## Coordenador:
    - Comunicados -> Eventos:
        - Poderá selecionar um evento para um aluno ou um grupo de alunos especifico;

## Professor:
    - Atividades:
        - Melhorar a Pré visualização das atividades;
        - Melhorar o visual do PDF 


## Aluno:
    - Horários:
        - Estava apresentando um log de erro;
        - Melhorar o visual do PDF 



- [ ] Avaliar a migração do frontend, API e banco para regiões geograficamente próximas, reduzindo a latência entre Vercel, Railway e Supabase.
- [ ] Adicionar Redis para rate limiting compartilhado quando a API passar a executar com mais de uma réplica.
- [ ] Rotacionar a senha antiga do banco e revisar o histórico do repositório para garantir que nenhum segredo permaneça reutilizável.
- [ ] Criar testes E2E autenticados para os fluxos de Super Admin, Diretor, Coordenador, Professor, Aluno e Responsável, incluindo testes de IDOR.
- [ ] Monitorar consultas e rotas acima de 200 ms em produção e criar índices ou cache somente com base nos dados observados.
- [ ] Adicionar testes automatizados de navegador para login, matrícula, horários, notas, comunicados e upload de arquivos.
- [ ] Executar periodicamente um teste documentado de backup e restauração do banco de produção.
- [ ] Planejar a importação em massa de alunos e professores com validação, pré-visualização, relatório de erros e reprocessamento seguro.