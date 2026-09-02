import {
  Subject,
  CreateSubjectDto,
  UpdateSubjectDto,
  PaginatedSubjects,
} from '@/types/subject.types';
import api from '@/lib/api';

export interface SubjectsFilterParams {
  page?: number;
  limit?: number;
  institutionId?: string;
  unitId?: string;
  search?: string;
  isActive?: boolean;
}

export const subjectsService = {
  /**
   * Listar todas as disciplinas com paginaÃ§Ã£o e filtros
   */
  async findAll(params: SubjectsFilterParams = {}): Promise<PaginatedSubjects> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    return (await api.get<PaginatedSubjects>('/subjects', {
      params: {
        page,
        limit,
        institutionId: params.institutionId,
        unitId: params.unitId,
        search: params.search?.trim() || undefined,
        isActive: params.isActive,
      },
    })) as unknown as PaginatedSubjects;
  },

  /**
   * Buscar disciplina por ID
   */
  async findOne(id: string): Promise<Subject> {
    return (await api.get<Subject>(`/subjects/${id}`)) as unknown as Subject;
  },

  /**
   * Criar nova disciplina
   */
  async create(data: CreateSubjectDto): Promise<Subject> {
    return (await api.post<Subject>('/subjects', data)) as unknown as Subject;
  },

  /**
   * Atualizar disciplina
   */
  async update(id: string, data: UpdateSubjectDto): Promise<Subject> {
    return (await api.patch<Subject>(`/subjects/${id}`, data)) as unknown as Subject;
  },

  /**
   * Remover disciplina (soft delete)
   */
  async remove(id: string): Promise<Subject> {
    return (await api.delete<Subject>(`/subjects/${id}`)) as unknown as Subject;
  },

  /**
   * Excluir disciplina permanentemente
   */
  async removePermanently(id: string): Promise<void> {
    await api.delete(`/subjects/${id}/permanent`);
  },
};
