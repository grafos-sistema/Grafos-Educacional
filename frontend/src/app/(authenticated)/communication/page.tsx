'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MegaphoneIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { announcementsService } from '@/services/announcements.service';
import { eventsService } from '@/services/events.service';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
  SUPER_ADMIN: 'Super Admin',
  INSTITUTION_ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
  PARENT: 'Responsável',
};

const typeLabels: Record<string, string> = {
  MEETING: 'Reunião',
  EXAM: 'Prova',
  HOLIDAY: 'Feriado',
  SCHOOL_EVENT: 'Evento Escolar',
  PARENT_MEETING: 'Reunião de Pais',
  SPORTS: 'Esportivo',
  CULTURAL: 'Cultural',
  OTHER: 'Outro',
};

const typeColors: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  MEETING: 'info',
  EXAM: 'error',
  HOLIDAY: 'success',
  SCHOOL_EVENT: 'warning',
  PARENT_MEETING: 'info',
  SPORTS: 'success',
  CULTURAL: 'warning',
  OTHER: 'default',
};

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');

  // Buscar comunicados ativos
  const { data: announcements, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['announcements-active'],
    queryFn: () => announcementsService.findActiveForUser(),
  });

  // Buscar próximos eventos (próximos 60 dias)
  const { data: upcomingEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: () => eventsService.findUpcoming(60),
  });

  // Sort by priority (urgent first)
  const sortedAnnouncements = announcements?.sort((a, b) => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  }) || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Comunicados e Eventos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Fique por dentro das novidades e eventos da instituição
        </p>
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
              {sortedAnnouncements.map((announcement) => (
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
          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Carregando eventos..." />
            </div>
          ) : !upcomingEvents || upcomingEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum evento próximo
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Novos eventos aparecerão aqui quando forem agendados
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((event) => {
                  const isToday =
                    new Date(event.startDate).toDateString() === new Date().toDateString();
                  const daysUntil = Math.ceil(
                    (new Date(event.startDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={event.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 ${
                        isToday
                          ? 'border-red-500'
                          : daysUntil <= 7
                          ? 'border-yellow-500'
                          : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={typeColors[event.type]} size="sm">
                          {typeLabels[event.type]}
                        </Badge>
                        {isToday && (
                          <Badge variant="error" size="sm">
                            Hoje
                          </Badge>
                        )}
                        {!isToday && daysUntil <= 7 && daysUntil > 0 && (
                          <Badge variant="warning" size="sm">
                            Em {daysUntil} {daysUntil === 1 ? 'dia' : 'dias'}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {event.title}
                      </h3>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString('pt-BR')}
                            {event.endDate && event.startDate !== event.endDate && (
                              <> até {new Date(event.endDate).toLocaleDateString('pt-BR')}</>
                            )}
                          </span>
                        </div>

                        {event.isAllDay && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>Dia inteiro</span>
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
