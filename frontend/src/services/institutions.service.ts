import { supabase } from '@/lib/supabase';
import {
  Institution,
  CreateInstitutionDto,
  CreateInstitutionUnitDto,
  UpdateInstitutionDto,
  InstitutionFilterParams,
} from '@/types/institution.types';
import { PaginatedResponse } from '@/types/common.types';
import { BASE_SUBJECT_CATALOG } from '@/lib/constants/base-subjects';

export interface PublicInstitution {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
}

const INSTITUTION_COLUMNS =
  'id, name, slug, cnpj, email, phone, website, address, numero, complemento, city, state, country, zipCode, logo, isActive, createdAt, updatedAt';
const INSTITUTION_UNIT_COLUMNS =
  'id, institutionId, name, code, slug, type, managerName, directorUserId, address, numero, complemento, city, state, zipCode, phone, email, isActive, createdAt, updatedAt';

function normalizeDigits(value?: string) {
  return value?.replace(/\D/g, '') || undefined;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeInstitutionPayload(data: CreateInstitutionDto | UpdateInstitutionDto) {
  const { units = [], ...institution } = data;
  const primaryUnit = units[0];

  return {
    institution: {
      ...institution,
      cnpj: normalizeDigits(institution.cnpj),
      phone: normalizeDigits(institution.phone),
      zipCode: normalizeDigits(primaryUnit?.zipCode ?? institution.zipCode),
      website: normalizeText(institution.website),
      address: normalizeText(primaryUnit?.address ?? institution.address),
      numero: normalizeText(primaryUnit?.numero ?? institution.numero),
      complemento: normalizeText(primaryUnit?.complemento ?? institution.complemento),
      city: normalizeText(primaryUnit?.city ?? institution.city),
      state: normalizeText(primaryUnit?.state ?? institution.state),
      email: normalizeText(institution.email),
    },
    units: units
      .map(
        (
          unit
        ): Partial<CreateInstitutionUnitDto> & { id: string; isActive: boolean } => ({
          id: unit.id || crypto.randomUUID(),
          name: normalizeText(unit.name),
          code: normalizeText(unit.code),
          slug: normalizeText(unit.slug),
          type: normalizeText(unit.type),
          managerName: normalizeText(unit.managerName),
          directorUserId: normalizeText(unit.directorUserId),
          address: normalizeText(unit.address),
          numero: normalizeText(unit.numero),
          complemento: normalizeText(unit.complemento),
          city: normalizeText(unit.city),
          state: normalizeText(unit.state),
          zipCode: normalizeDigits(unit.zipCode),
          phone: normalizeDigits(unit.phone),
          email: normalizeText(unit.email),
          isActive: unit.isActive ?? true,
        })
      )
      .filter(
        (
          unit
        ): unit is CreateInstitutionUnitDto & { id: string; isActive: boolean } =>
          typeof unit.name === 'string' && unit.name.length > 0
      ),
  };
}

async function fetchInstitutionUnits(institutionId: string) {
  const { data, error } = await supabase
    .from('institution_units')
    .select(INSTITUTION_UNIT_COLUMNS)
    .eq('institutionId', institutionId)
    .order('createdAt', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function fetchUnitsByInstitutionIds(institutionIds: string[]) {
  if (institutionIds.length === 0) {
    return new Map<string, Institution['units']>();
  }

  const { data, error } = await supabase
    .from('institution_units')
    .select(INSTITUTION_UNIT_COLUMNS)
    .in('institutionId', institutionIds)
    .order('createdAt', { ascending: true });

  if (error) throw error;

  const grouped = new Map<string, Institution['units']>();

  for (const unit of (data ?? []) as NonNullable<Institution['units']>) {
    const currentUnits = grouped.get(unit.institutionId) ?? [];
    currentUnits.push(unit);
    grouped.set(unit.institutionId, currentUnits);
  }

  return grouped;
}

async function fetchInstitutionWithUnits(id: string): Promise<Institution> {
  const { data, error } = await supabase
    .from('institutions')
    .select(INSTITUTION_COLUMNS)
    .eq('id', id)
    .single();

  if (error) throw error;

  const units = await fetchInstitutionUnits(id);

  return {
    ...(data as Institution),
    units,
  };
}

async function ensureBaseSubjects(institutionId: string) {
  const { data: existingSubjects, error: existingSubjectsError } = await supabase
    .from('subjects')
    .select('name')
    .eq('institutionId', institutionId);

  if (existingSubjectsError) throw existingSubjectsError;

  const existingNames = new Set(
    (existingSubjects ?? [])
      .map((subject) => subject.name?.trim().toLocaleLowerCase('pt-BR'))
      .filter(Boolean)
  );
  const now = new Date().toISOString();
  const missingSubjects = BASE_SUBJECT_CATALOG.filter(
    (subject) => !existingNames.has(subject.name.toLocaleLowerCase('pt-BR'))
  ).map((subject) => ({
    id: crypto.randomUUID(),
    name: subject.name,
    code: subject.code,
    description: subject.description,
    isActive: true,
    institutionId,
    createdAt: now,
    updatedAt: now,
  }));

  if (missingSubjects.length === 0) return;

  const { error } = await supabase.from('subjects').insert(missingSubjects);
  if (error) throw error;
}

export const institutionsService = {
  /**
   * Get all active institutions (public endpoint)
   */
  async getPublicInstitutions(): Promise<PublicInstitution[]> {
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name, slug, city, state')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching public institutions:', error);
      throw error;
    }

    return data as PublicInstitution[];
  },

  /**
   * Find all institutions (Admin/Super Admin) with pagination and filters
   */
  async findAll(params: InstitutionFilterParams = {}): Promise<PaginatedResponse<Institution>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('institutions')
      .select(INSTITUTION_COLUMNS, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (params.search) {
      const sanitized = params.search.replace(/,/g, ' ').trim();
      query = query.or(`name.ilike.%${sanitized}%,slug.ilike.%${sanitized}%,city.ilike.%${sanitized}%`);
    }

    if (typeof params.isActive === 'boolean') {
      query = query.eq('isActive', params.isActive);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const institutions = (data ?? []) as Institution[];
    const unitsByInstitutionId = await fetchUnitsByInstitutionIds(
      institutions.map((institution) => institution.id)
    );
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: institutions.map((institution) => ({
        ...institution,
        units: unitsByInstitutionId.get(institution.id) ?? [],
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
   * Find a single institution by ID
   */
  async findOne(id: string): Promise<Institution> {
    return fetchInstitutionWithUnits(id);
  },

  /**
   * Create a new institution
   */
  async create(data: CreateInstitutionDto): Promise<Institution> {
    const { institution, units } = normalizeInstitutionPayload(data);

    const { data: created, error } = await supabase
      .from('institutions')
      .insert({
        ...institution,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    if (units.length > 0) {
      const { error: unitsError } = await supabase.from('institution_units').insert(
        units.map((unit) => ({
          ...unit,
          institutionId: created.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );

      if (unitsError) throw unitsError;
    }

    // New institutions start with the standard curriculum catalog. The
    // operation is idempotent so a retry after a partial save does not create
    // duplicate disciplines.
    await ensureBaseSubjects(created.id);

    return fetchInstitutionWithUnits(created.id);
  },

  /**
   * Update an existing institution
   */
  async update(id: string, data: UpdateInstitutionDto): Promise<Institution> {
    const { institution, units } = normalizeInstitutionPayload(data);

    const { error } = await supabase
      .from('institutions')
      .update({
        ...institution,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    if (Array.isArray(data.units)) {
      const { error: deleteUnitsError } = await supabase
        .from('institution_units')
        .delete()
        .eq('institutionId', id);

      if (deleteUnitsError) throw deleteUnitsError;

      if (units.length > 0) {
        const { error: insertUnitsError } = await supabase.from('institution_units').insert(
          units.map((unit) => ({
            ...unit,
            institutionId: id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );

        if (insertUnitsError) throw insertUnitsError;
      }
    }

    return fetchInstitutionWithUnits(id);
  },

  /**
   * Soft delete (deactivate) an institution
   */
  async remove(id: string): Promise<Institution> {
    const { data: removed, error } = await supabase
      .from('institutions')
      .update({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select(INSTITUTION_COLUMNS)
      .single();

    if (error) throw error;
    return removed as Institution;
  },
};
