import api from '@/lib/api';
import {
  LessonContent,
  CreateLessonContentDto,
  UpdateLessonContentDto,
} from '@/types/lesson.types';
import { PaginatedResponse } from '@/types/common.types';

export interface LessonContentsFilterParams {
  page?: number;
  limit?: number;
  classSubjectId?: string;
  teacherId?: string;
  startDate?: string;
  endDate?: string;
}

export const lessonContentsService = {
  /**
   * Listar conteÃºdos de aula com filtros
   */
  async findAll(
    params: LessonContentsFilterParams = {}
  ): Promise<PaginatedResponse<LessonContent>> {
    const response = await api.get<PaginatedResponse<LessonContent>>('/lesson-contents', {
      params,
    });
    return response as unknown as PaginatedResponse<LessonContent>;
  },

  /**
   * Buscar conteÃºdo de aula por ID
   */
  async findOne(id: string): Promise<LessonContent> {
    const response = await api.get<LessonContent>(`/lesson-contents/${id}`);
    return response as unknown as LessonContent;
  },

  /**
   * Criar novo conteÃºdo de aula
   */
  async create(data: CreateLessonContentDto): Promise<LessonContent> {
    const response = await api.post<LessonContent>('/lesson-contents', data);
    return response as unknown as LessonContent;
  },

  /**
   * Atualizar conteÃºdo de aula
   */
  async update(id: string, data: UpdateLessonContentDto): Promise<LessonContent> {
    const response = await api.patch<LessonContent>(`/lesson-contents/${id}`, data);
    return response as unknown as LessonContent;
  },

  /**
   * Remover conteÃºdo de aula
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/lesson-contents/${id}`);
  },

  /**
   * Buscar conteÃºdos de aula por professor
   */
  async findByTeacher(teacherId: string): Promise<LessonContent[]> {
    const response = await api.get<LessonContent[]>(`/lesson-contents/teacher/${teacherId}`);
    return response as unknown as LessonContent[];
  },

  /**
   * Buscar conteÃºdos de aula por turma/disciplina
   */
  async findByClassSubject(classSubjectId: string): Promise<LessonContent[]> {
    const response = await api.get<LessonContent[]>(
      `/lesson-contents/class-subject/${classSubjectId}`
    );
    return response as unknown as LessonContent[];
  },
};
