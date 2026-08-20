'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MegaphoneIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { announcementsService } from '@/services/announcements.service';
import { eventsService } from '@/services/events.service';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/user.types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AnnouncementComposerModal } from '@/components/communication/AnnouncementComposerModal';
import { EventCalendar } from '@/components/communication/EventCalendar';
import { EventComposerModal } from '@/components/communication/EventComposerModal';

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN_GLOBAL: 'Super Admin Global',
  SUPER_ADMIN: 'Super Admin',
  INSTITUTION_ADMIN: 'Secretário(a)',
  DIRECTOR: 'Direção',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
  PARENT: 'Responsável',
};

type AudienceTab = 'general' | 'coordination' | 'teachers' | 'students' | 'parents';

const audienceLabels: Record<AudienceTab, string> = {
  general: 'Geral',
  coordination: 'Coordenação',
  teachers: 'Professores',
  students: 'Alunos',
  parents: 'Responsáveis',
};

function announcementBelongsToAudience(announcement: { targetRoles?: string[] }, audience: AudienceTab) {
  const roles = announcement.targetRoles ?? [];
  const hasStudent = roles.includes(UserRole.STUDENT);
  const hasParent = roles.includes(UserRole.PARENT);
  const staffRoles = [UserRole.DIRECTOR, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER];

  if (audience === 'students') return hasStudent;
  if (audience === 'parents') return hasParent && !hasStudent;
  if (audience === 'coordination') return roles.includes(UserRole.COORDINATOR) && !hasStudent && !hasParent;
  if (audience === 'teachers') return roles.includes(UserRole.TEACHER) && !hasStudent && !hasParent;
  return staffRoles.filter((role) => roles.includes(role)).length >= 2 && !hasStudent && !hasParent;
}

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isEventComposerOpen, setIsEventComposerOpen] = useState(false);
  const [eventDraftDate, setEventDraftDate] = useState<Date | null>(null);
  const [composerMode, setComposerMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [isComposerMenuOpen, setIsComposerMenuOpen] = useState(false);
  const [activeAudience, setActiveAudience] = useState<AudienceTab>('general');
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const composerMenuRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((state) => state.user);
  const currentRole = user?.activeProfile || user?.role;
  const canManageAnnouncements = [
    UserRole.SUPER_ADMIN_GLOBAL,
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  ].includes((currentRole ?? user?.role) as UserRole);
  const canManageEvents = [
    UserRole.DIRECTOR,
    UserRole.COORDINATOR,
  ].includes((currentRole ?? user?.role) as UserRole);

  const audienceTabs = useMemo(() => {
    if (currentRole === UserRole.TEACHER) return ['teachers', 'students', 'parents'] as AudienceTab[];
    if (currentRole === UserRole.STUDENT) return ['students'] as AudienceTab[];
    if (currentRole === UserRole.PARENT) return ['students', 'parents'] as AudienceTab[];
    return ['general', 'coordination', 'teachers', 'students', 'parents'] as AudienceTab[];
  }, [currentRole]);

  useEffect(() => {
    if (!audienceTabs.includes(activeAudience)) setActiveAudience(audienceTabs[0] ?? 'students');
  }, [activeAudience, audienceTabs]);

  // Buscar comunicados ativos
  const { data: announcements, isLoading: loadingAnnouncements, isError: announcementsError, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['announcements-active', user?.id, currentRole],
    queryFn: () => announcementsService.findActiveForUser(),
    enabled: Boolean(user),
    retry: 1,
  });

  // Buscar próximos eventos (próximos 60 dias)
  const { data: upcomingEvents } = useQuery({
    queryKey: ['events-upcoming', user?.id],
    queryFn: () => eventsService.findUpcoming(60),
    enabled: Boolean(user),
    retry: 1,
  });

  const {
    data: calendarEvents,
    isLoading: loadingCalendar,
    isError: calendarError,
  } = useQuery({
    queryKey: ['events-calendar', user?.id, calendarYear],
    queryFn: () => eventsService.findForYear(calendarYear),
    enabled: Boolean(user),
    retry: 1,
  });

  // Sort by priority (urgent first)
  const sortedAnnouncements = [...(announcements ?? [])].sort((a, b) => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });
  const visibleAnnouncements = sortedAnnouncements.filter((announcement) =>
    announcementBelongsToAudience(announcement, activeAudience),
  );

  useEffect(() => {
    if (!isComposerMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!composerMenuRef.current?.contains(event.target as Node)) {
        setIsComposerMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsComposerMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isComposerMenuOpen]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Comunicados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe os comunicados enviados pela gestão e os próximos eventos da instituição.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'events' && canManageEvents ? (
            <button
              type="button"
              onClick={() => {
                setEventDraftDate(null);
                setIsEventComposerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-600 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:bg-gray-900 dark:text-primary-300 dark:hover:bg-primary-900/20 dark:focus:ring-offset-gray-900"
            >
              <CalendarDaysIcon className="h-5 w-5" />
              <span>Criar Evento</span>
            </button>
          ) : null}

          {activeTab === 'announcements' && canManageAnnouncements ? (
            <div ref={composerMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsComposerMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Criar comunicado</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {isComposerMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-lg border border-gray-200 bg-white p-2 shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-900">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    Tipo de envio
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setComposerMode('immediate');
                      setIsComposerMenuOpen(false);
                      setIsComposerOpen(true);
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-3 text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Enviar agora
                    </span>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Abre o modal já preparado para publicação imediata.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposerMode('scheduled');
                      setIsComposerMenuOpen(false);
                      setIsComposerOpen(true);
                    }}
                    className="mt-1 flex w-full flex-col rounded-lg px-3 py-3 text-left transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Programar comunicado
                    </span>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Abre o modal com data e hora futura já habilitadas.
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'announcements'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <MegaphoneIcon className="h-5 w-5" />
              Comunicados
              {announcements && announcements.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  {announcements.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <CalendarDaysIcon className="h-5 w-5" />
              Próximos Eventos
              {upcomingEvents && upcomingEvents.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                  {upcomingEvents.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo */}
      {activeTab === 'announcements' ? (
        <div>
          {loadingAnnouncements ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Carregando comunicados..." />
            </div>
          ) : announcementsError ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
              <MegaphoneIcon className="mx-auto mb-4 h-16 w-16 text-amber-500" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Não foi possível carregar os comunicados
              </h3>
              <p className="mb-5 text-gray-500 dark:text-gray-400">
                Tente atualizar esta área em alguns instantes.
              </p>
              <button
                type="button"
                onClick={() => refetchAnnouncements()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : !announcements || announcements.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <MegaphoneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum comunicado no momento
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Novos comunicados aparecerão aqui quando forem publicados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
                {audienceTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveAudience(tab)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeAudience === tab
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {audienceLabels[tab]}
                  </button>
                ))}
              </div>
              {visibleAnnouncements.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
                  <MegaphoneIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Nenhum comunicado nesta categoria
                  </h3>
                </div>
              ) : visibleAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                    announcement.priority === 'urgent'
                      ? 'border-l-4 border-red-500'
                      : announcement.priority === 'high'
                      ? 'border-l-4 border-yellow-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    <Badge variant={priorityColors[announcement.priority] || 'default'} size="sm">
                      {priorityLabels[announcement.priority] || announcement.priority}
                    </Badge>
                    {announcement.targetRoles?.map((role) => (
                      <Badge key={role} variant="default" size="sm">
                        {roleLabels[role] || role}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                    {announcement.content}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {announcement.publishedAt && (
                      <>
                        Publicado em {new Date(announcement.publishedAt).toLocaleDateString('pt-BR')}
                      </>
                    )}
                    {announcement.expiresAt && (
                      <>
                        {' · '}Válido até{' '}
                        {new Date(announcement.expiresAt).toLocaleDateString('pt-BR')}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {loadingCalendar ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Carregando eventos..." />
            </div>
          ) : calendarError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
              <CalendarDaysIcon className="mx-auto mb-3 h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Não foi possível carregar os eventos
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                Tente atualizar esta área novamente em alguns instantes.
              </p>
            </div>
          ) : (
            <EventCalendar
              year={calendarYear}
              events={calendarEvents ?? []}
              onYearChange={setCalendarYear}
              canManageEvents={canManageEvents}
              onCreateEvent={(date) => {
                setEventDraftDate(date);
                setIsEventComposerOpen(true);
              }}
            />
          )}
        </div>
      )}

      <AnnouncementComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        mode={composerMode}
      />
      <EventComposerModal
        isOpen={isEventComposerOpen}
        initialDate={eventDraftDate}
        onClose={() => {
          setIsEventComposerOpen(false);
          setEventDraftDate(null);
        }}
        user={user}
      />
    </div>
  );
}
