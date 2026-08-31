'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type DocSection = {
  id: string;
  group: string;
  title: string;
  summary: string;
  toc: { id: string; label: string }[];
  content: React.ReactNode;
};

const sections: DocSection[] = [
  {
    id: 'inicio',
    group: 'Comece aqui',
    title: 'Introdução',
    summary: 'Um guia prático para usar a plataforma Grafos com segurança e na sequência correta.',
    toc: [
      { id: 'quem-usa', label: 'Quem usa o sistema?' },
      { id: 'como-navegar', label: 'Como navegar nesta documentação' },
      { id: 'regra-geral', label: 'Regra geral de permissões' },
    ],
    content: (
      <>
        <p>
          Esta documentação explica o uso do Grafos em linguagem simples. Escolha um assunto no menu para ver a sequência de trabalho, os responsáveis por cada etapa e o que pode ou não ser alterado.
        </p>
        <h2 id="quem-usa">Quem usa o sistema?</h2>
        <p>
          A direção acompanha e autoriza processos, a coordenação organiza o trabalho pedagógico, o professor registra o dia a dia escolar e a secretaria mantém os cadastros e dados da instituição.
        </p>
        <h2 id="como-navegar">Como navegar nesta documentação</h2>
        <p>
          Comece pela estrutura da instituição. Depois, siga para cadastros, disciplinas, turmas, grade de horários, frequência e avaliações. Essa ordem evita que listas apareçam vazias ou que um vínculo seja criado no lugar errado.
        </p>
        <h2 id="regra-geral">Regra geral de permissões</h2>
        <div className="docs-callout">
          <strong>Importante:</strong> visualizar uma informação não significa que o perfil pode alterá-la. A documentação e o sistema exibem somente as ações permitidas para cada usuário.
        </div>
      </>
    ),
  },
  {
    id: 'estrutura',
    group: 'Rotina escolar',
    title: 'Preparar a instituição',
    summary: 'A ordem recomendada para estruturar uma escola antes do início das aulas.',
    toc: [
      { id: 'ordem-recomendada', label: 'Ordem recomendada' },
      { id: 'por-que-ordem', label: 'Por que seguir esta ordem?' },
    ],
    content: (
      <>
        <p>Antes de lançar notas ou frequência, a instituição precisa ter sua estrutura acadêmica organizada.</p>
        <h2 id="ordem-recomendada">Ordem recomendada</h2>
        <ol>
          <li>Cadastre a instituição e seus anexos.</li>
          <li>Crie o ano letivo e os bimestres.</li>
          <li>Cadastre cursos, turmas e disciplinas.</li>
          <li>Cadastre os usuários e vincule cada pessoa à instituição correta.</li>
          <li>Vincule as disciplinas às turmas e os professores às disciplinas.</li>
          <li>Monte a grade de horários.</li>
        </ol>
        <h2 id="por-que-ordem">Por que seguir esta ordem?</h2>
        <p>
          Cada etapa usa os vínculos criados na anterior. Por exemplo: uma disciplina precisa existir para ser associada a uma turma; a turma e a disciplina precisam estar vinculadas antes de montar a grade; e a grade é usada para permitir o lançamento da frequência.
        </p>
      </>
    ),
  },
  {
    id: 'notas',
    group: 'Avaliações',
    title: 'Notas com VA1, VA2, VA3 e VA4',
    summary: 'Como registrar avaliações e calcular a média do bimestre.',
    toc: [
      { id: 'estrutura-vas', label: 'Estrutura das avaliações' },
      { id: 'exemplo-media', label: 'Exemplo de média' },
      { id: 'fluxo-notas', label: 'Fluxo recomendado' },
    ],
    content: (
      <>
        <p>
          Cada bimestre possui quatro espaços de avaliação: VA1, VA2, VA3 e VA4. O professor pode usar somente as verificações de aprendizagem que realmente aplicou.
        </p>
        <h2 id="estrutura-vas">Estrutura das avaliações</h2>
        <ul>
          <li>VA1, VA2, VA3 e VA4 aceitam nota de 0 a 10 pontos.</li>
          <li>VA2, VA3 e VA4 são opcionais.</li>
          <li>A média do bimestre considera somente as VAs que foram preenchidas.</li>
          <li>Atividades, trabalhos e provas podem compor pedagogicamente uma VA, mas o sistema recebe a nota consolidada daquela VA.</li>
        </ul>
        <h2 id="exemplo-media">Exemplo de média</h2>
        <pre className="docs-code"><code>{`VA1 = 7,0
VA2 = 8,0
VA3 e VA4 vazias

Média do bimestre = (7 + 8) / 2 = 7,5`}</code></pre>
        <h2 id="fluxo-notas">Fluxo recomendado</h2>
        <ol>
          <li>Direção ou coordenação cria e libera a avaliação para a turma, disciplina, bimestre e VA.</li>
          <li>O professor abre <strong>Lançar Notas</strong> e seleciona a turma, a disciplina e o período.</li>
          <li>O professor informa as notas dos alunos nas VAs disponíveis e salva.</li>
          <li>A equipe responsável revisa e publica o resultado para a família.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'avaliacoes',
    group: 'Avaliações',
    title: 'Avaliações, atividades e aprovação',
    summary: 'Entenda o que é uma avaliação e quem pode liberá-la.',
    toc: [
      { id: 'o-que-avaliacao', label: 'O que é uma avaliação?' },
      { id: 'quem-faz', label: 'Quem pode fazer o quê?' },
    ],
    content: (
      <>
        <h2 id="o-que-avaliacao">O que é uma avaliação?</h2>
        <p>
          Uma avaliação é o registro oficial de uma VA. Ela identifica a turma, a disciplina, o bimestre e a verificação de aprendizagem que receberá notas. Atividades, trabalhos, projetos e questões apoiam o planejamento pedagógico, mas não adicionam pontos extras automaticamente.
        </p>
        <h2 id="quem-faz">Quem pode fazer o quê?</h2>
        <ul>
          <li><strong>Direção e coordenação:</strong> cadastram, aprovam e liberam avaliações.</li>
          <li><strong>Professor:</strong> lança as notas e pode propor uma avaliação para aprovação.</li>
          <li><strong>Proposta do professor:</strong> fica aguardando aprovação antes de poder ser usada no lançamento de notas.</li>
          <li><strong>Secretaria:</strong> apoia cadastros e informações administrativas conforme a permissão recebida.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'frequencia',
    group: 'Rotina escolar',
    title: 'Frequência e grade de horários',
    summary: 'Como o professor registra a presença da turma em cada aula.',
    toc: [
      { id: 'registro-frequencia', label: 'Registro da frequência' },
      { id: 'excecao-frequencia', label: 'Exceções de data' },
    ],
    content: (
      <>
        <p>O professor registra frequência somente nas aulas previstas na grade para aquela turma, disciplina e data. O calendário mostra os dias com aula.</p>
        <h2 id="registro-frequencia">Registro da frequência</h2>
        <ol>
          <li>Selecione a turma e a disciplina.</li>
          <li>Escolha uma data marcada no calendário.</li>
          <li>Escolha a aula da grade correspondente.</li>
          <li>Confira o bimestre e marque o status de cada aluno.</li>
          <li>Salve a frequência.</li>
        </ol>
        <h2 id="excecao-frequencia">Exceções de data</h2>
        <div className="docs-callout">
          <strong>Atenção:</strong> se for necessário lançar uma aula em outro dia, a direção ou a coordenação deve autorizar a exceção. Isso mantém o histórico da turma coerente com a grade oficial.
        </div>
      </>
    ),
  },
  {
    id: 'cadastros',
    group: 'Gestão',
    title: 'Cadastros e importação em massa',
    summary: 'Como manter pessoas, turmas e vínculos organizados.',
    toc: [
      { id: 'importacao', label: 'Importação em massa' },
      { id: 'vinculos', label: 'Vínculos após o cadastro' },
    ],
    content: (
      <>
        <h2 id="importacao">Importação em massa</h2>
        <p>
          Ao importar alunos ou professores, selecione primeiro a instituição e o anexo que receberá os cadastros. A planilha não precisa repetir a escola quando ela já foi escolhida na tela de importação.
        </p>
        <p>Use sempre o modelo baixado no próprio menu e mantenha os nomes das colunas. Linhas inválidas aparecem separadas com uma explicação amigável; os registros válidos continuam sendo importados.</p>
        <h2 id="vinculos">Vínculos após o cadastro</h2>
        <p>
          Depois do cadastro, confirme os vínculos necessários: aluno com turma, professor com disciplina e disciplina com turma. O cadastro da pessoa, sozinho, não cria esses vínculos automaticamente.
        </p>
      </>
    ),
  },
  {
    id: 'permissoes',
    group: 'Gestão',
    title: 'Permissões e responsabilidades',
    summary: 'O que cada perfil pode alterar ou apenas consultar.',
    toc: [
      { id: 'perfis', label: 'Perfis da plataforma' },
      { id: 'consulta-edicao', label: 'Consulta e edição' },
    ],
    content: (
      <>
        <h2 id="perfis">Perfis da plataforma</h2>
        <ul>
          <li><strong>Super Admin Global:</strong> administra a plataforma e consulta as instituições.</li>
          <li><strong>Diretor:</strong> administra a instituição, aprova processos e acompanha resultados.</li>
          <li><strong>Coordenador:</strong> organiza disciplinas, turmas, avaliações e o acompanhamento pedagógico.</li>
          <li><strong>Professor:</strong> trabalha com suas turmas, registra frequência, notas e atividades autorizadas.</li>
          <li><strong>Secretaria:</strong> mantém cadastros e informações administrativas conforme a permissão recebida.</li>
        </ul>
        <h2 id="consulta-edicao">Consulta e edição</h2>
        <p>O sistema separa o que pode ser consultado do que pode ser alterado. Quando um botão de edição não aparece, a ação está reservada a outro perfil responsável por aquela etapa.</p>
      </>
    ),
  },
];

export default function DocumentationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activeId, setActiveId] = useState('inicio');
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = sections.find((section) => section.id === activeId) ?? sections[0];
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return sections;

    return sections.filter((section) =>
      `${section.group} ${section.title} ${section.summary}`.toLocaleLowerCase('pt-BR').includes(term),
    );
  }, [search]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/documentacao/login');
    if (
      !isLoading &&
      user &&
      !['SUPER_ADMIN_GLOBAL', 'SUPER_ADMIN', 'DIRECTOR', 'INSTITUTION_ADMIN', 'COORDINATOR', 'TEACHER'].includes(user.role)
    ) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router, user]);

  const selectSection = (sectionId: string) => {
    setActiveId(sectionId);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyPage = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (isLoading || !isAuthenticated || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-[#090c0d] text-sm text-slate-400">Carregando documentação...</div>;
  }

  const activeIndex = sections.findIndex((section) => section.id === active.id);
  const previous = sections[activeIndex - 1];
  const next = sections[activeIndex + 1];

  return (
    <div className="min-h-screen bg-[#090c0d] text-[#e8ebed]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#26793d]">
        <div className="mx-auto flex h-14 max-w-[1560px] items-center px-4 sm:px-7">
          <button
            type="button"
            onClick={() => setMobileMenu((value) => !value)}
            className="mr-3 p-1 text-white/90 transition hover:text-white lg:hidden"
            aria-label="Abrir menu da documentação"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2.5">
            <Image src="/logo-grafos.png" alt="Grafos" width={34} height={34} priority className="h-[34px] w-[34px] object-contain" />
            <span className="text-base font-bold tracking-tight text-white">Grafos</span>
            <span className="hidden text-xs font-medium text-white/80 sm:inline">Documentação de uso</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs font-semibold text-white">
            <span className="hidden md:inline">{user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}</span>
            <button type="button" onClick={() => void logout()} className="flex items-center gap-1.5 text-white/90 transition hover:text-white">
              <span>Sair</span>
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-20 border-b border-white/10 bg-[#1f6534]">
        <div className="mx-auto flex h-9 max-w-[1560px] items-center gap-3 px-4 sm:px-7">
          <span className="text-xs font-bold text-white">v1.0</span>
          <span className="rounded bg-white/15 px-2 py-1 text-[11px] font-semibold text-white">Guia de uso</span>
          <div className="relative ml-auto hidden w-64 sm:block">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/65" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar"
              className="h-7 w-full rounded-[5px] border border-black/20 bg-[#155027] pl-8 pr-14 text-xs text-white outline-none placeholder:text-white/60 focus:border-white/50"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-white/60">CTRL K</kbd>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1560px]">
        {mobileMenu && <button type="button" className="fixed inset-0 z-20 bg-black/60 lg:hidden" aria-label="Fechar menu" onClick={() => setMobileMenu(false)} />}
        <aside className={`${mobileMenu ? 'fixed inset-y-0 left-0 z-30 block w-[290px] pt-14 shadow-2xl' : 'hidden'} shrink-0 border-r border-white/10 bg-[#0d1011] lg:sticky lg:top-[92px] lg:block lg:h-[calc(100vh-92px)] lg:w-[290px] lg:overflow-y-auto`}>
          <div className="border-b border-white/10 p-4 lg:hidden">
            <div className="flex items-center justify-between text-sm font-semibold text-white">
              <span>Documentação</span>
              <button type="button" onClick={() => setMobileMenu(false)} aria-label="Fechar menu"><XMarkIcon className="h-5 w-5" /></button>
            </div>
          </div>
          <nav className="p-4">
            <div className="mb-7 flex h-8 items-center justify-between rounded-[5px] border border-white/15 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <span>Ir para</span>
              <kbd className="rounded border border-white/15 px-1 text-[9px] text-slate-500">Ctrl K</kbd>
            </div>
            {Array.from(new Set(filtered.map((section) => section.group))).map((group) => (
              <div key={group} className="mb-7">
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{group}</p>
                {filtered.filter((section) => section.group === group).map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectSection(section.id)}
                    className={`mb-0.5 flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-xs transition ${active.id === section.id ? 'bg-[#1f3225] font-semibold text-[#79d695]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <span className="min-w-0 flex-1 truncate">{section.title}</span>
                    {active.id === section.id && <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {!filtered.length && <p className="px-2 text-xs leading-5 text-slate-500">Nenhum assunto encontrado.</p>}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10 xl:px-16">
          <div className="mx-auto max-w-[780px]">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[32px]">{active.title}</h1>
              <button
                type="button"
                onClick={() => void copyPage()}
                className="hidden shrink-0 items-center gap-1.5 rounded-[5px] border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/35 hover:text-white sm:flex"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                {copied ? 'Copiado' : 'Copiar página'}
              </button>
            </div>
            <div className="mb-7 mt-6 border-t border-white/15" />
            <p className="mb-6 text-[15px] leading-7 text-slate-300">{active.summary}</p>
            <article className="docs-article text-[14px] leading-[1.65] text-slate-200">{active.content}</article>

            <div className="mt-12 flex items-center justify-between border-t border-white/15 pt-5 text-sm">
              <button
                type="button"
                disabled={!previous}
                onClick={() => previous && selectSection(previous.id)}
                className="group flex max-w-[45%] items-center gap-2 text-left text-slate-400 transition hover:text-white disabled:invisible"
              >
                <ChevronLeftIcon className="h-4 w-4 shrink-0" />
                <span><span className="block text-[11px] text-slate-500">Anterior</span>{previous?.title}</span>
              </button>
              <button
                type="button"
                disabled={!next}
                onClick={() => next && selectSection(next.id)}
                className="group flex max-w-[45%] items-center gap-2 text-right text-[#79d695] transition hover:text-white disabled:invisible"
              >
                <span><span className="block text-[11px] text-slate-500">Próximo</span>{next?.title}</span>
                <ChevronRightIcon className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </main>

        <aside className="sticky top-[92px] hidden h-[calc(100vh-92px)] w-[250px] shrink-0 self-start overflow-y-auto px-5 py-10 xl:block">
          <div className="border-l-2 border-[#33a551] pl-3">
            <p className="mb-2 text-[11px] font-bold text-white">Nesta página</p>
            <nav className="space-y-2">
              {active.toc.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="block text-left text-[11px] leading-5 text-slate-400 transition hover:text-[#79d695]"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .docs-article :global(h2) { scroll-margin-top: 118px; margin-top: 2rem; margin-bottom: .65rem; color: #ffffff; font-size: 1.05rem; font-weight: 700; line-height: 1.35; }
        .docs-article :global(p) { margin-bottom: 1rem; }
        .docs-article :global(ol), .docs-article :global(ul) { margin: .75rem 0 1rem; padding-left: 1.4rem; }
        .docs-article :global(ol) { list-style: decimal; }
        .docs-article :global(ul) { list-style: disc; }
        .docs-article :global(li) { margin: .35rem 0; padding-left: .15rem; }
        .docs-article :global(strong) { color: #ffffff; font-weight: 700; }
        .docs-article :global(.docs-callout) { margin: 1.25rem 0; border-left: 2px solid #33a551; background: rgba(51, 165, 81, .1); padding: .9rem 1rem; color: #d7f6df; }
        .docs-article :global(.docs-code) { margin: 1.15rem 0; overflow-x: auto; border: 1px solid rgba(255, 255, 255, .14); border-radius: 5px; background: #121718; padding: 1rem 1.1rem; color: #d6f6de; font-size: .82rem; line-height: 1.7; }
      `}</style>
    </div>
  );
}
