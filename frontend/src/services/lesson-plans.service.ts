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
  academicPeriodId?: string;
}

const normalizeLessonPlan = (plan: any): LessonPlan => ({
  ...plan,
  assessment: plan?.assessment ?? plan?.evaluation ?? '',
});

const applyLocalFilters = (
  plans: LessonPlan[],
  params: LessonPlansFilterParams
): LessonPlan[] => {
  return plans.filter((plan) => {
    if (params.status && plan.status !== params.status) return false;
    if (params.startDate && new Date(plan.endDate) < new Date(params.startDate)) return false;
    if (params.endDate && new Date(plan.startDate) > new Date(params.endDate)) return false;
    if (params.academicPeriodId && plan.academicPeriodId !== params.academicPeriodId) return false;
    return true;
  });
};

const buildPayload = (data: CreateLessonPlanDto | UpdateLessonPlanDto) => {
  const payload = { ...data } as Record<string, any>;

  if ('assessment' in payload) {
    payload.evaluation = payload.assessment;
    delete payload.assessment;
  }

  return payload;
};

export const lessonPlansService = {
  /**
   * Listar planos de aula com filtros
   */
  async findAll(params: LessonPlansFilterParams = {}): Promise<PaginatedResponse<LessonPlan>> {
    const response = (await api.get<PaginatedResponse<any>>('/lesson-plans', {
      params: {
        page: params.page,
        limit: params.limit,
        classSubjectId: params.classSubjectId,
        teacherId: params.teacherId,
        academicPeriodId: params.academicPeriodId,
      },
    })) as unknown as PaginatedResponse<any>;

    const normalizedPlans = (response.data ?? []).map(normalizeLessonPlan);
    const filteredPlans = applyLocalFilters(normalizedPlans, params);

    return {
      data: filteredPlans,
      meta: {
        ...response.meta,
        total: filteredPlans.length,
        totalPages: Math.max(1, Math.ceil(filteredPlans.length / (response.meta?.limit || params.limit || 20))),
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  /**
   * Buscar plano de aula por ID
   */
  async findOne(id: string): Promise<LessonPlan> {
    const response = await api.get<any>(`/lesson-plans/${id}`);
    return normalizeLessonPlan(response);
  },

  /**
   * Criar novo plano de aula
   */
  async create(data: CreateLessonPlanDto): Promise<LessonPlan> {
    const response = await api.post<any>('/lesson-plans', buildPayload(data));
    return normalizeLessonPlan(response);
  },

  /**
   * Atualizar plano de aula
   */
  async update(id: string, data: UpdateLessonPlanDto): Promise<LessonPlan> {
    const response = await api.patch<any>(`/lesson-plans/${id}`, buildPayload(data));
    return normalizeLessonPlan(response);
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
    const response = await api.post<any>(`/lesson-plans/${id}/submit`);
    return normalizeLessonPlan(response);
  },

  /**
   * Aprovar plano de aula (coordenador)
   */
  async approve(id: string): Promise<LessonPlan> {
    const response = await api.post<any>(`/lesson-plans/${id}/approve`);
    return normalizeLessonPlan(response);
  },

  /**
   * Rejeitar plano de aula (coordenador)
   */
  async reject(id: string, reason: string): Promise<LessonPlan> {
    const response = await api.post<any>(`/lesson-plans/${id}/reject`, { reason });
    return normalizeLessonPlan(response);
  },

  /**
   * Buscar planos de aula por professor
   */
  async findByTeacher(teacherId: string): Promise<LessonPlan[]> {
    const response = await this.findAll({
      teacherId,
      limit: 100,
    });
    return response.data ?? [];
  },

  /**
   * Buscar planos de aula por turma/disciplina
   */
  async findByClassSubject(classSubjectId: string): Promise<LessonPlan[]> {
    const response = await this.findAll({
      classSubjectId,
      limit: 100,
    });
    return response.data ?? [];
  },
};
