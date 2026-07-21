import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { supabase } from '@/lib/supabase';
import {
  Question,
  Worksheet,
  WorksheetQuestion,
  CreateWorksheetDto,
  UpdateWorksheetDto,
  WorksheetFilters,
} from '@/types/question-bank.types';
import { PaginatedResponse } from '@/types/common.types';

type DbActivity = {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  totalPoints?: number | null;
  headerTemplate?: string | null;
  footerTemplate?: string | null;
  showAnswerKey: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  institutionId: string;
  subjectId?: string | null;
  classId?: string | null;
  teacherId: string;
  activityDate?: string | null;
};

type DbActivityQuestion = {
  id: string;
  activityId: string;
  questionId: string;
  orderNumber: number;
  customPoints?: number | null;
  customStatement?: string | null;
  pageBreakBefore: boolean;
  createdAt: string;
  updatedAt: string;
};

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
  isPublic: boolean;
  correctAnswer?: string | null;
  createdById: string;
  institutionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type DbQuestionOption = {
  id: string;
  optionLetter?: string | null;
  text: string;
  orderNumber: number;
  questionId: string;
};

function mapActivity(activity: DbActivity, extras?: Partial<Worksheet>): Worksheet {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description ?? undefined,
    subjectId: activity.subjectId ?? undefined,
    classId: activity.classId ?? undefined,
    totalPoints: activity.totalPoints ?? 0,
    activityDate: activity.activityDate ?? undefined,
    headerTemplate: activity.headerTemplate ?? undefined,
    footerTemplate: activity.footerTemplate ?? undefined,
    authorId: activity.teacherId,
    institutionId: activity.institutionId,
    isTemplate: !activity.classId,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    ...extras,
  };
}

