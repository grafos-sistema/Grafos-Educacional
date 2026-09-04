import api from '@/lib/api';
import type {
  CreateGradeCompositionDto,
  GradeComposition,
  GradeCompositionFilters,
} from '@/types/grade-composition.types';

export const gradeCompositionsService = {
  async findAll(filters: GradeCompositionFilters = {}): Promise<GradeComposition[]> {
    return (await api.get<GradeComposition[]>('/grade-compositions', {
      params: filters,
    })) as unknown as GradeComposition[];
  },

  async create(data: CreateGradeCompositionDto): Promise<GradeComposition> {
    return (await api.post<GradeComposition>('/grade-compositions', data, {
      headers: { 'x-skip-error-toast': '1' },
    })) as unknown as GradeComposition;
  },

  async approve(id: string): Promise<GradeComposition> {
    return (await api.patch<GradeComposition>(`/grade-compositions/${id}/approve`, {})) as unknown as GradeComposition;
  },

  async requestChanges(id: string, reason?: string): Promise<GradeComposition> {
    return (await api.patch<GradeComposition>(`/grade-compositions/${id}/request-changes`, {
      reason,
    })) as unknown as GradeComposition;
  },
};
