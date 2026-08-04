import api from '@/lib/api';
import { getValidInstitutionIds, isUuid } from '@/lib/institution-filter';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementFilters,
} from '@/types/communication.types';
import { PaginatedResponse } from '@/types/common.types';
import { UserRole } from '@/types/user.types';

type AnnouncementRow = Omit<Announcement, 'institution'>;

async function findActiveAnnouncementsForGlobalAdmins(): Promise<Announcement[]> {
  const { institutionFilterAll, institutionFilterIds, user } = useAuthStore.getState();
  const currentRole = user?.activeProfile || user?.role;

  if (currentRole !== UserRole.SUPER_ADMIN_GLOBAL) {
    throw new Error('Fallback exclusivo para SUPER_ADMIN_GLOBAL.');
  }

  const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, content, priority, targetRoles, targetStudentIds, targetParentIds, isPublished, publishedAt, expiresAt, attachments, institutionId, createdById, createdAt, updatedAt')
    .eq('isPublished', true)
    .order('publishedAt', { ascending: false });

  if (error) throw error;

  const activeAnnouncements = ((data ?? []) as AnnouncementRow[]).filter((announcement) => {
    const isPublishedForNow =
      !announcement.publishedAt || new Date(announcement.publishedAt).getTime() <= Date.now();
    const isNotExpired =
      !announcement.expiresAt || new Date(announcement.expiresAt).getTime() > Date.now();
    const matchesInstitution =
      effectiveIds.length === 0 ||
      !announcement.institutionId ||
      effectiveIds.includes(announcement.institutionId);

    return isPublishedForNow && isNotExpired && matchesInstitution;
  });

  const institutionIds = Array.from(
    new Set(
      activeAnnouncements
        .map((announcement) => announcement.institutionId)
        .filter((value): value is string => Boolean(value))
    )
  );

  let institutionsById = new Map<string, { id: string; name: string }>();

  if (institutionIds.length > 0) {
    const { data: institutions, error: institutionsError } = await supabase
      .from('institutions')
      .select('id, name')
      .in('id', institutionIds);

    if (institutionsError) throw institutionsError;

    institutionsById = new Map(
      (institutions ?? []).map((institution) => [institution.id as string, institution as { id: string; name: string }])
    );
  }

  return activeAnnouncements.map((announcement) => ({
    ...announcement,
    institution: announcement.institutionId
      ? institutionsById.get(announcement.institutionId)
      : undefined,
  }));
}

export const announcementsService = {
  /**
   * Listar comunicados com filtros
   */
  async findAll(filters: AnnouncementFilters = {}): Promise<PaginatedResponse<Announcement>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.targetRole) params.append('targetRole', filters.targetRole);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.onlyPublished !== undefined) {
      params.append('onlyPublished', String(filters.onlyPublished));
    }
    if (filters.onlyActive !== undefined) {
      params.append('onlyActive', String(filters.onlyActive));
    }
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const { institutionFilterAll, institutionFilterIds } = useAuthStore.getState();
    const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append('institutionIds', effectiveIds.join(','));
    } else if (effectiveIds.length === 1) {
      params.append('institutionId', effectiveIds[0]);
    } else if (isUuid(filters.institutionId)) {
      params.append('institutionId', filters.institutionId);
    }

    const queryString = params.toString();
    const response = (await api.get<PaginatedResponse<Announcement>>(
      queryString ? `/announcements?${queryString}` : '/announcements'
    )) as unknown as PaginatedResponse<Announcement>;

    return {
      ...response,
      data: response.data ?? [],
      meta: {
        ...response.meta,
        total: response.meta?.total ?? 0,
        page: response.meta?.page ?? filters.page ?? 1,
        limit: response.meta?.limit ?? filters.limit ?? 10,
        totalPages: response.meta?.totalPages ?? 1,
        hasNextPage:
          response.meta?.hasNextPage ??
          (response.meta?.page ?? filters.page ?? 1) < (response.meta?.totalPages ?? 1),
        hasPreviousPage:
          response.meta?.hasPreviousPage ?? (response.meta?.page ?? filters.page ?? 1) > 1,
      },
    };
  },

  /**
   * Buscar comunicado por ID
   */
  async findOne(id: string): Promise<Announcement> {
    const response = await api.get<Announcement>(`/announcements/${id}`);
    return response as unknown as Announcement;
  },

  /**
   * Criar novo comunicado
   */
  async create(data: CreateAnnouncementDto): Promise<Announcement> {
    const response = await api.post<Announcement>('/announcements', data);
    return response as unknown as Announcement;
  },

  /**
   * Atualizar comunicado
   */
  async update(id: string, data: UpdateAnnouncementDto): Promise<Announcement> {
    const response = await api.patch<Announcement>(`/announcements/${id}`, data);
    return response as unknown as Announcement;
  },

  /**
   * Remover comunicado
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/announcements/${id}`);
  },

  /**
   * Fixar/desafixar comunicado
   */
  async togglePin(): Promise<Announcement> {
    throw new Error('Fixar comunicados nao e suportado pelo backend atual.');
  },

  /**
   * Publicar comunicado
   */
  async publish(id: string): Promise<Announcement> {
    const response = await api.patch<Announcement>(`/announcements/${id}/publish`);
    return response as unknown as Announcement;
  },

  /**
   * Despublicar comunicado
   */
  async unpublish(id: string): Promise<Announcement> {
    const response = await api.patch<Announcement>(`/announcements/${id}/unpublish`);
    return response as unknown as Announcement;
  },

  /**
   * Ativar/desativar comunicado
   */
  async toggleActive(id: string): Promise<Announcement> {
    const announcement = await announcementsService.findOne(id);
    return announcement.isPublished
      ? announcementsService.unpublish(id)
      : announcementsService.publish(id);
  },

  /**
   * Buscar comunicados ativos para um usuário
   */
  async findActiveForUser(): Promise<Announcement[]> {
    const currentUser = useAuthStore.getState().user;
    const currentRole = currentUser?.activeProfile || currentUser?.role;

    if (currentRole === UserRole.SUPER_ADMIN_GLOBAL) {
      return findActiveAnnouncementsForGlobalAdmins();
    }

    const params = new URLSearchParams();
    const { institutionFilterAll, institutionFilterIds } = useAuthStore.getState();
    const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append('institutionIds', effectiveIds.join(','));
    } else if (effectiveIds.length === 1) {
      params.append('institutionId', effectiveIds[0]);
    }

    const queryString = params.toString();
    const response = await api.get<Announcement[]>(
      queryString ? `/announcements/active?${queryString}` : '/announcements/active'
    );
    return response as unknown as Announcement[];
  },
};
