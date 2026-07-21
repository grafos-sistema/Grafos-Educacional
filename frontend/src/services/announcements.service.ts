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

    if (filters.target) params.append('target', filters.target);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.isPinned !== undefined) params.append('isPinned', String(filters.isPinned));
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Announcement>>(
      `/announcements?${params.toString()}`
    );
    return response as unknown as PaginatedResponse<Announcement>;
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
  async togglePin(id: string): Promise<Announcement> {
    const response = await api.patch<Announcement>(`/announcements/${id}/toggle-pin`);
    return response as unknown as Announcement;
  },

  /**
   * Ativar/desativar comunicado
   */
  async toggleActive(id: string): Promise<Announcement> {
    const response = await api.patch<Announcement>(`/announcements/${id}/toggle-active`);
    return response as unknown as Announcement;
  },

  /**
   * Buscar comunicados ativos para um usuário
   */
  async findActiveForUser(): Promise<Announcement[]> {
    const response = await api.get<Announcement[]>('/announcements/active');
    return response as unknown as Announcement[];
  },
};
