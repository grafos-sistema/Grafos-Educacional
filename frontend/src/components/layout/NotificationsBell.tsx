'use client';

import { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService, Notification, NotificationStatus } from '@/services/notifications.service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const userId = useAuthStore((state) => state.user?.id);

  // Query para contar não lidas
  const { data: unreadData, refetch: refetchUnread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const result = await notificationsService.getUnreadCount(userId);
      return result;
    },
    refetchInterval: 33330, // Atualiza a cada 30 segundos
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Query para listar notificações
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const result = await notificationsService.getMyNotifications(undefined, undefined, 1, 10);
      return result;
    },
    enabled: isOpen, // Só carrega quando abre o dropdown
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.notifications || [];

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    // Você pode adicionar ícones diferentes por tipo aqui
    return <BellIcon className="h-5 w-5" />;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PENDING_APPROVAL':
        return 'text-yellow-600 bg-yellow-50';
      case 'USER_APPROVED':
        return 'text-green-600 bg-green-50';
      case 'GRADE_PUBLISHED':
        return 'text-blue-600 bg-blue-50';
      case 'LOW_GRADE':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Menu as="div" className="relative">
      {({ open }) => {
        if (open !== isOpen) {
          setIsOpen(open);
        }
        return (
          <>
            <Menu.Button className="relative rounded-full p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 transition-colors">
              <span className="sr-only">Ver notificações</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-96 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-secondary-900/5 focus:outline-none max-h-[500px] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-secondary-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-secondary-900">Notificações</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <BellIcon className="h-12 w-12 text-secondary-300 mx-auto mb-2" />
                      <p className="text-sm text-secondary-500">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-secondary-100">
                      {notifications.map((notification) => (
                        <Menu.Item key={notification.id}>
                          {({ active }) => (
                            <div
                              className={cn(
                                'px-4 py-3 transition-colors relative',
                                active && 'bg-secondary-50',
                                notification.status === NotificationStatus.UNREAD && 'bg-primary-50/30'
                              )}
                            >
                              {/* Unread indicator */}
                              {notification.status === NotificationStatus.UNREAD && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-600 rounded-full" />
                              )}

                              <div className="flex gap-3">
                                {/* Icon */}
                                <div className={cn(
                                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                                  getNotificationColor(notification.type)
                                )}>
                                  {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-secondary-900 truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-secondary-600 mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-secondary-400 mt-1">
                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1">
                                  {notification.status === NotificationStatus.UNREAD && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                                      className="p-1 rounded hover:bg-secondary-200 text-secondary-500 hover:text-secondary-700"
                                      title="Marcar como lida"
                                    >
                                      <CheckIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDelete(notification.id, e)}
                                    className="p-1 rounded hover:bg-danger-100 text-secondary-500 hover:text-danger-600"
                                    title="Deletar"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-secondary-100">
                    <Link
                      href="/notifications"
                      className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Ver todas as notificações
                    </Link>
                  </div>
                )}
              </Menu.Items>
            </Transition>
          </>
        );
      }}
    </Menu>
  );
}
