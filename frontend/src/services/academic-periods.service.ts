import {
  AcademicPeriod,
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  PaginatedAcademicPeriods,
} from '@/types/academic.types';
import { supabase } from '@/lib/supabase';

export interface AcademicPeriodsFilterParams {
  page?: number;
  limit?: number;
  academicYearId?: string;
  isActive?: boolean;
}

export const academicPeriodsService = {
  /**
   * Listar todos os perÃ­odos acadÃªmicos com paginaÃ§Ã£o e filtros
   */
  async findAll(params: AcademicPeriodsFilterParams = {}): Promise<PaginatedAcademicPeriods> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('academic_periods')
      .select('*', { count: 'exact' })
      .order('orderNumber', { ascending: true })
      .range(from, to);

    if (params.academicYearId) {
      query = query.eq('academicYearId', params.academicYearId);
    }

    if (typeof params.isActive === 'boolean') {
      query = query.eq('isActive', params.isActive);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: (data ?? []) as AcademicPeriod[],
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
   * Buscar perÃ­odo acadÃªmico por ID
   */
  async findOne(id: string): Promise<AcademicPeriod> {
    const { data, error } = await supabase
      .from('academic_periods')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AcademicPeriod;
  },

  /**
   * Buscar perÃ­odos de um ano letivo
   */
  async findByAcademicYear(academicYearId: string): Promise<AcademicPeriod[]> {
    const result = await academicPeriodsService.findAll({
      academicYearId,
      isActive: true,
      limit: 100,
      page: 1,
    });
    return result.data;
  },

  /**
   * Criar novo perÃ­odo acadÃªmico
   */
  async create(data: CreateAcademicPeriodDto): Promise<AcademicPeriod> {
    const now = new Date().toISOString();
    const payload: AcademicPeriod = {
      id: crypto.randomUUID(),
      name: data.name,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      orderNumber: data.orderNumber,
      isActive: data.isActive ?? true,
      academicYearId: data.academicYearId,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('academic_periods')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return created as AcademicPeriod;
  },

  /**
   * Atualizar perÃ­odo acadÃªmico
   */
  async update(id: string, data: UpdateAcademicPeriodDto): Promise<AcademicPeriod> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('academic_periods')
      .update({ ...data, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as AcademicPeriod;
  },

  /**
   * Remover perÃ­odo acadÃªmico (soft delete)
   */
  async remove(id: string): Promise<AcademicPeriod> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('academic_periods')
      .update({ isActive: false, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as AcademicPeriod;
  },
};
