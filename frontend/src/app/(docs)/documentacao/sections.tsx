import type { ReactNode } from "react";

export type DocumentationSection = {
  id: string;
  group: string;
  title: string;
  summary: string;
  toc: { id: string; label: string }[];
  content: ReactNode;
};

const ordered = (...items: ReactNode[]) => (
  <ol>
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ol>
);

const unordered = (...items: ReactNode[]) => (
  <ul>
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export const documentationSections: DocumentationSection[] = [
  {
    id: "inicio",
    group: "Comece aqui",
    title: "Introdução",
    summary:
      "Roteiro completo para testar e operar o Grafos na sequência correta, do Super Admin Global ao Responsável.",
    toc: [
      { id: "objetivo", label: "Objetivo do roteiro" },
      { id: "perfis", label: "Perfis e responsabilidades" },
      { id: "regras", label: "Regras antes de começar" },
    ],
    content: (
      <>
        <p id="objetivo">
          Este é o roteiro principal para implantação e validação do Grafos em
          uma instituição nova. Siga as etapas na ordem: cada cadastro cria os
          vínculos necessários para a próxima etapa.
        </p>
        <h2 id="perfis">Perfis e responsabilidades</h2>
        <div className="docs-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Responsabilidade no fluxo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Super Admin Global</td>
                <td>
                  Cria instituições, anexos e usuários administrativos; importa
                  alunos e professores.
                </td>
              </tr>
              <tr>
                <td>Diretor</td>
                <td>
                  Administra a instituição, ano letivo, períodos, cursos,
                  disciplinas, turmas e usuários.
                </td>
              </tr>
              <tr>
                <td>Coordenador</td>
                <td>
                  Organiza professores, disciplinas, turmas, distribuição,
                  horários e acompanhamento pedagógico.
                </td>
              </tr>
              <tr>
                <td>Secretário</td>
                <td>
                  Apoia os cadastros e a manutenção dos dados administrativos
                  conforme as permissões da instituição.
                </td>
              </tr>
              <tr>
                <td>Professor</td>
                <td>
                  Consulta seus vínculos e registra frequência, conteúdo,
                  atividades e notas.
                </td>
              </tr>
              <tr>
                <td>Aluno</td>
                <td>
                  Consulta turma, disciplinas, horários, atividades, frequência
                  e notas publicadas.
                </td>
              </tr>
              <tr>
                <td>Responsável</td>
                <td>
                  Acompanha alunos vinculados, comunicados e notas publicadas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <h2 id="regras">Regras antes de começar</h2>
        {unordered(
          <>
            O Super Admin Global cria instituição e anexos; o Diretor administra
            o anexo recebido.
          </>,
          <>
            Confirme que usuários, cursos, turmas, professores e alunos estão no
            mesmo contexto institucional.
          </>,
          <>
            Apenas Diretor e Coordenador vinculam professores a disciplinas e
            turmas; o Professor somente consulta.
          </>,
          <>
            O Professor só opera depois que sua disciplina, turma e grade
            estiverem configuradas.
          </>,
          <>
            O Aluno precisa de matrícula ativa; o Responsável precisa estar
            vinculado a um aluno.
          </>,
        )}
        <div className="docs-callout">
          <strong>Como usar:</strong> execute o teste inteiro e marque o
          checklist final somente depois de confirmar o resultado na aplicação.
        </div>
      </>
    ),
  },
  {
    id: "super-admin",
    group: "Ordem do fluxo",
    title: "ORDEM 01 — Super Admin Global",
    summary:
      "Criar a estrutura institucional e entregar o acesso inicial ao Diretor.",
    toc: [
      { id: "acesso-security", label: "Acesso inicial" },
      { id: "criar-instituicao", label: "Criar instituição" },
      { id: "criar-anexo", label: "Criar anexo" },
      { id: "criar-diretor", label: "Criar Diretor" },
      { id: "primeiro-login-diretor", label: "Primeiro acesso" },
    ],
    content: (
      <>
        <h2 id="acesso-security">Acesso inicial</h2>
        {ordered(
          <>
            Abra a aplicação pela rota administrativa <strong>/security</strong>
            .
          </>,
          <>
            Entre com o usuário <strong>Super Admin Global</strong>.
          </>,
          <>
            Confirme o menu administrativo e o ambiente correto antes de criar
            dados.
          </>,
        )}
        <h2 id="criar-instituicao">Criar a instituição</h2>
        {ordered(
          <>
            Acesse <strong>Instituições</strong> e clique em{" "}
            <strong>Nova Instituição</strong>.
          </>,
          <>Preencha o nome oficial, contato e endereço quando disponíveis.</>,
          <>
            Salve, confirme a instituição na listagem e abra o registro para
            conferir os dados.
          </>,
        )}
        <p className="docs-result">
          <strong>Resultado esperado:</strong> a instituição está disponível
          para receber anexos e usuários.
        </p>
        <h2 id="criar-anexo">Criar o anexo da instituição</h2>
        {ordered(
          <>
            Dentro da instituição, acesse <strong>Anexos/Unidades</strong> e
            clique em <strong>Novo Anexo</strong>.
          </>,
          <>Informe nome, endereço, município e UF.</>,
          <>Salve e confirme que o anexo aparece e pode ser editado.</>,
        )}
        <p className="docs-result">
          <strong>Resultado esperado:</strong> o anexo poderá ser selecionado
          nos cadastros do Diretor, Coordenador, Professor e Aluno.
        </p>
        <h2 id="criar-diretor">Criar o Diretor</h2>
        {ordered(
          <>
            Acesse <strong>Todos os Usuários</strong> ou{" "}
            <strong>Diretores</strong> e clique em <strong>Novo Diretor</strong>
            .
          </>,
          <>
            Informe nome, CPF, telefone, e-mail e demais campos obrigatórios.
          </>,
          <>Selecione a instituição e o anexo administrado pelo Diretor.</>,
          <>Salve e anote o e-mail de acesso.</>,
          <>
            A senha inicial é formada pelos{" "}
            <strong>6 primeiros dígitos do CPF</strong>.
          </>,
        )}
        <h2 id="primeiro-login-diretor">Testar o primeiro acesso</h2>
        {ordered(
          <>Saia da conta global.</>,
          <>Entre com o e-mail do Diretor e os 6 primeiros dígitos do CPF.</>,
          <>Confirme o redirecionamento para a troca obrigatória de senha.</>,
          <>
            Informe a senha atual, crie uma nova senha, salve e entre novamente.
          </>,
          <>Confirme que o painel mostra a instituição e o anexo corretos.</>,
        )}
        <div className="docs-callout">
          <strong>Importante:</strong> depois da troca, a senha inicial deixa de
          valer. Se o usuário sair sem alterar, a troca continuará obrigatória
          no próximo acesso.
        </div>
      </>
    ),
  },
  {
    id: "diretor-estrutura",
    group: "Ordem do fluxo",
    title: "ORDEM 02 — Diretor prepara a estrutura",
    summary:
      "Criar ano letivo, períodos, cursos, disciplinas e turmas antes da equipe e dos alunos.",
    toc: [
      { id: "ano-letivo", label: "Ano letivo" },
      { id: "periodos", label: "Períodos acadêmicos" },
      { id: "cursos", label: "Cursos" },
      { id: "disciplinas", label: "Disciplinas" },
      { id: "turmas", label: "Turmas" },
      { id: "conferir-estrutura", label: "Conferência" },
    ],
    content: (
      <>
        <p>
          Faça esta etapa antes de cadastrar a equipe e os alunos. Assim, os
          usuários já poderão ser vinculados a uma estrutura existente.
        </p>
        <h2 id="ano-letivo">Criar o ano letivo</h2>
        {ordered(
          <>
            Acesse <strong>Anos Letivos</strong> e clique em{" "}
            <strong>Novo Ano Letivo</strong>.
          </>,
          <>
            Informe o ano e confira o nome sugerido, como{" "}
            <strong>Ano Letivo 2026</strong>.
          </>,
          <>
            Informe as datas de início e término, salve e confira status,
            visualização e edição.
          </>,
        )}
        <h2 id="periodos">Criar os períodos acadêmicos</h2>
        {ordered(
          <>
            Abra o ano letivo e clique em <strong>Adicionar Período</strong>.
          </>,
          <>Crie 1º, 2º, 3º e 4º Bimestre.</>,
          <>Informe nome, tipo, ordem e datas de início e término.</>,
          <>
            Marque como ativo, salve cada período e confirme que todos aparecem
            no ano letivo.
          </>,
        )}
        <p className="docs-result">
          <strong>Resultado esperado:</strong> os períodos ativos poderão ser
          usados no lançamento de notas e no acompanhamento.
        </p>
        <h2 id="cursos">Criar os cursos</h2>
        {ordered(
          <>
            Acesse <strong>Cursos</strong> e clique em{" "}
            <strong>Novo Curso</strong>.
          </>,
          <>
            Selecione o nível de ensino e revise o título e o código sugeridos.
          </>,
          <>
            Salve e confirme a listagem. Para o teste, crie Ensino Fundamental
            I, Ensino Fundamental II e Ensino Médio.
          </>,
        )}
        <h2 id="disciplinas">Criar as disciplinas</h2>
        {ordered(
          <>
            Acesse <strong>Disciplinas</strong> e clique em{" "}
            <strong>Nova Disciplina</strong>.
          </>,
          <>
            Selecione uma disciplina existente ou informe um nome personalizado.
          </>,
          <>
            Revise o código sugerido, marque <strong>Disciplina ativa</strong> e
            salve.
          </>,
          <>
            Use a visualização para consultar e a edição para distribuir
            professores e turmas. A cor é definida automaticamente.
          </>,
        )}
        <h2 id="turmas">Criar as turmas</h2>
        {ordered(
          <>
            Acesse <strong>Turmas</strong> e clique em{" "}
            <strong>Nova Turma</strong>.
          </>,
          <>
            Selecione curso, ano letivo, série/ano, identificação (A, B ou C),
            turno e capacidade.
          </>,
          <>Marque a turma como ativa, salve e confira a edição.</>,
          <>
            Crie pelo menos duas turmas para testar distribuição e conflito de
            horários.
          </>,
        )}
        <h2 id="conferir-estrutura">Conferir antes de seguir</h2>
        {unordered(
          <>Instituição e anexo corretos.</>,
          <>Ano letivo e períodos ativos.</>,
          <>Cursos e disciplinas ativos.</>,
          <>Turmas ativas com turno preenchido.</>,
        )}
      </>
    ),
  },
  {
    id: "diretor-cadastros",
    group: "Ordem do fluxo",
    title: "ORDEM 03 — Diretor cadastra equipe e alunos",
    summary:
      "Criar Coordenador, Professor, Aluno e Responsável com seus dados e vínculos.",
    toc: [
      { id: "novo-coordenador", label: "Coordenador" },
      { id: "novo-professor", label: "Professor" },
      { id: "novo-aluno", label: "Aluno e responsável" },
      { id: "dados-complementares", label: "Saúde e documentos" },
    ],
    content: (
      <>
        <h2 id="novo-coordenador">Criar o Coordenador</h2>
        {ordered(
          <>
            Acesse <strong>Coordenadores</strong> ou{" "}
            <strong>Todos os Usuários</strong> e clique em{" "}
            <strong>Novo Coordenador</strong>.
          </>,
          <>Preencha nome, sobrenome, nome social, nascimento, sexo e CPF.</>,
          <>
            Preencha e-mail, celular, telefone, CEP, endereço, número,
            complemento, bairro, cidade e UF.
          </>,
          <>
            Selecione a instituição e escolha um anexo específico ou a opção de
            gerenciar a instituição inteira.
          </>,
          <>
            Salve, teste CPF inválido e faça o primeiro login com os 6 primeiros
            dígitos do CPF.
          </>,
        )}
        <h2 id="novo-professor">Criar o Professor</h2>
        {ordered(
          <>
            Acesse <strong>Professores</strong> e clique em{" "}
            <strong>Novo Professor</strong>.
          </>,
          <>Preencha dados pessoais, contato, formação e data de admissão.</>,
          <>Selecione instituição e um ou mais anexos em que ele dará aula.</>,
          <>Adicione foto, salve e teste editar e visualizar.</>,
          <>
            Confirme que o Professor apenas consulta suas disciplinas; o vínculo
            é feito por Direção ou Coordenação.
          </>,
        )}
        <h2 id="novo-aluno">Criar o Aluno e seu Responsável</h2>
        {ordered(
          <>
            Acesse <strong>Alunos</strong> ou <strong>Todos os Usuários</strong>{" "}
            e clique em <strong>Novo Aluno</strong>.
          </>,
          <>Preencha dados pessoais, CPF, contato e endereço.</>,
          <>
            Em <strong>Matrícula</strong>, selecione escola, ano letivo, curso,
            série, turma, turno e data da matrícula.
          </>,
          <>
            Em <strong>Responsáveis</strong>, adicione nome, parentesco, data de
            nascimento, CPF, e-mail, celular e WhatsApp.
          </>,
          <>
            Marque responsável financeiro, recebe notificações, pode retirar
            aluno e contato de emergência conforme o caso.
          </>,
        )}
        <h2 id="dados-complementares">Saúde, transporte e documentos</h2>
        {unordered(
          <>
            Preencha tipo sanguíneo, convênio, alergias, medicamentos,
            necessidades especiais, restrições alimentares e até dois contatos
            de emergência.
          </>,
          <>Informe transporte, empresa, motorista e rota quando necessário.</>,
          <>
            Anexe somente: Certidão de Nascimento, Identidade do Aluno,
            Histórico Escolar, Carteirinha de Vacinação, Atestado Médico para
            Educação Física e Laudo Médico/Psicopedagógico.
          </>,
          <>
            Salve, reabra a edição e confirme matrícula, responsável, data de
            nascimento e documentos.
          </>,
        )}
        <div className="docs-callout">
          <strong>Conta do responsável:</strong> quando houver e-mail e CPF, o
          sistema cria a conta com a senha formada pelos 6 primeiros dígitos do
          CPF. Sem e-mail, o responsável permanece apenas como registro
          vinculado.
        </div>
      </>
    ),
  },
  {
    id: "importacao",
    group: "Gestão de cadastros",
    title: "Importação em massa",
    summary:
      "Importar alunos e professores com pré-visualização, processamento controlado e relatório de falhas.",
    toc: [
      { id: "abrir-importacao", label: "Abrir o fluxo" },
      { id: "modelo-importacao", label: "Preencher o modelo" },
      { id: "processar-importacao", label: "Validar e importar" },
      { id: "relatorio-importacao", label: "Conferir o relatório" },
    ],
    content: (
      <>
        <p>
          Use este recurso preferencialmente com o Super Admin Global. Para
          poucos registros, o cadastro manual facilita a conferência.
        </p>
        <h2 id="abrir-importacao">Abrir o fluxo</h2>
        {ordered(
          <>
            Acesse <strong>Todos os Usuários</strong>,{" "}
            <strong>Professores</strong> ou <strong>Alunos</strong> e clique em{" "}
            <strong>Importar em massa</strong>.
          </>,
          <>Selecione instituição, anexo e tipo de importação.</>,
          <>
            Baixe o modelo correspondente. Instituição e anexo não precisam ser
            repetidos em cada linha porque já foram definidos antes do upload.
          </>,
        )}
        <h2 id="modelo-importacao">Preencher o modelo</h2>
        {ordered(
          <>Não altere os nomes das colunas e mantenha o formato original.</>,
          <>
            Use <strong>.CSV</strong> ou <strong>.XLSX</strong>.
          </>,
          <>Para professores, informe dados pessoais e profissionais.</>,
          <>
            Para alunos, informe matrícula, turma e os dados completos do
            responsável: nascimento, CPF, e-mail, celular, WhatsApp e
            permissões.
          </>,
        )}
        <p className="docs-result">
          <strong>Senha:</strong> deixe a coluna vazia. O primeiro acesso usa os
          6 primeiros dígitos do CPF e exige a troca da senha.
        </p>
        <h2 id="processar-importacao">Validar e importar</h2>
        {ordered(
          <>Selecione o arquivo e confira a pré-visualização.</>,
          <>
            Escolha o modo: <strong>Sequencial</strong> (um por vez),{" "}
            <strong>Grupo de 3 a 5</strong> ou <strong>Grupo de 6 a 10</strong>.
          </>,
          <>
            Passe o mouse no ícone de informação para entender o modo escolhido.
          </>,
          <>
            Clique em <strong>Importar</strong> e acompanhe a barra verde de
            progresso.
          </>,
          <>
            Aguarde a conclusão antes de fechar o modal ou atualizar a página.
          </>,
        )}
        <h2 id="relatorio-importacao">Conferir o relatório</h2>
        {unordered(
          <>Linhas verdes indicam usuários importados com sucesso.</>,
          <>
            Linhas vermelhas indicam falhas com explicação simples, como{" "}
            <strong>CPF duplicado</strong> ou <strong>e-mail inválido</strong>.
          </>,
          <>
            Os registros válidos continuam sendo importados mesmo quando outra
            linha falha.
          </>,
          <>
            Abra alguns alunos para confirmar matrícula, responsável e turma.
          </>,
        )}
      </>
    ),
  },
  {
    id: "coordenacao",
    group: "Ordem do fluxo",
    title: "ORDEM 04 — Coordenação organiza a operação",
    summary:
      "Distribuir disciplinas, professores e turmas e depois montar a grade de horários.",
    toc: [
      { id: "distribuir-disciplina", label: "Distribuir disciplina" },
      { id: "conferir-turma", label: "Conferir turma" },
      { id: "criar-grade", label: "Criar grade" },
    ],
    content: (
      <>
        <h2 id="distribuir-disciplina">
          Vincular professor, disciplina e turmas
        </h2>
        {ordered(
          <>
            Entre como Coordenador ou Diretor e acesse{" "}
            <strong>Disciplinas</strong>.
          </>,
          <>Abra a edição da disciplina.</>,
          <>Busque e selecione o Professor responsável.</>,
          <>
            Filtre turmas por curso e turno e selecione todas as turmas que
            receberão a disciplina.
          </>,
          <>
            Salve e confirme que o professor aparece uma única vez, com suas
            turmas agrupadas.
          </>,
          <>
            Na visualização, confirme nome, foto, contato e turmas; ela não
            possui controles de edição.
          </>,
        )}
        <p>
          O perfil do Professor serve para consulta. A alteração do vínculo é
          exclusiva da Direção e da Coordenação.
        </p>
        <h2 id="conferir-turma">Conferir uma turma</h2>
        {ordered(
          <>
            Acesse <strong>Turmas</strong> e abra a edição ou visualização.
          </>,
          <>Confira disciplinas, professores e alunos vinculados.</>,
          <>
            Use a busca para encontrar aluno e remova-o somente para corrigir
            uma matrícula.
          </>,
          <>
            Confirme a alteração no perfil do aluno, em{" "}
            <strong>Matrícula</strong>.
          </>,
        )}
        <h2 id="criar-grade">Criar a grade de horários</h2>
        {ordered(
          <>
            Acesse <strong>Grade de Horários</strong> e clique em{" "}
            <strong>Novo Horário</strong>.
          </>,
          <>
            Selecione turma, disciplina, professor, dia, hora inicial e hora
            final.
          </>,
          <>Salve e repita para os horários necessários.</>,
          <>
            Teste um conflito sobrepondo dois horários do mesmo Professor; o
            sistema deve bloquear inclusive sobreposição de um minuto.
          </>,
        )}
        <div className="docs-callout">
          <strong>Carga horária:</strong> ela é calculada pela grade de
          horários. Não existe necessidade de digitar horas por semana na
          disciplina.
        </div>
      </>
    ),
  },
  {
    id: "professor",
    group: "Ordem do fluxo",
    title: "ORDEM 05 — Operação do Professor",
    summary:
      "Testar disciplinas, turmas, frequência, conteúdo, atividades e notas com o usuário Professor.",
    toc: [
      { id: "minhas-turmas", label: "Disciplinas e turmas" },
      { id: "registrar-frequencia", label: "Frequência" },
      { id: "conteudo-atividade", label: "Conteúdo e atividade" },
      { id: "lancar-notas", label: "Lançar notas" },
    ],
    content: (
      <>
        <h2 id="minhas-turmas">Minhas disciplinas e minhas turmas</h2>
        {ordered(
          <>
            Acesse <strong>Minhas Disciplinas</strong> e confirme que aparecem
            apenas as disciplinas atribuídas.
          </>,
          <>
            Acesse <strong>Minhas Turmas</strong> e confirme as turmas
            distribuídas.
          </>,
          <>
            Abra <strong>Ver detalhes</strong> e confira disciplina, alunos,
            horários e status sem tela branca.
          </>,
        )}
        <h2 id="registrar-frequencia">Registrar frequência</h2>
        {ordered(
          <>
            Acesse <strong>Frequência → Registrar Frequência</strong>.
          </>,
          <>Selecione turma, disciplina e uma data marcada no calendário.</>,
          <>Escolha a aula da grade e confira o bimestre.</>,
          <>Marque presença, falta, atraso ou justificativa para cada aluno.</>,
          <>Salve, reabra o registro e confirme a permanência dos dados.</>,
        )}
        <h2 id="conteudo-atividade">Registrar conteúdo e criar atividade</h2>
        {ordered(
          <>
            Em <strong>Conteúdo Ministrado</strong>, clique em{" "}
            <strong>Novo Conteúdo</strong>, selecione disciplina e turma,
            informe data e descrição e salve.
          </>,
          <>
            Em <strong>Atividades</strong>, clique em{" "}
            <strong>Nova Atividade</strong>, selecione disciplina e turma,
            informe título, descrição e data e salve.
          </>,
          <>Confirme que cada item aparece para a turma correta.</>,
        )}
        <h2 id="lancar-notas">Lançar notas</h2>
        {ordered(
          <>
            Acesse <strong>Notas → Lançar Notas</strong>.
          </>,
          <>
            Selecione turma, disciplina, período acadêmico e a avaliação/VA
            disponível.
          </>,
          <>Confira os alunos com nome e foto, lance as notas e salve.</>,
          <>
            Em <strong>Notas Lançadas</strong>, filtre turma, disciplina e
            período para revisar.
          </>,
          <>
            Deixe <strong>Mostrar para alunos</strong> desativado enquanto a
            nota estiver em revisão.
          </>,
          <>
            Ative o controle e publique novamente para liberar a nota ao Aluno e
            ao Responsável.
          </>,
        )}
        <div className="docs-callout">
          <strong>Primeiro acesso:</strong> use os 6 primeiros dígitos do CPF e
          troque a senha quando o sistema solicitar.
        </div>
      </>
    ),
  },
  {
    id: "acompanhamento",
    group: "Acompanhamento",
    title: "ORDEM 06 — Direção e Coordenação acompanham",
    summary:
      "Conferir lançamentos, eventos e resultados sem alterar o fluxo realizado pelo Professor.",
    toc: [
      { id: "acompanhar-notas", label: "Notas e frequência" },
      { id: "acompanhar-eventos", label: "Comunicados e eventos" },
    ],
    content: (
      <>
        <h2 id="acompanhar-notas">Notas, frequência e operação</h2>
        {ordered(
          <>
            Acesse <strong>Notas</strong> e confira turma, disciplina, período,
            aluno, nota e Professor.
          </>,
          <>
            Confira também as notas ainda não publicadas para alunos e
            responsáveis.
          </>,
          <>
            Acesse <strong>Frequência</strong> e revise os registros.
          </>,
          <>
            Acesse <strong>Grade de Horários</strong> e filtre por turma e
            Professor.
          </>,
          <>
            Consulte <strong>Atividades</strong> e{" "}
            <strong>Conteúdo Ministrado</strong>.
          </>,
        )}
        <h2 id="acompanhar-eventos">Comunicados e eventos</h2>
        {ordered(
          <>
            Acesse <strong>Comunicados</strong> e confira{" "}
            <strong>Próximos Eventos</strong>.
          </>,
          <>Crie um evento escolhendo data, tipo, público, local e detalhes.</>,
          <>Abra a data e confirme a visualização.</>,
          <>
            Teste com um perfil sem permissão e confirme que ele não consegue
            criar eventos.
          </>,
        )}
      </>
    ),
  },
  {
    id: "aluno",
    group: "Ordem do fluxo",
    title: "ORDEM 07 — Teste do Aluno",
    summary:
      "Confirmar que o Aluno acessa somente a própria turma e o que foi liberado.",
    toc: [
      { id: "aluno-academico", label: "Dados acadêmicos" },
      { id: "aluno-publicacoes", label: "Notas e publicações" },
    ],
    content: (
      <>
        <h2 id="aluno-academico">Dados acadêmicos</h2>
        {ordered(
          <>Entre com um Aluno que tenha matrícula ativa.</>,
          <>
            Acesse <strong>Minhas Disciplinas</strong>,{" "}
            <strong>Horários</strong> e <strong>Frequência</strong>.
          </>,
          <>
            Confirme que disciplinas, grade e registros pertencem somente à
            turma dele.
          </>,
        )}
        <h2 id="aluno-publicacoes">Notas, atividades e comunicados</h2>
        {ordered(
          <>
            Em <strong>Notas</strong>, confirme que notas ocultas não aparecem e
            notas publicadas mostram disciplina, período e avaliação.
          </>,
          <>
            Acesse <strong>Atividades</strong> e confirme os itens da turma.
          </>,
          <>
            Acesse <strong>Comunicados</strong> e confirme o público.
          </>,
          <>
            Abra <strong>Configurações</strong> e <strong>Meu Perfil</strong> e
            confirme que carregam.
          </>,
        )}
      </>
    ),
  },
  {
    id: "responsavel",
    group: "Ordem do fluxo",
    title: "ORDEM 08 — Teste do Responsável",
    summary:
      "Última etapa: validar o vínculo familiar e o acesso às informações liberadas do aluno.",
    toc: [
      { id: "vinculo-responsavel", label: "Conferir vínculo" },
      { id: "acesso-responsavel", label: "Primeiro acesso" },
      { id: "consulta-responsavel", label: "Consulta da família" },
    ],
    content: (
      <>
        <p>
          Esta etapa depende de aluno, matrícula ativa, responsável vinculado e,
          quando houver acesso, e-mail e CPF válidos.
        </p>
        <h2 id="vinculo-responsavel">Conferir o vínculo</h2>
        {ordered(
          <>
            Como Diretor, abra o perfil do Aluno e acesse{" "}
            <strong>Responsáveis</strong>.
          </>,
          <>
            Confirme nome, parentesco, data de nascimento, celular, WhatsApp e
            permissões.
          </>,
          <>
            Confirme que o responsável está vinculado somente ao aluno correto.
          </>,
          <>Confirme que a conta foi criada quando existe e-mail.</>,
        )}
        <h2 id="acesso-responsavel">Primeiro acesso</h2>
        {ordered(
          <>Saia da conta administrativa.</>,
          <>
            Entre com o e-mail do Responsável e os 6 primeiros dígitos do CPF.
          </>,
          <>
            Troque a senha quando o sistema solicitar e entre novamente com a
            nova senha.
          </>,
        )}
        <h2 id="consulta-responsavel">Consulta da família</h2>
        {ordered(
          <>
            Acesse <strong>Meus Filhos</strong> e abra o aluno vinculado.
          </>,
          <>
            Confira notas publicadas, comunicados e dados acadêmicos liberados.
          </>,
          <>Confirme que notas ocultas não aparecem.</>,
          <>
            Confirme que o Responsável não consegue acessar alunos de outra
            família.
          </>,
        )}
      </>
    ),
  },
  {
    id: "checklist",
    group: "Validação final",
    title: "Checklist de aprovação",
    summary:
      "Marque os itens somente depois de testar o comportamento na aplicação.",
    toc: [
      { id: "checklist-acesso", label: "Acesso e cadastros" },
      { id: "checklist-operacao", label: "Operação pedagógica" },
      { id: "ordem-resumida", label: "Ordem resumida" },
    ],
    content: (
      <>
        <h2 id="checklist-acesso">Acesso e cadastros</h2>
        {unordered(
          <>
            Super Admin Global acessa exclusivamente pela rota{" "}
            <strong>/security</strong>.
          </>,
          <>
            Instituição, anexo, Diretor, Coordenador e Professor são criados e
            permanecem salvos.
          </>,
          <>
            Primeiro acesso usa os 6 primeiros dígitos do CPF e exige troca da
            senha.
          </>,
          <>
            Ano letivo, períodos, cursos, disciplinas e turmas aparecem
            corretamente.
          </>,
          <>
            Aluno tem matrícula ativa, Responsável vinculado, data de nascimento
            e foto salvas.
          </>,
          <>
            Importação aceita CSV/XLSX, mostra progresso e separa sucessos de
            falhas amigáveis.
          </>,
        )}
        <h2 id="checklist-operacao">Operação pedagógica</h2>
        {unordered(
          <>
            Professor é distribuído a disciplinas e turmas pela
            Direção/Coordenação.
          </>,
          <>Professor aparece uma vez com turmas agrupadas.</>,
          <>Conflito de horário é bloqueado.</>,
          <>
            Frequência, conteúdo, atividade e nota podem ser lançados e
            reabertos.
          </>,
          <>
            Notas ocultas não aparecem para Aluno/Responsável; notas publicadas
            aparecem.
          </>,
          <>
            Comunicados, eventos e permissões respeitam o público selecionado.
          </>,
          <>Aluno e Responsável visualizam somente os próprios dados.</>,
        )}
        <h2 id="ordem-resumida">Ordem resumida</h2>
        {ordered(
          <>Super Admin Global cria instituição e anexo.</>,
          <>Super Admin Global cria o Diretor.</>,
          <>Diretor cria ano letivo, períodos e estrutura acadêmica.</>,
          <>Diretor cria equipe, alunos e responsáveis.</>,
          <>
            Coordenação distribui disciplinas, professores e turmas e cria a
            grade.
          </>,
          <>Professor registra frequência, conteúdo, atividades e notas.</>,
          <>Direção e Coordenação acompanham os lançamentos.</>,
          <>Aluno consulta o que foi liberado.</>,
          <>Responsável consulta os alunos vinculados e as notas publicadas.</>,
        )}
      </>
    ),
  },
];
