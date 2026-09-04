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
    // As telas de avaliação já exibem a mensagem de falha em um toast.
    // Evita duplicar esse feedback com o modal global do interceptor da API.
    return (await api.post<Evaluation>('/evaluations', data, {
      headers: { 'x-skip-error-toast': '1' },
    })) as unknown as Evaluation;
  },

  async approve(id: string): Promise<Evaluation> {
    return (await api.patch<Evaluation>(`/evaluations/${id}/approve`, {})) as unknown as Evaluation;
  },

  async reject(id: string, reason?: string): Promise<Evaluation> {
    return (await api.patch<Evaluation>(`/evaluations/${id}/reject`, { reason })) as unknown as Evaluation;
  },

};
