import api from '@/lib/api';
import {
  Observation,
  CreateObservationDto,
  UpdateObservationDto,
  ObservationFilters,
} from '@/types/observation.types';
import { PaginatedResponse } from '@/types/common.types';

export const observationsService = {
  /**
   * Listar observações com filtros
   */
  async findAll(filters: ObservationFilters = {}): Promise<PaginatedResponse<Observation>> {
    const params = new URLSearchParams();

    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.type) params.append('type', filters.type);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Observation>>(
      `/observations?${params.toString()}`
    );
    return response as unknown as PaginatedResponse<Observation>;
  },

  /**
   * Buscar observação por ID
   */
  async findOne(id: string): Promise<Observation> {
    const response = await api.get<Observation>(`/observations/${id}`);
    return response as unknown as Observation;
  },

  /**
   * Criar nova observação
   */
  async create(data: CreateObservationDto): Promise<Observation> {
    const response = await api.post<Observation>('/observations', data);
    return response as unknown as Observation;
  },

  /**
   * Atualizar observação
   */
  async update(id: string, data: UpdateObservationDto): Promise<Observation> {
    const response = await api.patch<Observation>(`/observations/${id}`, data);
    return response as unknown as Observation;
  },

  /**
   * Remover observação
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/observations/${id}`);
  },

  /**
   * Buscar observações de um aluno
   */
  async findByStudent(studentId: string): Promise<Observation[]> {
    const response = await api.get<Observation[]>(`/observations/student/${studentId}`);
    return response as unknown as Observation[];
  },
};
