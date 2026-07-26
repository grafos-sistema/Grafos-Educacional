import api from '@/lib/api';
import {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementFilters,
} from '@/types/communication.types';
import { PaginatedResponse } from '@/types/common.types';

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
    if (filters.institutionId) params.append('institutionId', filters.institutionId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

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
    const response = await api.get<Announcement[]>('/announcements/active');
    return response as unknown as Announcement[];
  },
};
