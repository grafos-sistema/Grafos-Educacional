import {
  AcademicYear,
  AcademicYearDeleteImpact,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  PaginatedAcademicYears,
} from '@/types/academic.types';
import { supabase } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import api from '@/lib/api';

export interface AcademicYearsFilterParams {
  page?: number;
  limit?: number;
  institutionId?: string;
  year?: number;
  isActive?: boolean;
}

export const academicYearsService = {
  /**
   * Listar todos os anos letivos com paginaÃ§Ã£o e filtros
   */
  async findAll(params: AcademicYearsFilterParams = {}): Promise<PaginatedAcademicYears> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const institutionId =
      params.institutionId ?? (await fetchCurrentUserProfile()).institutionId;

    let query = supabase
      .from('academic_years')
      .select('*', { count: 'exact' })
      .eq('institutionId', institutionId)
      .order('year', { ascending: false })
      .range(from, to);

    if (typeof params.isActive === 'boolean') {
      query = query.eq('isActive', params.isActive);
    }

    if (typeof params.year === 'number') {
      query = query.eq('year', params.year);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const academicYears = (data ?? []) as AcademicYear[];
    const academicYearIds = academicYears.map((academicYear) => academicYear.id);
    const periodsCountMap = new Map<string, number>();

    if (academicYearIds.length > 0) {
      const { data: periods, error: periodsError } = await supabase
        .from('academic_periods')
        .select('academicYearId')
        .in('academicYearId', academicYearIds)
        .eq('isActive', true);

      if (periodsError) throw periodsError;

      for (const period of periods ?? []) {
        const academicYearId = period.academicYearId as string;
        periodsCountMap.set(academicYearId, (periodsCountMap.get(academicYearId) ?? 0) + 1);
      }
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: academicYears.map((academicYear) => ({
        ...academicYear,
        periodsCount: periodsCountMap.get(academicYear.id) ?? 0,
      })),
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
   * Buscar ano letivo por ID
   */
  async findOne(id: string): Promise<AcademicYear> {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AcademicYear;
  },

  /**
   * Buscar ano letivo ativo
   */
  async findActive(institutionId: string): Promise<AcademicYear> {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('institutionId', institutionId)
      .eq('isActive', true)
      .order('year', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Nenhum ano letivo ativo encontrado');
    }
    return data as AcademicYear;
  },

  /**
   * Criar novo ano letivo
   */
  async create(data: CreateAcademicYearDto): Promise<AcademicYear> {
    const now = new Date().toISOString();
    const institutionId =
      data.institutionId ?? (await fetchCurrentUserProfile()).institutionId;

    const payload: AcademicYear = {
      id: crypto.randomUUID(),
      year: data.year,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? true,
      institutionId,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('academic_years')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return created as AcademicYear;
  },

  /**
   * Atualizar ano letivo
   */
  async update(id: string, data: UpdateAcademicYearDto): Promise<AcademicYear> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('academic_years')
      .update({ ...data, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as AcademicYear;
  },

  /**
   * Remover ano letivo (soft delete)
   */
  async remove(id: string): Promise<AcademicYear> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('academic_years')
      .update({ isActive: false, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as AcademicYear;
  },

  /**
   * Buscar impacto da exclusão permanente
   */
  async getDeleteImpact(id: string): Promise<AcademicYearDeleteImpact> {
    return api.get(`/academic-years/${id}/delete-impact`);
  },

  /**
   * Excluir ano letivo permanentemente
   */
  async removePermanently(id: string): Promise<void> {
    await api.delete(`/academic-years/${id}/permanent`);
  },
};
