'use client';

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { cn } from '@/lib/utils';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useAuthenticatedNavigation } from '@/components/layout/AuthenticatedNavigationProvider';
import { InstitutionSwitcher } from './InstitutionSwitcher';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  UsersIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  TrophyIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  baseRoute: string; // Base route name for mapping
  icon: ElementType;
  roles: UserRole[];
  pathMapping: Partial<Record<UserRole, string>>; // Role-specific paths
  displayNameMapping?: Partial<Record<UserRole, string>>;
  requiresOriginalRole?: UserRole[];
  excludedOriginalRoles?: UserRole[];
}

interface NavigationSection {
  title: string;
  items: NavItem[];
}

// Helper function to get role-specific route
const getRouteForRole = (item: NavItem, role: UserRole): string => {
  return item.pathMapping[role] || item.baseRoute;
};

const getLabelForRole = (item: NavItem, role: UserRole): string => {
  return item.displayNameMapping?.[role] || item.name;
};

const institutionAdminSectionConfig: Array<{
  title: string;
  itemNames: string[];
}> = [
  {
    title: 'Visão Geral',
    itemNames: ['Dashboard'],
  },
  {
    title: 'Pessoas',
    itemNames: ['Todos os Usuários', 'Diretores', 'Secretários', 'Coordenadores', 'Professores', 'Alunos'],
  },
  {
    title: 'Estrutura Acadêmica',
    itemNames: ['Anos Letivos', 'Cursos', 'Disciplinas', 'Turmas'],
  },
  {
    title: 'Gestão Escolar',
    itemNames: [
      'Grade de Horários',
      'Comunicados',
      'Eventos',
      'Comunicação',
      'Rankings',
      'Banco de Questões',
      'Categorias de Questões',
    ],
  },
  {
    title: 'Suporte',
    itemNames: ['Chamados de Suporte'],
  },
  {
    title: 'Conta',
    itemNames: ['Configurações'],
  },
];

const teacherSectionConfig: Array<{
  title: string;
  itemNames: string[];
}> = [
  {
    title: 'Visão Geral',
    itemNames: ['Dashboard', 'Minha Grade'],
  },
  {
    title: 'Minhas Turmas',
    itemNames: ['Turmas', 'Minhas Disciplinas'],
  },
  {
    title: 'Rotina de Aula',
    itemNames: ['Frequência', 'Conteúdos', 'Atividades'],
  },
  {
    title: 'Avaliação',
    itemNames: ['Notas', 'Rankings'],
  },
  {
    title: 'Planejamento',
    itemNames: ['Planos de Ensino', 'Banco de Questões'],
  },
  {
    title: 'Comunicação',
    itemNames: ['Comunicação'],
  },
  {
    title: 'Conta',
    itemNames: ['Configurações'],
  },
];

