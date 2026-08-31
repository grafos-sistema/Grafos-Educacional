import api from '@/lib/api';
import type {
  CreateEvaluationDto,
  Evaluation,
  EvaluationStatus,
  AssessmentSlot,
} from '@/types/evaluation.types';

export const evaluationsService = {
  async findAll(params: {
    classSubjectId?: string;
    academicPeriodId?: string;
    status?: EvaluationStatus;
    slot?: AssessmentSlot;
  } = {}): Promise<Evaluation[]> {
    return (await api.get<Evaluation[]>('/evaluations', { params })) as unknown as Evaluation[];
  },

  async create(data: CreateEvaluationDto): Promise<Evaluation> {
    return (await api.post<Evaluation>('/evaluations', data)) as unknown as Evaluation;
  },

  async approve(id: string): Promise<Evaluation> {
    return (await api.patch<Evaluation>(`/evaluations/${id}/approve`, {})) as unknown as Evaluation;
  },

  async reject(id: string, reason?: string): Promise<Evaluation> {
    return (await api.patch<Evaluation>(`/evaluations/${id}/reject`, { reason })) as unknown as Evaluation;
  },
};
