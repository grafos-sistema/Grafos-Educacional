import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { supabase } from '@/lib/supabase';
import {
  Question,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilters,
} from '@/types/question-bank.types';
import { PaginatedResponse } from '@/types/common.types';

type DbQuestion = {
  id: string;
  title: string;
  statement: string;
  type: Question['type'];
  difficulty: Question['difficulty'];
  points: number;
  explanation?: string | null;
  tags?: string[] | null;
  categoryId?: string | null;
  subjectId?: string | null;
  institutionId?: string | null;
  createdById: string;
  isPublic: boolean;
  isActive: boolean;
  timesUsed: number;
  correctAnswer?: string | null;
  answerKey?: string | null;
  images?: string | null;
  createdAt: string;
  updatedAt: string;
  saebDescriptorId?: string | null;
};

type DbQuestionOption = {
  id: string;
  optionLetter?: string | null;
  text: string;
  image?: string | null;
  orderNumber: number;
  questionId: string;
};

function mapQuestion(row: DbQuestion, options: DbQuestionOption[] = [], defaultInstitutionId?: string): Question {
  return {
    id: row.id,
    title: row.title,
    statement: row.statement,
    type: row.type,
    difficulty: row.difficulty,
    points: row.points,
    explanation: row.explanation ?? undefined,
    tags: row.tags ?? undefined,
    categoryId: row.categoryId ?? undefined,
    subjectId: row.subjectId ?? undefined,
    authorId: row.createdById,
    institutionId: row.institutionId ?? defaultInstitutionId ?? '',
    isPublic: row.isPublic,
    options: options.length
      ? options
          .sort((a, b) => a.orderNumber - b.orderNumber)
          .map((opt) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.optionLetter ? opt.optionLetter === (row.correctAnswer ?? undefined) : false,
          }))
      : undefined,
    correctAnswer: row.correctAnswer ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const questionsService = {
  /**
   * Listar questÃµes com filtros
   */
  async findAll(filters: QuestionFilters = {}): Promise<PaginatedResponse<Question>> {
    const profile = await fetchCurrentUserProfile();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('questions')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.categoryId) query = query.eq('categoryId', filters.categoryId);
    if (filters.subjectId) query = query.eq('subjectId', filters.subjectId);
    if (filters.authorId) query = query.eq('createdById', filters.authorId);
    if (filters.isPublic !== undefined) query = query.eq('isPublic', filters.isPublic);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,statement.ilike.%${filters.search}%`);
    if (filters.tags) {
      const tagList = filters.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length) {
        query = query.contains('tags', tagList);
      }
    }

    const { data: questions, error: questionsError, count } = await query;
    if (questionsError) throw questionsError;

    const questionIds = (questions ?? []).map((q) => q.id);
    const { data: options, error: optionsError } = questionIds.length
      ? await supabase.from('question_options').select('*').in('questionId', questionIds)
      : { data: [], error: null };

    if (optionsError) throw optionsError;

    const optionsByQuestionId = (options ?? []).reduce<Record<string, DbQuestionOption[]>>((acc, option) => {
      const key = option.questionId as string;
      if (!acc[key]) acc[key] = [];
      acc[key].push(option as DbQuestionOption);
      return acc;
    }, {});

    const mapped = (questions ?? []).map((row) =>
      mapQuestion(row as DbQuestion, optionsByQuestionId[row.id] ?? [], profile.institutionId)
    );

    const total = count ?? mapped.length;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: mapped,
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
   * Buscar questÃ£o por ID
   */
  async findOne(id: string): Promise<Question> {
    const profile = await fetchCurrentUserProfile();

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (questionError || !question) {
      throw questionError ?? new Error('Questão não encontrada');
    }

    const { data: options, error: optionsError } = await supabase
      .from('question_options')
      .select('*')
      .eq('questionId', id);

    if (optionsError) throw optionsError;

    return mapQuestion(question as DbQuestion, (options ?? []) as DbQuestionOption[], profile.institutionId);
  },

  /**
   * Criar nova questÃ£o (apenas SUPER_ADMIN)
   */
  async create(data: CreateQuestionDto): Promise<Question> {
    const profile = await fetchCurrentUserProfile();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const payload = {
      id,
      title: data.title,
      statement: data.statement,
      type: data.type,
      difficulty: data.difficulty,
      points: data.points,
      explanation: data.explanation ?? null,
      tags: data.tags ?? null,
      categoryId: data.categoryId ?? null,
      subjectId: data.subjectId ?? null,
      institutionId: profile.institutionId,
      createdById: profile.id,
      isPublic: data.isPublic ?? false,
      isActive: true,
      timesUsed: 0,
      correctAnswer: data.correctAnswer ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error: createdError } = await supabase
      .from('questions')
      .insert(payload)
      .select('*')
      .single();

    if (createdError || !created) {
      throw createdError ?? new Error('Falha ao criar questão');
    }

    if (data.options?.length) {
      const optionsPayload = data.options.map((opt, index) => ({
        id: crypto.randomUUID(),
        optionLetter: String.fromCharCode(65 + index),
        text: opt.text,
        orderNumber: index + 1,
        questionId: id,
        createdAt: now,
        updatedAt: now,
      }));

      const { error: optionsInsertError } = await supabase.from('question_options').insert(optionsPayload);
      if (optionsInsertError) throw optionsInsertError;
    }

    return this.findOne(id);
  },

  /**
   * Atualizar questÃ£o (apenas SUPER_ADMIN)
   */
  async update(id: string, data: UpdateQuestionDto): Promise<Question> {
    const profile = await fetchCurrentUserProfile();

    const payload = {
      title: data.title,
      statement: data.statement,
      type: data.type,
      difficulty: data.difficulty,
      points: data.points,
      explanation: data.explanation,
      tags: data.tags,
      categoryId: data.categoryId,
      subjectId: data.subjectId,
      isPublic: data.isPublic,
      correctAnswer: data.correctAnswer,
      updatedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('questions')
      .update(payload)
      .eq('id', id)
      .eq('institutionId', profile.institutionId);

    if (updateError) throw updateError;

    if (data.options) {
      const { error: deleteError } = await supabase.from('question_options').delete().eq('questionId', id);
      if (deleteError) throw deleteError;

      const now = new Date().toISOString();
      const optionsPayload = data.options.map((opt, index) => ({
        id: crypto.randomUUID(),
        optionLetter: String.fromCharCode(65 + index),
        text: opt.text,
        orderNumber: index + 1,
        questionId: id,
        createdAt: now,
        updatedAt: now,
      }));

      if (optionsPayload.length) {
        const { error: insertError } = await supabase.from('question_options').insert(optionsPayload);
        if (insertError) throw insertError;
      }
    }

    return this.findOne(id);
  },

  /**
   * Remover questÃ£o (apenas SUPER_ADMIN)
   */
  async remove(id: string): Promise<void> {
    const profile = await fetchCurrentUserProfile();
    await supabase.from('question_options').delete().eq('questionId', id);

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)
      .eq('institutionId', profile.institutionId);

    if (error) throw error;
  },

  /**
   * Buscar questões públicas (para professores)
   * O backend já filtra apenas questões públicas para professores automaticamente
   */
  async findPublic(filters: QuestionFilters = {}): Promise<PaginatedResponse<Question>> {
    return this.findAll({ ...filters, isPublic: true });
  },

  /**
   * Buscar por tags
   */
  async findByTags(tags: string[]): Promise<Question[]> {
    const profile = await fetchCurrentUserProfile();

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .contains('tags', tags)
      .eq('institutionId', profile.institutionId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => mapQuestion(row as DbQuestion, [], profile.institutionId));
  },
};
