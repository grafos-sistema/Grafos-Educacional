'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { cn } from '@/lib/utils';
import { usePrefetch } from '@/hooks/usePrefetch';
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
  icon: any;
  roles: UserRole[];
  pathMapping: Partial<Record<UserRole, string>>; // Role-specific paths
}

// Helper function to get role-specific route
const getRouteForRole = (item: NavItem, role: UserRole): string => {
  return item.pathMapping[role] || item.baseRoute;
};

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    baseRoute: '/dashboard',
    icon: HomeIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/dashboard',
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
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/users',
      [UserRole.INSTITUTION_ADMIN]: '/admin/users',
    },
  },
  {
    name: 'Professores',
    baseRoute: '/teachers',
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/professores',
      [UserRole.INSTITUTION_ADMIN]: '/admin/professores',
    },
  },
  {
    name: 'Alunos',
    baseRoute: '/students',
    icon: UserGroupIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/alunos',
      [UserRole.INSTITUTION_ADMIN]: '/admin/alunos',
    },
  },
  {
    name: 'Coordenadores',
    baseRoute: '/coordinators',
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/coordenadores',
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
    name: 'Turmas',
    baseRoute: '/classes',
    icon: BookOpenIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.TEACHER],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/classes',
      [UserRole.INSTITUTION_ADMIN]: '/admin/classes',
      [UserRole.TEACHER]: '/professor/my-classes',
    },
  },
  {
    name: 'Disciplinas',
    baseRoute: '/subjects',
    icon: BookOpenIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.STUDENT],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/subjects',
      [UserRole.INSTITUTION_ADMIN]: '/admin/subjects',
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
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/rankings',
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
    roles: [UserRole.SUPER_ADMIN, UserRole.TEACHER],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/super-admin/questions',
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
    roles: [UserRole.SUPER_ADMIN, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/teacher-schedules',
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
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/academic-years',
      [UserRole.INSTITUTION_ADMIN]: '/admin/academic-years',
    },
  },
  {
    name: 'Cursos',
    baseRoute: '/courses',
    icon: AcademicCapIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/courses',
      [UserRole.INSTITUTION_ADMIN]: '/admin/courses',
    },
  },
  {
    name: 'Comunicados',
    baseRoute: '/announcements',
    icon: BellIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/announcements',
      [UserRole.INSTITUTION_ADMIN]: '/admin/announcements',
    },
  },
  {
    name: 'Eventos',
    baseRoute: '/events',
    icon: CalendarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN],
    pathMapping: {
      [UserRole.SUPER_ADMIN]: '/admin/events',
      [UserRole.INSTITUTION_ADMIN]: '/admin/events',
    },
  },
  {
    name: 'Comunicação',
    baseRoute: '/communication',
    icon: BellIcon,
    roles: [UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    pathMapping: {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentRole = user?.activeProfile || user?.role;

  const filteredNavigation = useMemo(
    () =>
      navigation.filter((item) =>
        currentRole ? item.roles.includes(currentRole) : false
      ),
    [currentRole]
  );

  const prefetchRoutes = useMemo(() => {
    if (!currentRole) return [];

    return filteredNavigation
      .map((item) => getRouteForRole(item, currentRole))
      .filter((route, index, routes) => routes.indexOf(route) === index)
      .slice(0, 8);
  }, [currentRole, filteredNavigation]);

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
      <nav id="navigation" className="flex flex-1 flex-col gap-y-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const href = currentRole ? getRouteForRole(item, currentRole) : item.baseRoute;
            const isActive = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={item.name}
                href={href}
                onClick={closeMobileMenu}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isDesktopCollapsed ? 'lg:justify-center lg:gap-0' : 'gap-3',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                )}
                title={isDesktopCollapsed ? item.name : undefined}
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
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="border-t border-secondary-200 p-4">
          <div
            className={cn(
              'flex items-center gap-3',
              isDesktopCollapsed && 'lg:justify-center'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white shadow-md">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div
              className={cn(
                'flex-1 overflow-hidden',
                isDesktopCollapsed && 'lg:hidden'
              )}
            >
              <p className="truncate text-sm font-medium text-secondary-900">{user.firstName} {user.lastName}</p>
              <p className="truncate text-xs text-secondary-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
