import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamType, ExamStatus, AttemptStatus } from '@prisma/client';
import { RankingsService } from '../rankings/rankings.service';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rankingsService: RankingsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  /**
   * Criar um novo simulado/exame
   */
  async create(data: {
    title: string;
    description?: string;
    type: ExamType;
    gradeLevel?: string;
    duration?: number;
    institutionId: string;
    subjectId?: string;
    createdById: string;
    questionIds?: string[];
  }) {
    const exam = await this.prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        gradeLevel: data.gradeLevel,
        duration: data.duration,
        institutionId: data.institutionId,
        subjectId: data.subjectId,
        createdById: data.createdById,
        status: ExamStatus.DRAFT,
      },
      include: {
        subject: true,
        createdBy: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Adicionar questões se fornecidas
    if (data.questionIds && data.questionIds.length > 0) {
      await this.addQuestions(exam.id, data.questionIds);
    }

    return exam;
  }

  /**
   * Adicionar questões a um simulado
   */
  async addQuestions(examId: string, questionIds: string[]) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Simulado não encontrado');
    }

    // Buscar questões
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
    });

    if (questions.length !== questionIds.length) {
      throw new BadRequestException('Algumas questões não foram encontradas');
    }

    // Criar ExamQuestions
    const examQuestions = await Promise.all(
      questions.map((question, index) =>
        this.prisma.examQuestion.create({
          data: {
            examId,
            questionId: question.id,
            orderNumber: index + 1,
            points: 1.0, // Padrão 1 ponto por questão
          },
        }),
      ),
    );

    // Atualizar pontuação total
    await this.prisma.exam.update({
      where: { id: examId },
      data: {
        totalPoints: examQuestions.length,
      },
    });

    return examQuestions;
  }

  /**
   * Publicar um simulado
   */
  async publish(examId: string, teacherId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) {
      throw new NotFoundException('Simulado não encontrado');
    }

    if (exam.createdById !== teacherId) {
      throw new ForbiddenException('Apenas o criador pode publicar o simulado');
    }

    if (exam.questions.length === 0) {
      throw new BadRequestException(
        'O simulado precisa ter pelo menos uma questão',
      );
    }

    return this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.PUBLISHED },
    });
  }

  /**
   * Atribuir simulado a uma turma ou alunos
   */
  async assign(data: {
    examId: string;
    classId?: string;
    studentIds?: string[];
    dueDate?: Date;
  }) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: data.examId },
    });

    if (!exam) {
      throw new NotFoundException('Simulado não encontrado');
    }

    if (exam.status !== ExamStatus.PUBLISHED) {
      throw new BadRequestException('Apenas simulados publicados podem ser atribuídos');
    }

    const assignments: any[] = [];

    // Atribuir para turma
    if (data.classId) {
      const assignment = await this.prisma.examAssignment.create({
        data: {
          examId: data.examId,
          classId: data.classId,
          dueDate: data.dueDate,
        },
      });
      assignments.push(assignment);
    }

    // Atribuir para alunos específicos
    if (data.studentIds && data.studentIds.length > 0) {
      for (const studentId of data.studentIds) {
        const assignment = await this.prisma.examAssignment.create({
          data: {
            examId: data.examId,
            studentId,
            dueDate: data.dueDate,
          },
        });
        assignments.push(assignment);
      }
    }

    return assignments;
  }

  /**
   * Listar simulados disponíveis para um aluno
   */
  async getAvailableForStudent(studentId: string) {
    // Buscar enrollment do aluno
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classEnrollments: {
          where: { isActive: true },
          include: { class: true },
        },
      },
    });

    if (!student || student.classEnrollments.length === 0) {
      return [];
    }

    const classId = student.classEnrollments[0].classId;

    // Buscar assignments para a turma ou para o aluno
    const assignments = await this.prisma.examAssignment.findMany({
      where: {
        OR: [{ classId }, { studentId }],
      },
      include: {
        exam: {
          include: {
            subject: true,
            questions: true,
            attempts: {
              where: { studentId },
            },
          },
        },
      },
    });

    return assignments.map((assignment) => ({
      ...assignment.exam,
      assignment: {
        id: assignment.id,
        dueDate: assignment.dueDate,
      },
      attempt: assignment.exam.attempts[0] || null,
    }));
  }

  /**
   * Iniciar tentativa de simulado
   */
  async startAttempt(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) {
      throw new NotFoundException('Simulado não encontrado');
    }

    // Verificar se já existe tentativa em andamento
    const existingAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        status: { in: [AttemptStatus.NOT_STARTED, AttemptStatus.IN_PROGRESS] },
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    // Criar nova tentativa
    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        status: AttemptStatus.IN_PROGRESS,
        startTime: new Date(),
      },
    });

    return attempt;
  }

  /**
   * Responder uma questão
   */
  async answerQuestion(data: {
    attemptId: string;
    examQuestionId: string;
    selectedOption: number;
  }) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: data.attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Tentativa não encontrada');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('A tentativa não está em andamento');
    }

    // Buscar questão
    const examQuestion = await this.prisma.examQuestion.findUnique({
      where: { id: data.examQuestionId },
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!examQuestion) {
      throw new NotFoundException('Questão não encontrada');
    }

    // Verificar se a resposta está correta
    const selectedOption = examQuestion.question.options.find(
      (opt) => opt.orderNumber === data.selectedOption,
    );
    const isCorrect = selectedOption
      ? selectedOption.optionLetter === examQuestion.question.correctAnswer
      : false;

    // Criar ou atualizar resposta
    const answer = await this.prisma.examAnswer.upsert({
      where: {
        attemptId_examQuestionId: {
          attemptId: data.attemptId,
          examQuestionId: data.examQuestionId,
        },
      },
      update: {
        selectedOption: data.selectedOption,
        isCorrect,
        pointsEarned: isCorrect ? examQuestion.points : 0,
      },
      create: {
        attemptId: data.attemptId,
        examQuestionId: data.examQuestionId,
        selectedOption: data.selectedOption,
        isCorrect,
        pointsEarned: isCorrect ? examQuestion.points : 0,
      },
    });

    return answer;
  }

  /**
   * Finalizar tentativa e calcular resultado
   */
  async submitAttempt(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Tentativa não encontrada');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('A tentativa não está em andamento');
    }

    // Calcular pontuação
    const score = attempt.answers.reduce(
      (sum, answer) => sum + answer.pointsEarned,
      0,
    );
    const totalPoints = attempt.exam.totalPoints;
    const percentage = (score / totalPoints) * 100;

    // Calcular proficiência SAEB (escala 0-9)
    const proficiency = this.calculateProficiency(percentage);

    // Atualizar tentativa
    const updatedAttempt = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        endTime: new Date(),
        score,
        percentage,
        proficiency,
      },
    });

    // Adicionar pontos ao ranking
    const examPoints = Math.round(score * 10); // Score * 10 = pontos
    await this.rankingsService.addPoints(
      attempt.studentId,
      examPoints,
      'exam',
      `Simulado: ${attempt.exam.title}`,
      { examId: attempt.exam.id, attemptId, score, percentage },
    );

    // Verificar conquistas
    await this.achievementsService.checkAndUnlockBadges(attempt.studentId);

    return updatedAttempt;
  }

  /**
   * Calcular nível de proficiência SAEB (0-9)
   */
  private calculateProficiency(percentage: number): number {
    if (percentage >= 95) return 9;
    if (percentage >= 85) return 8;
    if (percentage >= 75) return 7;
    if (percentage >= 65) return 6;
    if (percentage >= 55) return 5;
    if (percentage >= 45) return 4;
    if (percentage >= 35) return 3;
    if (percentage >= 25) return 2;
    if (percentage >= 15) return 1;
    return 0;
  }

  /**
   * Obter resultado detalhado de uma tentativa
   */
  async getAttemptResult(attemptId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        answers: {
          include: {
            examQuestion: {
              include: {
                question: {
                  include: {
                    options: true,
                    saebDescriptor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Tentativa não encontrada');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('Você não tem permissão para ver este resultado');
    }

    // Análise por descritor SAEB
    const descriptorAnalysis: Record<
      string,
      { correct: number; total: number; descriptor: any }
    > = {};

    attempt.answers.forEach((answer) => {
      const descriptor = answer.examQuestion.question.saebDescriptor;
      if (descriptor) {
        if (!descriptorAnalysis[descriptor.id]) {
          descriptorAnalysis[descriptor.id] = {
            correct: 0,
            total: 0,
            descriptor,
          };
        }
        descriptorAnalysis[descriptor.id].total++;
        if (answer.isCorrect) {
          descriptorAnalysis[descriptor.id].correct++;
        }
      }
    });

    return {
      attempt,
      descriptorAnalysis: Object.values(descriptorAnalysis),
    };
  }

  /**
   * Listar simulados (para professores/admins)
   */
  async findAll(filters: {
    institutionId?: string;
    createdById?: string;
    type?: ExamType;
    status?: ExamStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.institutionId) where.institutionId = filters.institutionId;
    if (filters.createdById) where.createdById = filters.createdById;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        include: {
          subject: true,
          createdBy: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          questions: true,
          _count: {
            select: {
              attempts: true,
              assignments: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Estatísticas de um simulado
   */
  async getStatistics(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        attempts: {
          where: { status: AttemptStatus.SUBMITTED },
        },
        questions: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Simulado não encontrado');
    }

    const attempts = exam.attempts;

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        averageProficiency: 0,
        distribution: [],
      };
    }

    const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalPercentage = attempts.reduce(
      (sum, a) => sum + (a.percentage || 0),
      0,
    );
    const totalProficiency = attempts.reduce(
      (sum, a) => sum + (a.proficiency || 0),
      0,
    );

    // Distribuição de notas
    const distribution = Array(10).fill(0);
    attempts.forEach((attempt) => {
      const bucket = Math.floor((attempt.percentage || 0) / 10);
      distribution[Math.min(bucket, 9)]++;
    });

    return {
      totalAttempts: attempts.length,
      averageScore: totalScore / attempts.length,
      averagePercentage: totalPercentage / attempts.length,
      averageProficiency: totalProficiency / attempts.length,
      distribution,
    };
  }

  /**
   * Analytics avançados de um simulado
   * Inclui análise por descritor SAEB, questões mais difíceis, etc.
   */
  async getAdvancedAnalytics(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                saebDescriptor: true,
                options: true,
              },
            },
          },
        },
        attempts: {
          where: { status: AttemptStatus.SUBMITTED },
          include: {
            answers: {
              include: {
                examQuestion: {
                  include: {
                    question: {
                      include: {
                        saebDescriptor: true,
                      },
                    },
                  },
                },
              },
            },
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Simulado não encontrado');
    }

    const attempts = exam.attempts;
    const totalAttempts = attempts.length;

    if (totalAttempts === 0) {
      return {
        totalAttempts: 0,
        questionAnalytics: [],
        descriptorAnalytics: [],
        performanceByProficiency: [],
        topPerformers: [],
        studentsNeedingHelp: [],
      };
    }

    // Análise por questão
    const questionAnalytics: any[] = [];
    for (const examQuestion of exam.questions) {
      const answers = attempts.flatMap((att) =>
        att.answers.filter((ans) => ans.examQuestionId === examQuestion.id),
      );

      const correctCount = answers.filter((ans) => ans.isCorrect).length;
      const totalAnswers = answers.length;
      const successRate = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;

      // Distribuição de respostas por opção
      const optionDistribution = answers.reduce((acc, ans) => {
        const opt = ans.selectedOption;
        if (opt !== null && opt !== undefined) {
          acc[opt] = (acc[opt] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);

      questionAnalytics.push({
        questionId: examQuestion.questionId,
        orderNumber: examQuestion.orderNumber,
        questionText: (examQuestion.question as any).text?.substring(0, 100) + '...' || 'N/A',
        saebDescriptor: examQuestion.question.saebDescriptor,
        totalAnswers,
        correctCount,
        incorrectCount: totalAnswers - correctCount,
        successRate: Math.round(successRate * 10) / 10,
        difficulty: successRate >= 70 ? 'Fácil' : successRate >= 40 ? 'Médio' : 'Difícil',
        optionDistribution,
      });
    }

    // Ordenar questões por dificuldade (menor taxa de acerto primeiro)
    questionAnalytics.sort((a, b) => a.successRate - b.successRate);

    // Análise por descritor SAEB
    const descriptorMap: Record<string, {
      descriptor: any;
      totalQuestions: number;
      totalAnswers: number;
      correctAnswers: number;
    }> = {};

    for (const examQuestion of exam.questions) {
      const descriptor = examQuestion.question.saebDescriptor;
      if (descriptor) {
        if (!descriptorMap[descriptor.id]) {
          descriptorMap[descriptor.id] = {
            descriptor,
            totalQuestions: 0,
            totalAnswers: 0,
            correctAnswers: 0,
          };
        }

        descriptorMap[descriptor.id].totalQuestions++;

        const answers = attempts.flatMap((att) =>
          att.answers.filter((ans) => ans.examQuestionId === examQuestion.id),
        );

        descriptorMap[descriptor.id].totalAnswers += answers.length;
        descriptorMap[descriptor.id].correctAnswers += answers.filter(
          (ans) => ans.isCorrect,
        ).length;
      }
    }

    const descriptorAnalytics = Object.values(descriptorMap).map((item) => ({
      code: item.descriptor.code,
      subject: item.descriptor.subject,
      skill: item.descriptor.skill,
      description: item.descriptor.description,
      totalQuestions: item.totalQuestions,
      totalAnswers: item.totalAnswers,
      correctAnswers: item.correctAnswers,
      successRate:
        item.totalAnswers > 0
          ? Math.round((item.correctAnswers / item.totalAnswers) * 100 * 10) / 10
          : 0,
    }));

    // Performance por nível de proficiência
    const proficiencyGroups: Record<number, number> = {};
    attempts.forEach((attempt) => {
      const prof = attempt.proficiency || 0;
      proficiencyGroups[prof] = (proficiencyGroups[prof] || 0) + 1;
    });

    const performanceByProficiency = Object.entries(proficiencyGroups)
      .map(([proficiency, count]) => ({
        proficiency: parseInt(proficiency),
        count,
        percentage: Math.round((count / totalAttempts) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.proficiency - a.proficiency);

    // Top 10 performers
    const topPerformers = attempts
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
      .map((att) => ({
        studentId: att.studentId,
        studentName: `${att.student.user.firstName} ${att.student.user.lastName}`,
        score: att.score,
        percentage: att.percentage,
        proficiency: att.proficiency,
      }));

    // Alunos que precisam de ajuda (score < 60%)
    const studentsNeedingHelp = attempts
      .filter((att) => (att.percentage || 0) < 60)
      .sort((a, b) => (a.percentage || 0) - (b.percentage || 0))
      .slice(0, 10)
      .map((att) => ({
        studentId: att.studentId,
        studentName: `${att.student.user.firstName} ${att.student.user.lastName}`,
        score: att.score,
        percentage: att.percentage,
        proficiency: att.proficiency,
        weakDescriptors: this.identifyWeakDescriptors(att.answers),
      }));

    return {
      totalAttempts,
      questionAnalytics,
      descriptorAnalytics,
      performanceByProficiency,
      topPerformers,
      studentsNeedingHelp,
    };
  }

  /**
   * Identificar descritores fracos de um aluno baseado em suas respostas
   */
  private identifyWeakDescriptors(answers: any[]): any[] {
    const descriptorMap: Record<string, {
      descriptor: any;
      total: number;
      correct: number;
    }> = {};

    answers.forEach((answer) => {
      const descriptor = answer.examQuestion.question.saebDescriptor;
      if (descriptor) {
        if (!descriptorMap[descriptor.id]) {
          descriptorMap[descriptor.id] = {
            descriptor,
            total: 0,
            correct: 0,
          };
        }
        descriptorMap[descriptor.id].total++;
        if (answer.isCorrect) {
          descriptorMap[descriptor.id].correct++;
        }
      }
    });

    return Object.values(descriptorMap)
      .filter((item) => {
        const successRate = (item.correct / item.total) * 100;
        return successRate < 60; // Considera fraco se acertou menos de 60%
      })
      .map((item) => ({
        code: item.descriptor.code,
        description: item.descriptor.description,
        successRate: Math.round((item.correct / item.total) * 100),
      }));
  }

  /**
   * Relatório personalizado de desempenho do aluno
   */
  async getStudentPerformanceReport(studentId: string, filters?: {
    subjectId?: string;
    examType?: ExamType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      studentId,
      status: AttemptStatus.SUBMITTED,
    };

    if (filters) {
      if (filters.subjectId) {
        where.exam = { subjectId: filters.subjectId };
      }
      if (filters.examType) {
        where.exam = { ...where.exam, type: filters.examType };
      }
      if (filters.startDate || filters.endDate) {
        where.endTime = {};
        if (filters.startDate) where.endTime.gte = filters.startDate;
        if (filters.endDate) where.endTime.lte = filters.endDate;
      }
    }

    const attempts = await this.prisma.examAttempt.findMany({
      where,
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        answers: {
          include: {
            examQuestion: {
              include: {
                question: {
                  include: {
                    saebDescriptor: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { endTime: 'desc' },
    });

    if (attempts.length === 0) {
      return {
        studentId,
        totalExams: 0,
        averageScore: 0,
        averagePercentage: 0,
        averageProficiency: 0,
        evolution: [],
        descriptorPerformance: [],
        strongestDescriptors: [],
        weakestDescriptors: [],
      };
    }

    // Métricas gerais
    const totalExams = attempts.length;
    const totalScore = attempts.reduce((sum, att) => sum + (att.score || 0), 0);
    const totalPercentage = attempts.reduce((sum, att) => sum + (att.percentage || 0), 0);
    const totalProficiency = attempts.reduce((sum, att) => sum + (att.proficiency || 0), 0);

    // Evolução ao longo do tempo
    const evolution = attempts.map((att) => ({
      examId: att.examId,
      examTitle: att.exam.title,
      date: att.endTime,
      score: att.score,
      percentage: att.percentage,
      proficiency: att.proficiency,
    }));

    // Performance por descritor SAEB
    const descriptorMap: Record<string, {
      descriptor: any;
      total: number;
      correct: number;
    }> = {};

    attempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        const descriptor = answer.examQuestion.question.saebDescriptor;
        if (descriptor) {
          if (!descriptorMap[descriptor.id]) {
            descriptorMap[descriptor.id] = {
              descriptor,
              total: 0,
              correct: 0,
            };
          }
          descriptorMap[descriptor.id].total++;
          if (answer.isCorrect) {
            descriptorMap[descriptor.id].correct++;
          }
        }
      });
    });

    const descriptorPerformance = Object.values(descriptorMap).map((item) => ({
      code: item.descriptor.code,
      subject: item.descriptor.subject,
      skill: item.descriptor.skill,
      description: item.descriptor.description,
      total: item.total,
      correct: item.correct,
      successRate: Math.round((item.correct / item.total) * 100 * 10) / 10,
    }));

    // Ordenar por taxa de acerto
    descriptorPerformance.sort((a, b) => b.successRate - a.successRate);

    const strongestDescriptors = descriptorPerformance.slice(0, 5);
    const weakestDescriptors = descriptorPerformance.slice(-5).reverse();

    return {
      studentId,
      totalExams,
      averageScore: Math.round((totalScore / totalExams) * 10) / 10,
      averagePercentage: Math.round((totalPercentage / totalExams) * 10) / 10,
      averageProficiency: Math.round((totalProficiency / totalExams) * 10) / 10,
      evolution,
      descriptorPerformance,
      strongestDescriptors,
      weakestDescriptors,
    };
  }
}
