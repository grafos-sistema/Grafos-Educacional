import {
  AcademicYear,
  AcademicYearDeleteImpact,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  PaginatedAcademicYears,
} from '@/types/academic.types';
import type { InstitutionUnit } from '@/types/institution.types';
import { supabase } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import api from '@/lib/api';

export interface AcademicYearsFilterParams {
  page?: number;
  limit?: number;
  institutionId?: string;
  unitId?: string;
  year?: number;
  isActive?: boolean;
}

type AcademicYearApiResponse = AcademicYear & {
  _count?: {
    periods?: number;
  };
};
function normalizeAcademicYear(academicYear: AcademicYearApiResponse): AcademicYear {
  return {
    ...academicYear,
    periodsCount:
      academicYear.periodsCount ??
      academicYear._count?.periods ??
      academicYear.periods?.length ??
      0,
  };
}

const DIRECTOR_UNIT_COLUMNS =
  'id, institutionId, name, code, slug, type, managerName, directorUserId, address, numero, complemento, city, state, zipCode, phone, email, isActive, createdAt, updatedAt';

async function attachUnitNames(academicYears: AcademicYear[]) {
  const unitIds = Array.from(
    new Set(
      academicYears
        .map((academicYear) => academicYear.unitId)
        .filter((unitId): unitId is string => Boolean(unitId))
    )
  );

  if (unitIds.length === 0) return academicYears;

  const { data: units, error } = await supabase
    .from('institution_units')
    .select('id, name')
    .in('id', unitIds);

  if (error) throw error;

  const unitNameMap = new Map(
    (units ?? []).map((unit) => [unit.id as string, unit.name as string])
  );

  return academicYears.map((academicYear) => ({
    ...academicYear,
    unitName: academicYear.unitId
      ? unitNameMap.get(academicYear.unitId) ?? undefined
      : undefined,
  }));
}

export const academicYearsService = {
  /**
   * Listar todos os anos letivos com paginaÃ§Ã£o e filtros
   */
  async findAll(params: AcademicYearsFilterParams = {}): Promise<PaginatedAcademicYears> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const response = (await api.get<PaginatedAcademicYears>('/academic-years', {
      params: {
        page,
        limit,
        institutionId: params.institutionId,
        unitId: params.unitId,
        year: params.year,
        isActive: params.isActive,
      },
    })) as unknown as PaginatedAcademicYears & {
      data: AcademicYearApiResponse[];
    };

    return {
      ...response,
      data: response.data.map(normalizeAcademicYear),
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
    const [academicYear] = await attachUnitNames([data as AcademicYear]);
    return academicYear;
  },

  /**
   * Lista os Anexos em que o usuário autenticado está cadastrado como Diretor.
   */
  async findManagedUnits(): Promise<InstitutionUnit[]> {
    const profile = await fetchCurrentUserProfile();
    const { data, error } = await supabase
      .from('institution_units')
      .select(DIRECTOR_UNIT_COLUMNS)
      .eq('directorUserId', profile.id)
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as InstitutionUnit[];
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
      unitId: data.unitId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('academic_years')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    const [academicYear] = await attachUnitNames([created as AcademicYear]);
    return academicYear;
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
