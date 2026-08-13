# GRAFOS EDUCACIONAL

## INSTITUIÇÕES

- *Organizar a lógica de vinculo de turmas a instituiçõess*

## DIRETOR

- *Poderá configurar o seu proprio perfil (Foto)*
- *Dúvidas (Criação de Turma):*
  - *Atrelar mais de um professor?*
  - *Vincular apenas uma máteria ao professor?*
  - *Vincular mais de uma materia ao professor e atrelar multiplos professor a turma, as vezes um com uma materia e as vezes outros com mais de uma materia?*
  - \*\*

## COORDENADOR

> *Conteúdo a ser definido.*

***

## PROFESSOR

### Planos de Ensino

- Entender melhor o que é preciso, pela visão do professor, para criar de forma profissional e completa um Plano de Aula.
- *(Adicionar mais itens conforme necessário.)*

### Conteúdos

- *Ver a possibilidade de adicionar um campo de anexar documentos de aulas ministradas*

### Planos de Ensino

## ALUNO

- *Possibilidade de remoção do input de RG e deixar apenas o CPF*

## RESPONSÁVEIS

> *Conteúdo a ser definido.*

## Pending Tasks

- Revisar cada um dos perfis sequêncialmente:
  - Super Admin Global
    - Diretor
      - Coordenador
      - Professor
      - Aluno
        - Responsável

------------------------------------

Chat precisamos padronizar as informações básicas de cadastro de cada tipo de usuário:
- Diretor:
  - Bloco de Foto com nome e CPF embaixo.
  - Dados Pessoais:
    - Nome
    - Sobrenome
    - Nome Social (Remover)
    - Data de Nascimento
    - Sexo
    - CPF
  - Contato:
    - Email
    - Celular
    - Telefone (Opcional)
    - CEP (Busca Automatica e preenchimento automático do endereço)
    - Logradouro
    - Número
    - Complemento
    - Bairro
    - Cidade
    - UFS
  - Instituição:
    - Mostrar a Instituição pegando width: 100% e dentro do bloco dela apenas os anexos que aquele professor está vinculado.

--------------------------

- Coordenador:
  - Bloco de Foto com nome e CPF embaixo.
  - Dados Pessoais:
    - Nome
    - Sobrenome
    - Nome Social (Remover)
    - Data de Nascimento
    - Sexo
    - CPF
    - RG (Remover)
    - Orgão Emissor (Remover)
    - UF (Remover)
    - Data de Emissão (Remover)
    - Nacionalidade (Remover)
  - Contato:
    - Email
    - Celular
    - Telefone (Opcional)
    - CEP (Busca Automatica e preenchimento automático do endereço)
    - Logradouro
    - Número
    - Complemento
    - Bairro
    - Cidade
    - UFS
  - Instituição:
    - Mostrar a Instituição pegando width: 100% e dentro do bloco dela apenas os anexos que aquele professor está vinculado.
  - Acesso (Remover)

--------------------------

- Professor:
  - Bloco de Foto com nome e CPF embaixo.
  - Dados Pessoais:
    - Nome
    - Sobrenome
    - Nome Social (Remover)
    - Data de Nascimento
    - Sexo
    - CPF
    - RG (Remover)
    - Orgão Emissor (Remover)
    - UF (Remover)
    - Data de Emissão (Remover)
    - Nacionalidade (Remover)
  - Contato:
    - Email
    - Celular
    - Telefone (Opcional)
    - CEP (Busca Automatica e preenchimento automático do endereço)
    - Logradouro
    - Número
    - Complemento
    - Bairro
    - Cidade
    - UFS
  - Dados Profissionais:
    - Formação Principal
    - Especialização
    - Registro Profissional (Remover)
    - Data de admissão
  - Instituição:
    - Mostrar a Instituição pegando width: 100% e dentro do bloco dela apenas os anexos que aquele professor está vinculado.
  - Disciplinas:
    - Deve mostrar as disciplinas atreladas à aquele professor
  - Turmas:
    - Deve mostrar as turmas atreladas à aquele professor

--------------------------

- Aluno:
  - Bloco de Foto com nome e CPF embaixo.
  - Dados Pessoais:
    - Nome
    - Sobrenome
    - Nome Social (Remover)
    - Data de Nascimento
    - Sexo
    - CPF
    - RG (Remover)
    - Orgão Emissor (Remover)
    - UF (Remover)
    - Data de Emissão (Remover)
    - Nacionalidade (Remover)

  - Matricula:
    - Matricula (Gerada automaticamente e salva no banco de dados atrelada a aquele aluno)
    - Situação (Remover e jogar um toggle na direção do titulo: Matrícula e subtitulo: Dados acadêmicos e de matrícula lá no cantinho direito)
    - Escola deve puxar as Instituições e selecionada
    - Unidade seria o mesmo que anexo, depois de selecionada a Instituição deve aparecer os anexos em Unidade para ser selecionada.
    - Ano Letivo deve ser via Select


  - Contato:
    - Email
    - Celular
    - Telefone (Opcional)
    - CEP (Busca Automatica e preenchimento automático do endereço)
    - Logradouro
    - Número
    - Complemento
    - Bairro
    - Cidade
    - UFS
  - Dados Profissionais:
    - Formação Principal
    - Especialização
    - Registro Profissional (Remover)
    - Data de admissão
  - Instituição:
    - Mostrar a Instituição pegando width: 100% e dentro do bloco dela apenas os anexos que aquele professor está vinculado.
  - Disciplinas:
    - Deve mostrar as disciplinas atreladas à aquele professor
  - Turmas:
    - Deve mostrar as turmas atreladas à aquele professor

- *Cache Sprite*
- *Corrigir todos os formulários e deixar salvando de forma correta no banco de dados*
- *Organização de Criação de Instituições*
- *Importar Usuários via Excel* 
  - *Iremos (Super Admins Globais) ficar responsáveis por cadastrar esses usuários tratando os dados e importando para o sistema* 

- *Ponto importante sobre o Ano letivo logado como Super Admin Global: Ele deve filtrar obrigatoriamente a Instituição e indicar que uma instituição ainda não tem ano letivo criado*

- *Melhorar seletor de imagem*

## Completed tasks

- *Excesso de espaço laterais* ✅

- *Erro: duplicate key value violates unique constraint "teachers\_registrationNumber\_key" | entender e deixar um alertar mais claro e prático para o usuário final* ✅

- *Cadastrar anexos no cadastro de alunos* ✅
- *Preenchimento automático do endereço após escrita do CEP* ✅
- *Padronizar a selação de UFS* ✅
- *Erro de instituição não encontrada* ✅
- *Esticar tela para ficar pegando de um campo a outro e ajustar os inputs* ✅