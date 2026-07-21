import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { supabase } from '@/lib/supabase';

export enum NotificationType {
  ABSENCE = 'ABSENCE',
  LOW_GRADE = 'LOW_GRADE',
  GENERAL_ANNOUNCEMENT = 'GENERAL_ANNOUNCEMENT',
  ASSIGNMENT_DUE = 'ASSIGNMENT_DUE',
  EVENT_REMINDER = 'EVENT_REMINDER',
  MEETING = 'MEETING',
  BEHAVIOR_ALERT = 'BEHAVIOR_ALERT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  USER_APPROVED = 'USER_APPROVED',
  GRADE_PUBLISHED = 'GRADE_PUBLISHED',
  NEW_ASSIGNMENT = 'NEW_ASSIGNMENT',
  SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
  SENT = 'SENT',
  READ = 'READ',
  UNREAD = 'UNREAD',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  data?: string;
  readAt?: string;
  sentAt: string;
  createdAt: string;
  sentBy?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationsService = {
  async getMyNotifications(
    read?: boolean,
    type?: NotificationType,
    page = 1,
    limit = 20,
  ): Promise<NotificationsResponse> {
    const profile = await fetchCurrentUserProfile();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('userId', profile.id)
      .order('sentAt', { ascending: false })
      .range(from, to);

    if (type) {
      query = query.eq('type', type);
    }

    if (read === true) {
      query = query.not('readAt', 'is', null);
    } else if (read === false) {
      query = query.is('readAt', null);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      notifications: (data ?? []) as Notification[],
      total,
      page,
      limit,
      totalPages,
    };
  },

  async getUnreadCount(userId?: string): Promise<{ count: number }> {
    const resolvedUserId = userId ?? (await fetchCurrentUserProfile()).id;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('userId', resolvedUserId)
      .is('readAt', null);

    if (error) {
      throw error;
    }

    return { count: count ?? 0 };
  },

  async getPendingApprovalsCount(): Promise<{ count: number }> {
    const profile = await fetchCurrentUserProfile();

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('userId', profile.id)
      .eq('type', NotificationType.PENDING_APPROVAL)
      .is('readAt', null);

    if (error) {
      throw error;
    }

    return { count: count ?? 0 };
  },

  async markAsRead(notificationId: string): Promise<void> {
    const profile = await fetchCurrentUserProfile();

    const { error } = await supabase
      .from('notifications')
      .update({
        status: NotificationStatus.READ,
        readAt: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('userId', profile.id);

    if (error) {
      throw error;
    }
  },

  async markAllAsRead(): Promise<void> {
    const profile = await fetchCurrentUserProfile();

    const { error } = await supabase
      .from('notifications')
      .update({
        status: NotificationStatus.READ,
        readAt: new Date().toISOString(),
      })
      .eq('userId', profile.id)
      .is('readAt', null);

    if (error) {
      throw error;
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const profile = await fetchCurrentUserProfile();

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('userId', profile.id);

    if (error) {
      throw error;
    }
  },
};
