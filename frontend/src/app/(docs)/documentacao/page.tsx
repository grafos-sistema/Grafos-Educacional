'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenIcon, ChevronRightIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type DocSection = {
  id: string;
  group: string;
  title: string;
  summary: string;
  content: React.ReactNode;
};

const sections: DocSection[] = [
  {
    id: 'inicio', group: 'Comece aqui', title: 'Como usar esta documentação',
    summary: 'Um guia rápido para encontrar o que você precisa no Grafos.',
    content: <><p>Esta documentação explica o uso do sistema em linguagem simples. Escolha um assunto no menu para ver o passo a passo e as responsabilidades de cada perfil.</p><h2>Quem usa o sistema?</h2><p>A direção acompanha e autoriza processos, a coordenação organiza o trabalho pedagógico, o professor registra o dia a dia escolar e a secretaria mantém os cadastros e dados da instituição.</p><div className="tip"><strong>Regra geral:</strong> se uma opção não aparecer, confira se o cadastro anterior foi concluído e se o seu perfil tem permissão para aquela ação.</div></>,
  },
  {
    id: 'estrutura', group: 'Rotina escolar', title: 'Primeiros passos da instituição',
    summary: 'A ordem recomendada para preparar uma escola.',
    content: <><p>Antes de lançar notas ou frequência, a instituição precisa ter sua estrutura acadêmica organizada.</p><ol><li>Cadastre a instituição e seus anexos.</li><li>Crie o ano letivo e os bimestres.</li><li>Cadastre cursos, turmas e disciplinas.</li><li>Cadastre os usuários e vincule cada pessoa à instituição correta.</li><li>Vincule as disciplinas às turmas e os professores às disciplinas.</li><li>Monte a grade de horários.</li></ol><p>Essa sequência evita listas vazias, porque cada etapa usa os vínculos criados na etapa anterior.</p></>,
  },
  {
    id: 'notas', group: 'Avaliações', title: 'Notas com VA1, VA2, VA3 e VA4',
    summary: 'Como cadastrar a avaliação e lançar a média do bimestre.',
    content: <><p>Cada bimestre possui quatro espaços de avaliação: VA1, VA2, VA3 e VA4. A VA1 pode ser usada como a primeira avaliação aplicada; as demais são opcionais.</p><ul><li>VA2, VA3 e VA4 só precisam ser preenchidas quando realmente forem aplicadas.</li><li>O professor lança a nota consolidada de cada VA, limitada a 10 pontos.</li><li>A média do bimestre usa somente as VAs preenchidas.</li></ul><div className="example"><strong>Exemplo</strong><br />VA1 = 7,0<br />VA2 = 8,0<br />VA3 e VA4 vazias<br /><br /><strong>Média:</strong> (7 + 8) ÷ 2 = 7,5</div><h2>Fluxo recomendado</h2><ol><li>Direção ou coordenação cadastra a avaliação, escolhe turma, disciplina, bimestre e VA.</li><li>O professor abre Lançar Notas e seleciona turma, disciplina e período.</li><li>O professor informa as notas dos alunos e salva.</li><li>A equipe responsável revisa e publica o resultado para a família.</li></ol><p>O peso não é usado para criar pontos extras na média das VAs. Atividades e trabalhos podem ser a origem pedagógica da nota, mas a nota consolidada é a que entra na VA.</p></>,
  },
  {
    id: 'avaliacoes', group: 'Avaliações', title: 'Avaliações, atividades e aprovação',
    summary: 'O que precisa ser criado e quem pode liberar.',
    content: <><p>Uma avaliação representa o momento em que a escola vai registrar uma nota. Ela informa o tipo, o bimestre, a turma, a disciplina e a VA correspondente.</p><p>Atividades, trabalhos, projetos e questões servem para planejar e aplicar o trabalho pedagógico. Eles não viram pontos extras automaticamente. Quando forem usados para compor uma VA, o professor consolida o resultado e lança a nota daquela VA.</p><h2>Quem pode fazer o quê?</h2><ul><li><strong>Direção e coordenação:</strong> cadastram e liberam avaliações.</li><li><strong>Professor:</strong> lança as notas e pode propor uma avaliação.</li><li><strong>Proposta do professor:</strong> fica aguardando aprovação antes de ser usada.</li><li><strong>Secretaria/administrador:</strong> apoia a configuração e a manutenção dos cadastros.</li></ul></>,
  },
  {
    id: 'frequencia', group: 'Rotina escolar', title: 'Frequência e grade de horários',
    summary: 'Como o professor registra a presença da turma.',
    content: <><p>O professor registra frequência somente nas aulas que estão previstas na grade para aquela turma, disciplina e data. O calendário mostra os dias em que existe aula.</p><ol><li>Selecione a turma e a disciplina.</li><li>Escolha uma data marcada no calendário.</li><li>Escolha a aula da grade.</li><li>Confira o bimestre e marque o status de cada aluno.</li><li>Salve a frequência.</li></ol><p>Se for necessário lançar em outro dia, a direção ou a coordenação deve autorizar a exceção.</p></>,
  },
  {
    id: 'cadastros', group: 'Gestão', title: 'Cadastros e importação em massa',
    summary: 'Como manter pessoas, turmas e vínculos organizados.',
    content: <><p>Ao importar alunos ou professores, selecione primeiro a instituição e o anexo que receberá os cadastros. A planilha não precisa repetir a escola quando ela já foi escolhida na tela de importação.</p><p>Use sempre o modelo baixado no próprio menu e mantenha os nomes das colunas. Linhas incompletas aparecem separadas com uma explicação amigável; os registros válidos continuam sendo importados.</p><p>Depois do cadastro, confirme os vínculos: aluno com turma, professor com disciplina e disciplina com turma. O cadastro da pessoa, sozinho, não cria esses vínculos automaticamente.</p></>,
  },
  {
    id: 'permissoes', group: 'Gestão', title: 'Permissões e responsabilidades',
    summary: 'O que cada perfil pode alterar ou apenas consultar.',
    content: <><p>As permissões protegem os dados da instituição e deixam claro quem deve realizar cada etapa.</p><ul><li><strong>Super Admin Global:</strong> administra a plataforma e pode consultar as instituições.</li><li><strong>Diretor:</strong> administra a instituição, aprova processos e acompanha resultados.</li><li><strong>Coordenador:</strong> organiza disciplinas, turmas, avaliações e acompanhamento pedagógico.</li><li><strong>Professor:</strong> trabalha com suas turmas, registra frequência, notas e atividades autorizadas.</li><li><strong>Secretaria:</strong> mantém cadastros e informações administrativas conforme a permissão recebida.</li></ul><div className="tip"><strong>Importante:</strong> visualizar um dado não significa que o perfil pode alterá-lo. A tela mostra apenas as ações permitidas para o usuário.</div></>,
  },
];

