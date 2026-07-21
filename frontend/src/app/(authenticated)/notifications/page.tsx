'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  notificationsService,
  Notification,
  NotificationType,
  NotificationStatus,
} from '@/services/notifications.service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<NotificationType | undefined>(
    undefined,
  );
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const limit = 20;

  // Query para listar notificações
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list', selectedStatus, selectedType, page],
    queryFn: () =>
      notificationsService.getMyNotifications(
        selectedStatus,
        selectedType,
        page,
        limit,
      ),
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const totalPages = notificationsData?.totalPages || 1;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PENDING_APPROVAL':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'USER_APPROVED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'GRADE_PUBLISHED':
      case 'NEW_ASSIGNMENT':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'LOW_GRADE':
      case 'ABSENCE':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'ASSIGNMENT_DUE':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      ABSENCE: 'Falta',
      LOW_GRADE: 'Nota Baixa',
      GENERAL_ANNOUNCEMENT: 'Anúncio Geral',
      ASSIGNMENT_DUE: 'Tarefa Vencendo',
      EVENT_REMINDER: 'Lembrete de Evento',
      MEETING: 'Reunião',
      BEHAVIOR_ALERT: 'Alerta de Comportamento',
      PENDING_APPROVAL: 'Aprovação Pendente',
      USER_APPROVED: 'Usuário Aprovado',
      GRADE_PUBLISHED: 'Nota Publicada',
      NEW_ASSIGNMENT: 'Nova Tarefa',
      SYSTEM: 'Sistema',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BellIcon className="h-8 w-8" />
            Notificações
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Visualize e gerencie todas as suas notificações
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtros:
              </span>
            </div>

            {/* Status Filter */}
            <select
              value={
                selectedStatus === undefined
                  ? 'all'
                  : selectedStatus
                  ? 'read'
                  : 'unread'
              }
              onChange={(e) => {
                const value = e.target.value;
                setSelectedStatus(
                  value === 'all'
                    ? undefined
                    : value === 'read'
                    ? true
                    : false,
                );
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">Todas</option>
              <option value="unread">Não lidas</option>
              <option value="read">Lidas</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedType(
                  value === 'all' ? undefined : (value as NotificationType),
                );
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">Todos os tipos</option>
              {Object.values(NotificationType).map((type) => (
                <option key={type} value={type}>
                  {getNotificationTypeLabel(type)}
                </option>
              ))}
            </select>

            {/* Mark all as read */}
            {notifications.length > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="ml-auto px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Carregando notificações...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Nenhuma notificação
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedType || selectedStatus !== undefined
                  ? 'Tente ajustar os filtros'
                  : 'Você está em dia!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-6 transition-colors relative',
                    notification.status === NotificationStatus.UNREAD &&
                      'bg-primary-50/30 dark:bg-primary-900/10',
                  )}
                >
                  {/* Unread indicator */}
                  {notification.status === NotificationStatus.UNREAD && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-600 rounded-full" />
                  )}

                  <div className="flex gap-4 pl-6">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2',
                        getNotificationColor(notification.type),
                      )}
                    >
                      <BellIcon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                  locale: ptBR,
                                },
                              )}
                            </p>
                            {notification.sentBy && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Enviado por {notification.sentBy.firstName}{' '}
                                {notification.sentBy.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {notification.status === NotificationStatus.UNREAD && (
                            <button
                              onClick={() =>
                                markAsReadMutation.mutate(notification.id)
                              }
                              disabled={markAsReadMutation.isPending}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                              title="Marcar como lida"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              deleteMutation.mutate(notification.id)
                            }
                            disabled={deleteMutation.isPending}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Deletar"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
