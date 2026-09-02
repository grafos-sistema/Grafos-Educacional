import {
  Course,
  CreateCourseDto,
  UpdateCourseDto,
  PaginatedCourses,
} from '@/types/course.types';
import { supabase } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import api from '@/lib/api';

export interface CoursesFilterParams {
  page?: number;
  limit?: number;
  institutionId?: string;
  unitId?: string;
  search?: string;
  isActive?: boolean;
}

export const coursesService = {
  /**
   * Listar todos os cursos com paginaÃ§Ã£o e filtros
   */
  async findAll(params: CoursesFilterParams = {}): Promise<PaginatedCourses> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    return (await api.get<PaginatedCourses>('/courses', {
      params: {
        page,
        limit,
        institutionId: params.institutionId,
        unitId: params.unitId,
        search: params.search?.trim() || undefined,
        isActive: params.isActive,
      },
    })) as unknown as PaginatedCourses;
  },

  /**
   * Buscar curso por ID
   */
  async findOne(id: string): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Course;
  },

  /**
   * Criar novo curso
   */
  async create(data: CreateCourseDto): Promise<Course> {
    const now = new Date().toISOString();
    const institutionId =
      data.institutionId ?? (await fetchCurrentUserProfile()).institutionId;

    const payload: Course = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      code: data.code,
      level: data.level,
      duration: data.duration,
      isActive: data.isActive ?? true,
      institutionId,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('courses')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return created as Course;
  },

  /**
   * Atualizar curso
   */
  async update(id: string, data: UpdateCourseDto): Promise<Course> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('courses')
      .update({ ...data, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as Course;
  },

  /**
   * Remover curso (soft delete)
   */
  async remove(id: string): Promise<Course> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('courses')
      .update({ isActive: false, updatedAt: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return updated as Course;
  },
};
