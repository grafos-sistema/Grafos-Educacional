import api from '@/lib/api';
import {
  LessonPlan,
  CreateLessonPlanDto,
  UpdateLessonPlanDto,
  LessonPlanStatus,
} from '@/types/lesson.types';
import { PaginatedResponse } from '@/types/common.types';

export interface LessonPlansFilterParams {
  page?: number;
  limit?: number;
  classSubjectId?: string;
  teacherId?: string;
  status?: LessonPlanStatus;
  startDate?: string;
  endDate?: string;
}

export const lessonPlansService = {
  /**
   * Listar planos de aula com filtros
   */
  async findAll(params: LessonPlansFilterParams = {}): Promise<PaginatedResponse<LessonPlan>> {
    const response = await api.get<PaginatedResponse<LessonPlan>>('/lesson-plans', { params });
    return response as unknown as PaginatedResponse<LessonPlan>;
  },

  /**
   * Buscar plano de aula por ID
   */
  async findOne(id: string): Promise<LessonPlan> {
    const response = await api.get<LessonPlan>(`/lesson-plans/${id}`);
    return response as unknown as LessonPlan;
  },

  /**
   * Criar novo plano de aula
   */
  async create(data: CreateLessonPlanDto): Promise<LessonPlan> {
    const response = await api.post<LessonPlan>('/lesson-plans', data);
    return response as unknown as LessonPlan;
  },

  /**
   * Atualizar plano de aula
   */
  async update(id: string, data: UpdateLessonPlanDto): Promise<LessonPlan> {
    const response = await api.patch<LessonPlan>(`/lesson-plans/${id}`, data);
    return response as unknown as LessonPlan;
  },

  /**
   * Remover plano de aula
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/lesson-plans/${id}`);
  },

  /**
   * Submeter plano de aula para aprovaÃ§Ã£o
   */
  async submit(id: string): Promise<LessonPlan> {
    const response = await api.post<LessonPlan>(`/lesson-plans/${id}/submit`);
    return response as unknown as LessonPlan;
  },

  /**
   * Aprovar plano de aula (coordenador)
   */
  async approve(id: string): Promise<LessonPlan> {
    const response = await api.post<LessonPlan>(`/lesson-plans/${id}/approve`);
    return response as unknown as LessonPlan;
  },

  /**
   * Rejeitar plano de aula (coordenador)
   */
  async reject(id: string, reason: string): Promise<LessonPlan> {
    const response = await api.post<LessonPlan>(`/lesson-plans/${id}/reject`, { reason });
    return response as unknown as LessonPlan;
  },

  /**
   * Buscar planos de aula por professor
   */
  async findByTeacher(teacherId: string): Promise<LessonPlan[]> {
    const response = await api.get<LessonPlan[]>(`/lesson-plans/teacher/${teacherId}`);
    return response as unknown as LessonPlan[];
  },

  /**
   * Buscar planos de aula por turma/disciplina
   */
  async findByClassSubject(classSubjectId: string): Promise<LessonPlan[]> {
    const response = await api.get<LessonPlan[]>(`/lesson-plans/class-subject/${classSubjectId}`);
    return response as unknown as LessonPlan[];
  },
};