export const worksheetsService = {
  /**
   * Listar atividades com filtros
   */
  async findAll(filters: WorksheetFilters = {}): Promise<PaginatedResponse<Worksheet>> {
    const profile = await fetchCurrentUserProfile();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('institutionId', profile.institutionId)
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (filters.subjectId) query = query.eq('subjectId', filters.subjectId);
    if (filters.classId) query = query.eq('classId', filters.classId);
    if (filters.authorId) query = query.eq('teacherId', filters.authorId);
    if (filters.isTemplate === true) query = query.is('classId', null);
    if (filters.isTemplate === false) query = query.not('classId', 'is', null);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

    const { data: activities, error: activitiesError, count } = await query;
    if (activitiesError) throw activitiesError;

    const activityIds = (activities ?? []).map((a) => a.id);
    const { data: aqRows, error: aqError } = activityIds.length
      ? await supabase
          .from('activity_questions')
          .select('id, activityId')
          .in('activityId', activityIds)
      : { data: [], error: null };

    if (aqError) throw aqError;

    const countByActivityId = (aqRows ?? []).reduce<Record<string, number>>((acc, row) => {
      const key = row.activityId as string;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const mapped = (activities ?? []).map((row) =>
      mapActivity(row as DbActivity, { _count: { questions: countByActivityId[row.id] ?? 0 } })
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
   * Buscar atividade por ID
   */
  async findOne(id: string): Promise<Worksheet> {
    const profile = await fetchCurrentUserProfile();

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('institutionId', profile.institutionId)
      .single();

    if (activityError || !activity) throw activityError ?? new Error('Atividade não encontrada');

    const { data: activityQuestions, error: aqError } = await supabase
      .from('activity_questions')
      .select('*')
      .eq('activityId', id)
      .order('orderNumber', { ascending: true });

    if (aqError) throw aqError;

    const questionIds = (activityQuestions ?? []).map((aq) => aq.questionId);
    const { data: questions, error: questionsError } = questionIds.length
      ? await supabase.from('questions').select('*').in('id', questionIds)
      : { data: [], error: null };

    if (questionsError) throw questionsError;

    const { data: options, error: optionsError } = questionIds.length
      ? await supabase.from('question_options').select('*').in('questionId', questionIds)
      : { data: [], error: null };

    if (optionsError) throw optionsError;

    const optionsByQuestionId = (options ?? []).reduce<Record<string, DbQuestionOption[]>>((acc, option) => {
      const key = (option as DbQuestionOption).questionId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(option as DbQuestionOption);
      return acc;
    }, {});

    const questionsById = (questions ?? []).reduce<Record<string, Question>>((acc, q) => {
      const question = q as DbQuestion;
      const qOptions = (optionsByQuestionId[question.id] ?? [])
        .slice()
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.optionLetter ? opt.optionLetter === (question.correctAnswer ?? undefined) : false,
        }));

      acc[question.id] = {
        id: question.id,
        title: question.title,
        statement: question.statement,
        type: question.type,
        difficulty: question.difficulty,
        points: question.points,
        explanation: question.explanation ?? undefined,
        tags: question.tags ?? undefined,
        categoryId: question.categoryId ?? undefined,
        subjectId: question.subjectId ?? undefined,
        authorId: question.createdById,
        institutionId: question.institutionId ?? profile.institutionId,
        isPublic: question.isPublic,
        options: qOptions,
        correctAnswer: question.correctAnswer ?? undefined,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      };
      return acc;
    }, {});

    const worksheetQuestions: WorksheetQuestion[] = (activityQuestions ?? []).map((aq) => ({
      questionId: aq.questionId as string,
      orderNumber: aq.orderNumber as number,
      customPoints: aq.customPoints ?? undefined,
      question: questionsById[aq.questionId as string],
    }));

    return mapActivity(activity as DbActivity, {
      questions: worksheetQuestions,
      _count: { questions: worksheetQuestions.length },
    });
  },

  /**
   * Criar nova atividade
   */
  async create(data: CreateWorksheetDto): Promise<Worksheet> {
    const profile = await fetchCurrentUserProfile();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const teacherId = profile.teacherProfile?.id ?? profile.id;

    const payload: DbActivity = {
      id,
      title: data.title,
      description: data.description ?? null,
      instructions: null,
      totalPoints: null,
      headerTemplate: data.headerText ?? null,
      footerTemplate: data.footerText ?? null,
      showAnswerKey: false,
      isPublished: false,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      institutionId: profile.institutionId,
      subjectId: data.subjectId ?? null,
      classId: data.classId ?? null,
      teacherId,
      activityDate: data.activityDate ?? null,
    };

    const { data: created, error } = await supabase
      .from('activities')
      .insert(payload)
      .select('*')
      .single();

    if (error || !created) throw error ?? new Error('Falha ao criar atividade');
    return mapActivity(created as DbActivity);
  },

  /**
   * Atualizar atividade
   */
  async update(id: string, data: UpdateWorksheetDto): Promise<Worksheet> {
    const profile = await fetchCurrentUserProfile();

    const payload = {
      title: data.title,
      description: data.description,
      subjectId: data.subjectId,
      classId: data.classId,
      activityDate: data.activityDate,
      headerTemplate: data.headerText,
      footerTemplate: data.footerText,
      updatedAt: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('activities')
      .update(payload)
      .eq('id', id)
      .eq('institutionId', profile.institutionId)
      .select('*')
      .single();

    if (error || !updated) throw error ?? new Error('Falha ao atualizar atividade');
    return mapActivity(updated as DbActivity);
  },

  /**
   * Remover atividade
   */
  async remove(id: string): Promise<void> {
    const profile = await fetchCurrentUserProfile();
    await supabase.from('activity_questions').delete().eq('activityId', id);

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      .eq('institutionId', profile.institutionId);

    if (error) throw error;
  },

  /**
   * Buscar atividades do professor
   */
  async findByTeacher(teacherId: string): Promise<Worksheet[]> {
    const profile = await fetchCurrentUserProfile();

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('institutionId', profile.institutionId)
      .eq('teacherId', teacherId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => mapActivity(row as DbActivity));
  },

  /**
   * Gerar PDF da atividade
   */
  async generatePdf(_id: string): Promise<Blob> {
    throw new Error(`Geração de PDF ainda não foi migrada (${_id})`);
  },

  /**
   * Duplicar atividade
   */
  async duplicate(id: string): Promise<Worksheet> {
    const profile = await fetchCurrentUserProfile();
    const now = new Date().toISOString();

    const original = await this.findOne(id);
    const newId = crypto.randomUUID();

    const { data: created, error: createError } = await supabase
      .from('activities')
      .insert({
        id: newId,
        title: `${original.title} (Cópia)`,
        description: original.description ?? null,
        instructions: null,
        totalPoints: original.totalPoints ?? null,
        headerTemplate: original.headerTemplate ?? null,
        footerTemplate: original.footerTemplate ?? null,
        showAnswerKey: false,
        isPublished: false,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
        institutionId: profile.institutionId,
        subjectId: original.subjectId ?? null,
        classId: original.classId ?? null,
        teacherId: original.authorId,
        activityDate: original.activityDate ?? null,
      })
      .select('*')
      .single();

    if (createError || !created) throw createError ?? new Error('Falha ao duplicar atividade');

    const originalQuestions = original.questions ?? [];
    if (originalQuestions.length) {
      const rows = originalQuestions.map((q, index) => ({
        id: crypto.randomUUID(),
        activityId: newId,
        questionId: q.questionId,
        orderNumber: q.orderNumber ?? index + 1,
        customPoints: q.customPoints ?? null,
        customStatement: null,
        pageBreakBefore: false,
        createdAt: now,
        updatedAt: now,
      }));

      const { error: insertError } = await supabase.from('activity_questions').insert(rows);
      if (insertError) throw insertError;
    }

    return this.findOne(newId);
  },

  /**
   * Adicionar questão à atividade
   */
  async addQuestion(
    activityId: string,
    data: { questionId: string; orderNumber?: number; points?: number }
  ): Promise<void> {
    const profile = await fetchCurrentUserProfile();
    const now = new Date().toISOString();

    const { error } = await supabase.from('activity_questions').insert({
      id: crypto.randomUUID(),
      activityId,
      questionId: data.questionId,
      orderNumber: data.orderNumber ?? 1,
      customPoints: data.points ?? null,
      customStatement: null,
      pageBreakBefore: false,
      createdAt: now,
      updatedAt: now,
    } as unknown as DbActivityQuestion);

    if (error) throw error;

    await supabase.from('activities').update({ updatedAt: now }).eq('id', activityId).eq('institutionId', profile.institutionId);
  },

  /**
   * Remover questão da atividade
   */
  async removeQuestion(activityId: string, questionId: string): Promise<void> {
    const profile = await fetchCurrentUserProfile();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('activity_questions')
      .delete()
      .eq('activityId', activityId)
      .eq('questionId', questionId);

    if (error) throw error;

    await supabase.from('activities').update({ updatedAt: now }).eq('id', activityId).eq('institutionId', profile.institutionId);
  },

  /**
   * Atualizar questão da atividade (ordem ou pontos)
   */
  async updateQuestion(
    activityId: string,
    questionId: string,
    data: { orderNumber?: number; points?: number }
  ): Promise<void> {
    const profile = await fetchCurrentUserProfile();
    const now = new Date().toISOString();

    const payload = {
      orderNumber: data.orderNumber,
      customPoints: data.points,
      updatedAt: now,
    };

    const { error } = await supabase
      .from('activity_questions')
      .update(payload)
      .eq('activityId', activityId)
      .eq('questionId', questionId);

    if (error) throw error;

    await supabase.from('activities').update({ updatedAt: now }).eq('id', activityId).eq('institutionId', profile.institutionId);
  },
};
