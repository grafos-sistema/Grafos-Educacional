import api from '@/lib/api';

export enum ExamType {
  SAEB = 'SAEB',
  DIAGNOSTIC = 'DIAGNOSTIC',
  FORMATIVE = 'FORMATIVE',
  SUMMATIVE = 'SUMMATIVE',
  CUSTOM = 'CUSTOM',
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum AttemptStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

export interface SAEBDescriptor {
  id: string;
  code: string;
  subject: string;
  skill: string;
  description: string;
  gradeLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  orderNumber: number;
  points: number;
  examId: string;
  questionId: string;
  question?: any;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  type: ExamType;
  status: ExamStatus;
  gradeLevel?: string;
  duration?: number;
  totalPoints: number;
  passingScore?: number;
  startDate?: string;
  endDate?: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  allowReview: boolean;
  institutionId: string;
  subjectId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  subject?: any;
  createdBy?: any;
  questions?: ExamQuestion[];
  assignment?: {
    id: string;
    dueDate?: string;
  };
  attempt?: ExamAttempt;
}

export interface ExamAttempt {
  id: string;
  status: AttemptStatus;
  startTime?: string;
  endTime?: string;
  score?: number;
  percentage?: number;
  proficiency?: number;
  examId: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  exam?: Exam;
  answers?: ExamAnswer[];
}

export interface ExamAnswer {
  id: string;
  selectedOption?: number;
  isCorrect?: boolean;
  pointsEarned: number;
  answeredAt: string;
  attemptId: string;
  examQuestionId: string;
  examQuestion?: ExamQuestion;
}

export interface ExamStatistics {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  averageProficiency: number;
  distribution: number[];
}

export const examsService = {
  /**
   * Criar novo simulado
   */
  async create(data: {
    title: string;
    description?: string;
    type: ExamType;
    gradeLevel?: string;
    duration?: number;
    institutionId: string;
    subjectId?: string;
    questionIds?: string[];
  }): Promise<Exam> {
    const response = await api.post<Exam>('/exams', data);
    return response as unknown as Exam;
  },

  /**
   * Adicionar questões ao simulado
   */
  async addQuestions(
    examId: string,
    questionIds: string[],
  ): Promise<ExamQuestion[]> {
    const response = await api.post<ExamQuestion[]>(
      `/exams/${examId}/questions`,
      { questionIds },
    );
    return response as unknown as ExamQuestion[];
  },

  /**
   * Publicar simulado
   */
  async publish(examId: string): Promise<Exam> {
    const response = await api.post<Exam>(`/exams/${examId}/publish`);
    return response as unknown as Exam;
  },

  /**
   * Atribuir simulado a turma ou alunos
   */
  async assign(
    examId: string,
    data: {
      classId?: string;
      studentIds?: string[];
      dueDate?: string;
    },
  ): Promise<any> {
    const response = await api.post(`/exams/${examId}/assign`, data);
    return response;
  },

  /**
   * Listar simulados (para professores/admins)
   */
  async findAll(filters?: {
    institutionId?: string;
    createdById?: string;
    type?: ExamType;
    status?: ExamStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Exam[]; meta: any }> {
    const response = await api.get<{ data: Exam[]; meta: any }>('/exams', {
      params: filters,
    });
    return response as unknown as { data: Exam[]; meta: any };
  },

  /**
   * Listar simulados disponíveis para o aluno
   */
  async getAvailable(): Promise<Exam[]> {
    const response = await api.get<Exam[]>('/exams/available');
    return response as unknown as Exam[];
  },

  /**
   * Iniciar tentativa de simulado
   */
  async startAttempt(examId: string): Promise<ExamAttempt> {
    const response = await api.post<ExamAttempt>(`/exams/${examId}/start`);
    return response as unknown as ExamAttempt;
  },

  /**
   * Responder uma questão
   */
  async answerQuestion(
    attemptId: string,
    examQuestionId: string,
    selectedOption: number,
  ): Promise<ExamAnswer> {
    const response = await api.post<ExamAnswer>(
      `/exams/attempts/${attemptId}/answer`,
      { examQuestionId, selectedOption },
    );
    return response as unknown as ExamAnswer;
  },

  /**
   * Finalizar tentativa
   */
  async submitAttempt(attemptId: string): Promise<ExamAttempt> {
    const response = await api.post<ExamAttempt>(
      `/exams/attempts/${attemptId}/submit`,
    );
    return response as unknown as ExamAttempt;
  },

  /**
   * Obter resultado de uma tentativa
   */
  async getAttemptResult(attemptId: string): Promise<{
    attempt: ExamAttempt;
    descriptorAnalysis: Array<{
      correct: number;
      total: number;
      descriptor: SAEBDescriptor;
    }>;
  }> {
    const response = await api.get(`/exams/attempts/${attemptId}/result`);
    return response as unknown as {
      attempt: ExamAttempt;
      descriptorAnalysis: Array<{
        correct: number;
        total: number;
        descriptor: SAEBDescriptor;
      }>;
    };
  },

  /**
   * Estatísticas de um simulado
   */
  async getStatistics(examId: string): Promise<ExamStatistics> {
    const response = await api.get<ExamStatistics>(
      `/exams/${examId}/statistics`,
    );
    return response as unknown as ExamStatistics;
  },

  /**
   * Analytics avançados de um simulado
   * Análise detalhada por questão, descritor SAEB, proficiência
   */
  async getAdvancedAnalytics(examId: string): Promise<{
    totalAttempts: number;
    questionAnalytics: Array<{
      questionId: string;
      orderNumber: number;
      questionText: string;
      saebDescriptor: SAEBDescriptor | null;
      totalAnswers: number;
      correctCount: number;
      incorrectCount: number;
      successRate: number;
      difficulty: string;
      optionDistribution: Record<number, number>;
    }>;
    descriptorAnalytics: Array<{
      code: string;
      subject: string;
      skill: string;
      description: string;
      totalQuestions: number;
      totalAnswers: number;
      correctAnswers: number;
      successRate: number;
    }>;
    performanceByProficiency: Array<{
      proficiency: number;
      count: number;
      percentage: number;
    }>;
    topPerformers: Array<{
      studentId: string;
      studentName: string;
      score: number;
      percentage: number;
      proficiency: number;
    }>;
    studentsNeedingHelp: Array<{
      studentId: string;
      studentName: string;
      score: number;
      percentage: number;
      proficiency: number;
      weakDescriptors: Array<{
        code: string;
        description: string;
        successRate: number;
      }>;
    }>;
  }> {
    const response = await api.get(`/exams/${examId}/analytics`);
    return response as any;
  },

  /**
   * Relatório de desempenho personalizado de um aluno
   */
  async getStudentPerformanceReport(
    studentId: string,
    filters?: {
      subjectId?: string;
      examType?: ExamType;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    studentId: string;
    totalExams: number;
    averageScore: number;
    averagePercentage: number;
    averageProficiency: number;
    evolution: Array<{
      examId: string;
      examTitle: string;
      date: string;
      score: number;
      percentage: number;
      proficiency: number;
    }>;
    descriptorPerformance: Array<{
      code: string;
      subject: string;
      skill: string;
      description: string;
      total: number;
      correct: number;
      successRate: number;
    }>;
    strongestDescriptors: Array<any>;
    weakestDescriptors: Array<any>;
  }> {
    const response = await api.get(
      `/exams/students/${studentId}/performance`,
      { params: filters },
    );
    return response as any;
  },
};

export const saebDescriptorsService = {
  /**
   * Listar todos os descritores
   */
  async findAll(filters?: {
    subject?: string;
    gradeLevel?: string;
    skill?: string;
  }): Promise<SAEBDescriptor[]> {
    const response = await api.get<SAEBDescriptor[]>('/saeb-descriptors', {
      params: filters,
    });
    return response as unknown as SAEBDescriptor[];
  },

  /**
   * Buscar descritor por ID
   */
  async findOne(id: string): Promise<SAEBDescriptor> {
    const response = await api.get<SAEBDescriptor>(`/saeb-descriptors/${id}`);
    return response as unknown as SAEBDescriptor;
  },

  /**
   * Seed completo de descritores
   */
  async seedAll(): Promise<{
    portugues: any;
    matematica: any;
    total: number;
  }> {
    const response = await api.post('/saeb-descriptors/seed/all');
    return response as unknown as {
      portugues: any;
      matematica: any;
      total: number;
    };
  },

  /**
   * Estatísticas dos descritores
   */
  async getStatistics(): Promise<any> {
    const response = await api.get('/saeb-descriptors/statistics/overview');
    return response;
  },
};
