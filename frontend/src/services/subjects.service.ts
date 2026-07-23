import {
  Subject,
  CreateSubjectDto,
  UpdateSubjectDto,
  PaginatedSubjects,
} from '@/types/subject.types';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';

export interface SubjectsFilterParams {
  page?: number;
  limit?: number;
  institutionId?: string;
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
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const institutionId =
      params.institutionId ?? (await fetchCurrentUserProfile()).institutionId;

    let query = supabase
      .from('subjects')
      .select('*', { count: 'exact' })
      .eq('institutionId', institutionId)
      .order('name', { ascending: true })
      .range(from, to);

    if (typeof params.isActive === 'boolean') {
      query = query.eq('isActive', params.isActive);
    }

    if (params.search && params.search.trim().length > 0) {
      const term = params.search.trim();
      query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: (data ?? []) as Subject[],
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  /**
   * Buscar disciplina por ID
   */
  async findOne(id: string): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Subject;
  },

  /**
   * Criar nova disciplina
   */
  async create(data: CreateSubjectDto): Promise<Subject> {
    const now = new Date().toISOString();
    const institutionId = data.institutionId ?? (await fetchCurrentUserProfile()).institutionId;

    const payload: Subject = {
      id: crypto.randomUUID(),
      name: data.name,
      code: data.code,
      description: data.description,
      color: data.color,
      isActive: data.isActive ?? true,
      institutionId,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('subjects')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return created as Subject;
  },

  /**
   * Atualizar disciplina
   */
  async update(id: string, data: UpdateSubjectDto): Promise<Subject> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('subjects')
      .update({ ...data, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as Subject;
  },

  /**
   * Remover disciplina (soft delete)
   */
  async remove(id: string): Promise<Subject> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('subjects')
      .update({ isActive: false, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as Subject;
  },

  /**
   * Excluir disciplina permanentemente
   */
  async removePermanently(id: string): Promise<void> {
    await api.delete(`/subjects/${id}/permanent`);
  },
};