const coordinatorSectionConfig: Array<{
  title: string;
  itemNames: string[];
}> = [
  {
    title: 'Visão Geral',
    itemNames: ['Dashboard'],
  },
  {
    title: 'Pessoas',
    itemNames: ['Professores', 'Alunos'],
  },
  {
    title: 'Estrutura Acadêmica',
    itemNames: ['Disciplinas', 'Turmas'],
  },
  {
    title: 'Operação Acadêmica',
    itemNames: ['Acompanhamento', 'Grade de Horários', 'Planos de Ensino', 'Observações', 'Rankings'],
  },
  {
    title: 'Comunicação',
    itemNames: ['Comunicação'],
  },
  {
    title: 'Conta',
    itemNames: ['Configurações'],
  },
];

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    baseRoute: '/dashboard',
    icon: HomeIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/dashboard',
      [UserRole.DIRECTOR]: '/admin/dashboard',
      [UserRole.INSTITUTION_ADMIN]: '/admin/dashboard',
      [UserRole.COORDINATOR]: '/coordinator/dashboard',
      [UserRole.TEACHER]: '/professor/dashboard',
      [UserRole.STUDENT]: '/aluno/dashboard',
      [UserRole.PARENT]: '/responsaveis/dashboard',
    },
  },
  {
    name: 'Instituições',
    baseRoute: '/institutions',
    icon: BuildingOfficeIcon,
    roles: [UserRole.SUPER_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/super-admin/institutions',
    },
  },
  {
    name: 'Todos os Usuários',
    baseRoute: '/users',
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/users',
      [UserRole.DIRECTOR]: '/admin/users',
      [UserRole.INSTITUTION_ADMIN]: '/admin/users',
    },
  },
  {
    name: 'Diretores',
    baseRoute: '/directors',
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN],
    requiresOriginalRole: [UserRole.SUPER_ADMIN_GLOBAL],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/diretores',
    },
  },
  {
    name: 'Secretários',
    baseRoute: '/secretaries',
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN],
    requiresOriginalRole: [UserRole.SUPER_ADMIN_GLOBAL],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/secretarios',
    },
  },
  {
    name: 'Professores',
    baseRoute: '/teachers',
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/professores',
      [UserRole.DIRECTOR]: '/admin/professores',
      [UserRole.INSTITUTION_ADMIN]: '/admin/professores',
      [UserRole.COORDINATOR]: '/coordinator/professores',
    },
  },
  {
    name: 'Alunos',
    baseRoute: '/students',
    icon: UserGroupIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/alunos',
      [UserRole.DIRECTOR]: '/admin/alunos',
      [UserRole.INSTITUTION_ADMIN]: '/admin/alunos',
      [UserRole.COORDINATOR]: '/coordinator/alunos',
    },
  },
  {
    name: 'Coordenadores',
    baseRoute: '/coordinators',
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/coordenadores',
      [UserRole.DIRECTOR]: '/admin/coordenadores',
      [UserRole.INSTITUTION_ADMIN]: '/admin/coordenadores',
    },
  },
  {
    name: 'Minhas Disciplinas',
    baseRoute: '/my-subjects',
    icon: BookOpenIcon,
    roles: [UserRole.TEACHER],
    pathMapping: {
      [UserRole.TEACHER]: '/professor/my-subjects',
    },
  },
  {
    name: 'Minha Grade',
    baseRoute: '/my-schedule',
    icon: CalendarIcon,
    roles: [UserRole.TEACHER],
    pathMapping: {
      [UserRole.TEACHER]: '/professor/my-schedule',
    },
  },
  {
    name: 'Turmas',
    baseRoute: '/classes',
    icon: BookOpenIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/classes',
      [UserRole.DIRECTOR]: '/admin/classes',
      [UserRole.INSTITUTION_ADMIN]: '/admin/classes',
      [UserRole.COORDINATOR]: '/admin/classes',
      [UserRole.TEACHER]: '/professor/my-classes',
    },
    displayNameMapping: {
      [UserRole.TEACHER]: 'Minhas Turmas',
    },
  },
  {
    name: 'Disciplinas',
    baseRoute: '/subjects',
    icon: BookOpenIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.STUDENT],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/subjects',
      [UserRole.DIRECTOR]: '/admin/subjects',
      [UserRole.INSTITUTION_ADMIN]: '/admin/subjects',
      [UserRole.COORDINATOR]: '/admin/subjects',
      [UserRole.STUDENT]: '/aluno/subjects',
    },
  },
  {
    name: 'Notas',
    baseRoute: '/grades',
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.TEACHER, UserRole.STUDENT],
    pathMapping: {
      [UserRole.TEACHER]: '/professor/grades',
      [UserRole.STUDENT]: '/aluno/grades',
    },
  },
  {
    name: 'Frequência',
    baseRoute: '/attendance',
    icon: CalendarIcon,
    roles: [UserRole.TEACHER, UserRole.STUDENT],
    pathMapping: {
      [UserRole.TEACHER]: '/professor/attendance',
      [UserRole.STUDENT]: '/aluno/attendance',
    },
  },
  {
    name: 'Rankings',
    baseRoute: '/rankings',
    icon: TrophyIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/rankings',
      [UserRole.DIRECTOR]: '/admin/rankings',
      [UserRole.INSTITUTION_ADMIN]: '/admin/rankings',
      [UserRole.COORDINATOR]: '/coordinator/rankings',
      [UserRole.TEACHER]: '/professor/rankings',
      [UserRole.STUDENT]: '/aluno/rankings',
    },
  },
  {
    name: 'Banco de Questões',
    baseRoute: '/questions',
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.TEACHER],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/super-admin/questions',
      [UserRole.DIRECTOR]: '/super-admin/questions',
      [UserRole.TEACHER]: '/professor/question-bank',
    },
  },
  {
    name: 'Categorias de Questões',
    baseRoute: '/question-categories',
    icon: BookOpenIcon,
    roles: [UserRole.SUPER_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/super-admin/question-categories',
    },
  },
  {
    name: 'Planos de Ensino',
    baseRoute: '/lesson-plans',
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.COORDINATOR, UserRole.TEACHER],
    pathMapping: {
      [UserRole.COORDINATOR]: '/coordinator/lesson-plans',
      [UserRole.TEACHER]: '/professor/lesson-plans',
    },
    displayNameMapping: {
      [UserRole.TEACHER]: 'Planos de Aula',
    },
  },
  {
    name: 'Observações',
    baseRoute: '/observations',
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.COORDINATOR],
    pathMapping: {
      [UserRole.COORDINATOR]: '/coordinator/observations',
    },
  },
  {
    name: 'Acompanhamento',
    baseRoute: '/monitoring',
    icon: ChartBarIcon,
    roles: [UserRole.COORDINATOR],
    pathMapping: {
      [UserRole.COORDINATOR]: '/coordinator/monitoring',
    },
  },
  {
    name: 'Grade de Horários',
    baseRoute: '/schedules',
    icon: TableCellsIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/teacher-schedules',
      [UserRole.DIRECTOR]: '/admin/teacher-schedules',
      [UserRole.COORDINATOR]: '/coordinator/schedules',
      [UserRole.INSTITUTION_ADMIN]: '/admin/teacher-schedules',
    },
  },
  {
    name: 'Atividades',
    baseRoute: '/worksheets',
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.TEACHER],
    pathMapping: {
      [UserRole.TEACHER]: '/professor/worksheets',
    },
  },
  {
    name: 'Conteúdos',
    baseRoute: '/lesson-contents',
    icon: BookOpenIcon,
    roles: [UserRole.TEACHER],
    pathMapping: {
      [UserRole.TEACHER]: '/professor/lesson-contents',
    },
    displayNameMapping: {
      [UserRole.TEACHER]: 'Conteúdo Ministrado',
    },
  },
  {
    name: 'Horários',
    baseRoute: '/schedule',
    icon: CalendarIcon,
    roles: [UserRole.STUDENT],
    pathMapping: {
      [UserRole.STUDENT]: '/aluno/schedule',
    },
  },
  {
    name: 'Meus Filhos',
    baseRoute: '/children',
    icon: UserGroupIcon,
    roles: [UserRole.PARENT],
    pathMapping: {
      [UserRole.PARENT]: '/responsaveis/children',
    },
  },
  {
    name: 'Anos Letivos',
    baseRoute: '/academic-years',
    icon: CalendarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN],
    excludedOriginalRoles: [UserRole.SUPER_ADMIN_GLOBAL],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/academic-years',
      [UserRole.DIRECTOR]: '/admin/academic-years',
      [UserRole.INSTITUTION_ADMIN]: '/admin/academic-years',
    },
  },
  {
    name: 'Cursos',
    baseRoute: '/courses',
    icon: AcademicCapIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/courses',
      [UserRole.DIRECTOR]: '/admin/courses',
      [UserRole.INSTITUTION_ADMIN]: '/admin/courses',
    },
  },
  {
    name: 'Eventos',
    baseRoute: '/events',
    icon: CalendarIcon,
    roles: [UserRole.SUPER_ADMIN_GLOBAL, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN_GLOBAL]: '/admin/events',
      [UserRole.SUPER_ADMIN]: '/admin/events',
      [UserRole.INSTITUTION_ADMIN]: '/admin/events',
    },
  },
  {
    name: 'Comunicados',
    baseRoute: '/communication',
    icon: BellIcon,
    roles: [UserRole.SUPER_ADMIN_GLOBAL, UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    pathMapping: {
      [UserRole.SUPER_ADMIN_GLOBAL]: '/communication',
      [UserRole.SUPER_ADMIN]: '/communication',
      [UserRole.DIRECTOR]: '/communication',
      [UserRole.INSTITUTION_ADMIN]: '/communication',
      [UserRole.COORDINATOR]: '/communication',
      [UserRole.TEACHER]: '/communication',
      [UserRole.STUDENT]: '/communication',
      [UserRole.PARENT]: '/communication',
    },
  },
  {
    name: 'Configurações',
    baseRoute: '/configuracoes',
    icon: CogIcon,
    roles: [UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    pathMapping: {
      [UserRole.INSTITUTION_ADMIN]: '/configuracoes',
      [UserRole.COORDINATOR]: '/configuracoes',
      [UserRole.TEACHER]: '/configuracoes',
      [UserRole.STUDENT]: '/configuracoes',
      [UserRole.PARENT]: '/configuracoes',
    },
  },
  {
    name: 'Chamados de Suporte',
    baseRoute: '/support-tickets',
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.SUPER_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/super-admin/support-tickets',
    },
  },
];

