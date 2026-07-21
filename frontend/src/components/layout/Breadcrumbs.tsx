'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/user.types';

// Mapping de segmentos de rota para labels legíveis
const ROUTE_LABELS: Record<string, string> = {
  // Roles
  'super-admin': 'Super Admin',
  'admin': 'Administração',
  'coordinator': 'Coordenação',
  'professor': 'Professor',
  'aluno': 'Aluno',
  'pais': 'Pais',

  // Common pages
  'dashboard': 'Dashboard',
  'users': 'Usuários',
  'students': 'Alunos',
  'teachers': 'Professores',
  'classes': 'Turmas',
  'subjects': 'Disciplinas',
  'grades': 'Notas',
  'attendance': 'Frequência',
  'questions': 'Questões',
  'question-categories': 'Categorias de Questões',
  'question-bank': 'Banco de Questões',
  'activities': 'Atividades',
  'worksheets': 'Atividades',
  'reports': 'Relatórios',
  'notifications': 'Notificações',
  'settings': 'Configurações',
  'configuracoes': 'Configurações',
  'perfil': 'Perfil',
  'communication': 'Comunicação',
  'announcements': 'Comunicados',
  'events': 'Eventos',
  'courses': 'Cursos',
  'academic-years': 'Anos Letivos',
  'lesson-plans': 'Planos de Ensino',
  'lesson-contents': 'Conteúdos',
  'observations': 'Observações',
  'monitoring': 'Acompanhamento',
  'schedule': 'Horários',
  'children': 'Meus Filhos',
  'my-classes': 'Minhas Turmas',

  // Actions
  'new': 'Novo',
  'edit': 'Editar',
};

// Segmentos que devem ser ocultados dos breadcrumbs
const HIDDEN_SEGMENTS = ['authenticated', 'dashboard'];

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Não mostrar breadcrumbs na página inicial ou em rotas específicas
  if (!pathname || pathname === '/' || pathname === '/login') {
    return null;
  }

  // Gerar itens do breadcrumb
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    const currentRole = user?.activeProfile || user?.role;
    const homeHref = getHomeHref(currentRole);

    // Adicionar Home
    breadcrumbs.push({
      label: 'Home',
      href: homeHref,
      isCurrentPage: false,
    });

    // Processar cada segmento
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Pular segmentos ocultos
      if (HIDDEN_SEGMENTS.includes(segment)) {
        return;
      }

      // Checar se é um UUID (identificador de recurso)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

      // Para UUIDs, usar um label genérico ou buscar o label do segmento anterior
      let label = ROUTE_LABELS[segment] || segment;

      if (isUUID) {
        const previousSegment = segments[index - 1];
        const resourceLabel = ROUTE_LABELS[previousSegment] || 'Detalhes';
        label = resourceLabel.endsWith('s')
          ? resourceLabel.slice(0, -1) // Remove 's' do plural
          : resourceLabel;
      } else {
        // Capitalizar primeira letra se não tiver no mapping
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrentPage: index === segments.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Não mostrar breadcrumbs se houver apenas o item Home
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-secondary-400 mx-2" />
            )}

            {breadcrumb.isCurrentPage ? (
              <span className="flex items-center gap-2 text-sm font-medium text-secondary-900">
                {index === 0 && <HomeIcon className="h-4 w-4" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  "text-secondary-600 hover:text-primary-600"
                )}
              >
                {index === 0 && <HomeIcon className="h-4 w-4" />}
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function getHomeHref(role?: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.INSTITUTION_ADMIN:
      return '/admin/dashboard';
    case UserRole.COORDINATOR:
      return '/coordinator/dashboard';
    case UserRole.TEACHER:
      return '/professor/dashboard';
    case UserRole.STUDENT:
      return '/aluno/dashboard';
    case UserRole.PARENT:
      return '/responsaveis/dashboard';
    default:
      return '/';
  }
}
