import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { supabase } from '@/lib/supabase';
import {
  QuestionCategory,
  CreateQuestionCategoryDto,
  UpdateQuestionCategoryDto,
} from '@/types/question-bank.types';
import { PaginatedResponse } from '@/types/common.types';

export const questionCategoriesService = {
  /**
   * Listar categorias
   */
  async findAll(params: { subjectId?: string; limit?: number } = {}): Promise<PaginatedResponse<QuestionCategory>> {
    const profile = await fetchCurrentUserProfile();
    const limit = params.limit ?? 100;

    let query = supabase
      .from('question_categories')
      .select('*', { count: 'exact' })
      .eq('institutionId', profile.institutionId)
      .order('name', { ascending: true })
      .range(0, Math.max(0, limit - 1));

    if (params.subjectId) {
      query = query.eq('subjectId', params.subjectId);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? (data?.length ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: (data ?? []) as QuestionCategory[],
      meta: {
        total,
        page: 1,
        limit,
        totalPages,
        hasNextPage: total > limit,
        hasPreviousPage: false,
      },
    };
  },

  /**
   * Buscar categoria por ID
   */
  async findOne(id: string): Promise<QuestionCategory> {
    const profile = await fetchCurrentUserProfile();

    const { data, error } = await supabase
      .from('question_categories')
      .select('*')
      .eq('id', id)
      .eq('institutionId', profile.institutionId)
      .single();

    if (error || !data) throw error ?? new Error('Categoria não encontrada');
    return data as QuestionCategory;
  },

  /**
   * Criar nova categoria
   */
  async create(data: CreateQuestionCategoryDto): Promise<QuestionCategory> {
    const profile = await fetchCurrentUserProfile();

    const payload = {
      id: crypto.randomUUID(),
      institutionId: profile.institutionId,
      name: data.name,
      description: data.description ?? null,
      subjectId: data.subjectId ?? null,
      color: data.color ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from('question_categories')
      .insert(payload)
      .select('*')
      .single();

    if (error || !created) throw error ?? new Error('Falha ao criar categoria');
    return created as QuestionCategory;
  },

  /**
   * Atualizar categoria
   */
  async update(id: string, data: UpdateQuestionCategoryDto): Promise<QuestionCategory> {
    const profile = await fetchCurrentUserProfile();

    const payload = {
      name: data.name,
      description: data.description,
      subjectId: data.subjectId,
      color: data.color,
      updatedAt: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('question_categories')
      .update(payload)
      .eq('id', id)
      .eq('institutionId', profile.institutionId)
      .select('*')
      .single();

    if (error || !updated) throw error ?? new Error('Falha ao atualizar categoria');
    return updated as QuestionCategory;
  },

  /**
   * Remover categoria
   */
  async remove(id: string): Promise<void> {
    const profile = await fetchCurrentUserProfile();

    const { error } = await supabase
      .from('question_categories')
      .delete()
      .eq('id', id)
      .eq('institutionId', profile.institutionId);

    if (error) throw error;
  },
};