interface SidebarProps {
  isDesktopCollapsed?: boolean;
  onDesktopCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({
  isDesktopCollapsed = false,
  onDesktopCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { startNavigation } = useAuthenticatedNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentRole = user?.activeProfile || user?.role;
  // O Super Admin Global usa a navegação administrativa completa. As exceções
  // ficam declaradas no próprio item, como no menu de Anos Letivos.
  const navigationRole =
    currentRole === UserRole.SUPER_ADMIN_GLOBAL ? UserRole.SUPER_ADMIN : currentRole;

  // #region debug-point menu-nav-bounce-sidebar
  const dbgEnabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('dbg');
  const dbgUrl = process.env.NEXT_PUBLIC_DEBUG_SERVER_URL || '';
  const dbgSession =
    process.env.NEXT_PUBLIC_DEBUG_SESSION_ID || 'menu-nav-bounce';
  const dbgEmit = (name: string, payload?: Record<string, unknown>) => {
    if (!dbgUrl) return;
    fetch(dbgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ts: Date.now(),
        sessionId: dbgSession,
        source: 'frontend',
        scope: 'Sidebar',
        name,
        payload: payload ?? {},
      }),
    }).catch(() => {});
  };
  // #endregion debug-point menu-nav-bounce-sidebar

  const filteredNavigation = useMemo(
    () =>
      navigation.filter((item) => {
        if (!navigationRole) return false;
        if (!item.roles.includes(navigationRole)) return false;
        if (item.requiresOriginalRole && !item.requiresOriginalRole.includes(currentRole as UserRole)) {
          return false;
        }
        if (item.excludedOriginalRoles?.includes(currentRole as UserRole)) {
          return false;
        }
        return true;
      }),
    [currentRole, navigationRole]
  );

  const navigationSections = useMemo<NavigationSection[]>(() => {
    const isAdministrativeRole =
      navigationRole === UserRole.INSTITUTION_ADMIN ||
      navigationRole === UserRole.SUPER_ADMIN ||
      navigationRole === UserRole.DIRECTOR;

    if (navigationRole === UserRole.TEACHER) {
      const itemMap = new Map(filteredNavigation.map((item) => [item.name, item]));
      const usedItemNames = new Set<string>();

      const sections = teacherSectionConfig
        .map((section) => {
          const items = section.itemNames
            .map((itemName) => itemMap.get(itemName))
            .filter((item): item is NavItem => Boolean(item));

          items.forEach((item) => usedItemNames.add(item.name));

          return {
            title: section.title,
            items,
          };
        })
        .filter((section) => section.items.length > 0);

      const remainingItems = filteredNavigation.filter(
        (item) => !usedItemNames.has(item.name)
      );

      if (remainingItems.length > 0) {
        sections.push({
          title: 'Outros',
          items: remainingItems,
        });
      }

      return sections;
    }

    if (navigationRole === UserRole.COORDINATOR) {
      const itemMap = new Map(filteredNavigation.map((item) => [item.name, item]));
      const usedItemNames = new Set<string>();

      const sections = coordinatorSectionConfig
        .map((section) => {
          const items = section.itemNames
            .map((itemName) => itemMap.get(itemName))
            .filter((item): item is NavItem => Boolean(item));

          items.forEach((item) => usedItemNames.add(item.name));

          return {
            title: section.title,
            items,
          };
        })
        .filter((section) => section.items.length > 0);

      const remainingItems = filteredNavigation.filter(
        (item) => !usedItemNames.has(item.name)
      );

      if (remainingItems.length > 0) {
        sections.push({
          title: 'Outros',
          items: remainingItems,
        });
      }

      return sections;
    }

    if (!isAdministrativeRole) {
      return [{ title: '', items: filteredNavigation }];
    }

    const itemMap = new Map(filteredNavigation.map((item) => [item.name, item]));
    const usedItemNames = new Set<string>();

    const sections = institutionAdminSectionConfig
      .map((section) => {
        const items = section.itemNames
          .map((itemName) => itemMap.get(itemName))
          .filter((item): item is NavItem => Boolean(item));

        items.forEach((item) => usedItemNames.add(item.name));

        return {
          title: section.title,
          items,
        };
      })
      .filter((section) => section.items.length > 0);

    const remainingItems = filteredNavigation.filter(
      (item) => !usedItemNames.has(item.name)
    );

    if (remainingItems.length > 0) {
      sections.push({
        title: navigationRole === UserRole.SUPER_ADMIN ? 'Administração' : 'Outros',
        items: remainingItems,
      });
    }

    return sections;
  }, [navigationRole, filteredNavigation]);

  const prefetchRoutes = useMemo(() => {
    if (!navigationRole) return [];

    return filteredNavigation
      .map((item) => getRouteForRole(item, navigationRole))
      .filter((route, index, routes) => routes.indexOf(route) === index)
      .slice(0, 8);
  }, [navigationRole, filteredNavigation]);

  usePrefetch({
    routes: prefetchRoutes,
    delay: 1200,
  });

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleDesktopCollapsed = () =>
    onDesktopCollapsedChange?.(!isDesktopCollapsed);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-secondary-200 shadow-md hover:bg-secondary-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6 text-secondary-700" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-secondary-700" />
        )}
      </button>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'flex h-full flex-col bg-white border-r border-secondary-200 transition-all duration-300 ease-in-out',
          isDesktopCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-64',
          'lg:translate-x-0 lg:static',
          "fixed inset-y-0 left-0 z-40",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-secondary-200',
          isDesktopCollapsed ? 'px-3 lg:px-3' : 'px-6'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 w-full',
            isDesktopCollapsed ? 'lg:justify-center' : 'lg:justify-between'
          )}
        >
          <Image
            src="/logo-grafos.png"
            alt="Logo Grafos"
            width={40}
            height={40}
            className={cn(
              'h-10 w-10 rounded-lg object-contain flex-shrink-0',
              isDesktopCollapsed && 'lg:hidden'
            )}
            priority
          />
          <div
            className={cn(
              'flex-1 min-w-0',
              isDesktopCollapsed && 'lg:hidden'
            )}
          >
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent truncate">Grafos</h1>
            <p className="text-xs text-secondary-500 truncate">Gestão Escolar</p>
          </div>
          <button
            type="button"
            onClick={toggleDesktopCollapsed}
            className="hidden lg:inline-flex items-center justify-center rounded-lg border border-secondary-200 p-2 text-secondary-500 transition-colors hover:bg-secondary-50 hover:text-secondary-700"
            aria-label={isDesktopCollapsed ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
            aria-pressed={isDesktopCollapsed}
          >
            {isDesktopCollapsed ? (
              <ChevronDoubleRightIcon className="h-4 w-4" />
            ) : (
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav id="navigation" className="flex flex-1 flex-col gap-y-4 overflow-y-auto px-4 py-4">
        {navigationSections.map((section) => (
          <div key={section.title || 'menu'} className="space-y-1">
            {section.title ? (
              <p
                className={cn(
                  'px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-400',
                  isDesktopCollapsed && 'lg:hidden'
                )}
              >
                {section.title}
              </p>
            ) : null}
            {section.items.map((item) => {
              const href = navigationRole ? getRouteForRole(item, navigationRole) : item.baseRoute;
              const isActive = pathname === href || pathname?.startsWith(href + '/');
              const itemLabel = navigationRole ? getLabelForRole(item, navigationRole) : item.name;
              return (
                <Link
                  key={item.name}
                  href={href}
                  onClick={() => {
                    dbgEmit('sidebar:click', {
                      from: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : null,
                      to: href,
                      role: navigationRole ?? null,
                      item: item.name,
                    });
                    if (dbgEnabled) {
                      window.setTimeout(() => {
                        dbgEmit('sidebar:afterClick:1s', {
                          location: `${window.location.pathname}${window.location.search}`,
                          expected: href,
                        });
                      }, 1000);
                      window.setTimeout(() => {
                        dbgEmit('sidebar:afterClick:4s', {
                          location: `${window.location.pathname}${window.location.search}`,
                          expected: href,
                        });
                      }, 4000);
                    }
                    startNavigation(href);
                    closeMobileMenu();
                  }}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isDesktopCollapsed ? 'lg:justify-center lg:gap-0' : 'gap-3',
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  )}
                  title={isDesktopCollapsed ? itemLabel : undefined}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
                    )}
                  />
                  <span
                    className={cn(
                      'truncate',
                      isDesktopCollapsed && 'lg:hidden'
                    )}
                  >
                    {itemLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Institution context at bottom */}
      {user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.SUPER_ADMIN_GLOBAL && (
        <div
          className={cn(
            'border-t border-secondary-200 px-4 py-3',
            isDesktopCollapsed && 'lg:hidden'
          )}
        >
          <InstitutionSwitcher />
        </div>
      )}
    </div>
    </>
  );
}
