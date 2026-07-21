import api from '@/lib/api';
import { getApiBaseUrl, getApiConfigurationMessage } from '@/lib/api-url';
import { supabase } from '@/lib/supabase';
import {
  Institution,
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionFilterParams,
} from '@/types/institution.types';
import { PaginatedResponse } from '@/types/common.types';

export interface PublicInstitution {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
}

const INSTITUTION_COLUMNS = 'id, name, slug, city, state, isActive, createdAt, updatedAt';

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

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: (data ?? []) as Institution[],
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
    const { data, error } = await supabase
      .from('institutions')
      .select(INSTITUTION_COLUMNS)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Institution;
  },

  /**
   * Create a new institution
   */
  async create(data: CreateInstitutionDto): Promise<Institution> {
    const { data: created, error } = await supabase
      .from('institutions')
      .insert({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select(INSTITUTION_COLUMNS)
      .single();

    if (error) throw error;
    return created as Institution;
  },

  /**
   * Update an existing institution
   */
  async update(id: string, data: UpdateInstitutionDto): Promise<Institution> {
    const { data: updated, error } = await supabase
      .from('institutions')
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select(INSTITUTION_COLUMNS)
      .single();

    if (error) throw error;
    return updated as Institution;
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
