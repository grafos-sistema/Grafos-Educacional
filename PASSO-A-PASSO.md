## Processo de Uso do Sistema

*Se voce estiver implantando uma escola do zero, siga esta ordem:*

Obs: *É necessário que a equipe de Desenvolvimento (Eric Victor, Jonhy Moreno e Wesley Martins) crie a instituição e o seu(s) anexos pela url /security.

# Ordem 01:

- Criar a Instituitção:
    - Criar o Anexo da Institução.
    - Criar Diretor da Instituição que será vinculado a aquele anexo.

# Ordem 02 - Logado como Diretor:
    # Estrutura Acadêmica:
        - Criar Anos Letivos.
            - Criar Periodos Acadêmicos.
        - Criar Cursos.
        - Criar Disciplinas.
        - Criar Turmas.

    # Equipe:
        - Criar Coordenadores.
        - Criar Professores.
        - Criar Alunos.
            - Criar Responsáveis.

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


--------------------------------

# Resetar o banco para teste:

- Etapa 01:

select id, email, role, "institutionId"
from public.users
where role = 'SUPER_ADMIN_GLOBAL';

select id, name, "isActive"
from public.institutions;

-----------

- Etapa 02:

Guarde o id da instituição: df0a49d1-9dd8-4131-ac6a-71f3ce281240

-----------

- Etapa 03:










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