export default function DocumentationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activeId, setActiveId] = useState('inicio');
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const active = sections.find((item) => item.id === activeId) ?? sections[0];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    return sections.filter((item) => `${item.title} ${item.summary} ${item.group}`.toLowerCase().includes(term));
  }, [search]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/documentacao/login');
    if (!isLoading && user && !['SUPER_ADMIN_GLOBAL', 'SUPER_ADMIN', 'DIRECTOR', 'INSTITUTION_ADMIN', 'COORDINATOR', 'TEACHER'].includes(user.role)) router.replace('/');
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || !isAuthenticated || !user) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-slate-500">Carregando documentação...</div>;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800">
      <header className="sticky top-0 z-20 border-b border-[#e3e5e9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
          <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileMenu((value) => !value)} aria-label="Abrir menu"><Bars3Icon className="h-6 w-6" /></button>
          <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#33a551] text-white"><BookOpenIcon className="h-5 w-5" /></div><span className="font-bold text-[#33a551]">Grafos</span><span className="hidden text-slate-400 sm:inline">/ Documentação de uso</span></div>
          <div className="ml-auto flex items-center gap-3"><div className="relative hidden w-64 md:block"><MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar assunto" className="h-9 w-full rounded-[5px] border border-[#e3e5e9] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#33a551]" /></div><span className="hidden text-sm text-slate-600 lg:inline">{user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}</span><button type="button" onClick={() => void logout()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Sair"><ArrowRightOnRectangleIcon className="h-5 w-5" /></button></div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside className={`${mobileMenu ? 'fixed inset-y-16 left-0 z-10 block w-72 shadow-xl' : 'hidden'} w-72 shrink-0 border-r border-[#e3e5e9] bg-white lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto`}>
          <div className="flex items-center justify-between border-b border-[#e3e5e9] px-5 py-4 lg:hidden"><span className="font-semibold">Assuntos</span><button type="button" onClick={() => setMobileMenu(false)}><XMarkIcon className="h-5 w-5" /></button></div>
          <nav className="p-4">{Array.from(new Set(filtered.map((item) => item.group))).map((group) => <div key={group} className="mb-6"><p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{group}</p>{filtered.filter((item) => item.group === group).map((item) => <button key={item.id} type="button" onClick={() => { setActiveId(item.id); setMobileMenu(false); }} className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${activeId === item.id ? 'bg-[#eaf7ee] font-semibold text-[#237b3c]' : 'text-slate-600 hover:bg-slate-50'}`}><span>{item.title}</span>{activeId === item.id && <ChevronRightIcon className="h-4 w-4" />}</button>)}</div>)}</nav>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-10 lg:px-16 lg:py-12"><div className="mx-auto max-w-3xl"><p className="mb-3 text-sm font-semibold text-[#33a551]">{active.group}</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{active.title}</h1><p className="mt-3 text-lg text-slate-500">{active.summary}</p><div className="my-8 border-t border-[#e3e5e9]" /><article className="docs-article space-y-5 text-[15px] leading-7 text-slate-700">{active.content}</article><div className="mt-12 flex items-center justify-between border-t border-[#e3e5e9] pt-5 text-sm">{(() => { const index = sections.findIndex((item) => item.id === active.id); const previous = sections[index - 1]; const next = sections[index + 1]; return <><button type="button" disabled={!previous} onClick={() => previous && setActiveId(previous.id)} className="text-left text-slate-500 disabled:invisible"><span className="block text-xs text-slate-400">Anterior</span>{previous?.title}</button><button type="button" disabled={!next} onClick={() => next && setActiveId(next.id)} className="text-right text-[#237b3c] disabled:invisible"><span className="block text-xs text-slate-400">Próximo</span>{next?.title} →</button></>; })()}</div></div></main>
      </div>
      <style jsx>{`.docs-article h2{margin-top:2rem;font-size:1.25rem;font-weight:700;color:#0f172a}.docs-article ol{list-style:decimal;padding-left:1.4rem}.docs-article ul{list-style:disc;padding-left:1.4rem}.docs-article li{padding-left:.25rem}.docs-article strong{color:#0f172a}.docs-article .tip{border:1px solid #ccebd5;background:#f0fbf3;border-radius:8px;padding:1rem 1.1rem;color:#285f37}.docs-article .example{border-left:3px solid #33a551;background:#f7faf8;border-radius:0 8px 8px 0;padding:1rem 1.25rem;color:#334155}`}</style>
    </div>
  );
}
