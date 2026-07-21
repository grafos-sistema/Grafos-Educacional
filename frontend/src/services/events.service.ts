import api from '@/lib/api';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventFilters,
} from '@/types/communication.types';
import { PaginatedResponse } from '@/types/common.types';

export const eventsService = {
  /**
   * Listar eventos com filtros
   */
  async findAll(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', filters.type);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Event>>(`/events?${params.toString()}`);
    return response as unknown as PaginatedResponse<Event>;
  },

  /**
   * Buscar evento por ID
   */
  async findOne(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response as unknown as Event;
  },

  /**
   * Criar novo evento
   */
  async create(data: CreateEventDto): Promise<Event> {
    const response = await api.post<Event>('/events', data);
    return response as unknown as Event;
  },

  /**
   * Atualizar evento
   */
  async update(id: string, data: UpdateEventDto): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}`, data);
    return response as unknown as Event;
  },

  /**
   * Remover evento
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  /**
   * Buscar eventos próximos
   */
  async findUpcoming(days: number = 30): Promise<Event[]> {
    const response = await api.get<Event[]>(`/events/upcoming?days=${days}`);
    return response as unknown as Event[];
  },

  /**
   * Buscar eventos de uma turma
   */
  async findByClass(classId: string): Promise<Event[]> {
    const response = await api.get<Event[]>(`/events/class/${classId}`);
    return response as unknown as Event[];
  },

  /**
   * Buscar eventos do calendário (por mês)
   */
  async findByMonth(year: number, month: number): Promise<Event[]> {
    const response = await api.get<Event[]>(`/events/calendar/${year}/${month}`);
    return response as unknown as Event[];
  },
};
