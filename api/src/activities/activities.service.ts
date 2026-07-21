import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { UpdateActivityQuestionDto } from './dto/update-activity-question.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { UserRole, QuestionType } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private configService: ConfigService,
  ) {}

  /**
   * Converte URLs relativas de imagens em URLs absolutas
   * Para que funcionem no PDF gerado pelo Puppeteer
   */
  private getAbsoluteImageUrl(imagePath: string): string {
    // Se já é uma URL completa, retorna sem modificar
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Para URLs relativas, adiciona o host da aplicação
    // Usa localhost:3333 em desenvolvimento
    const baseUrl = this.configService.get<string>('app.url') || 'http://localhost:3333';
    return `${baseUrl}${imagePath}`;
  }

  async create(createActivityDto: CreateActivityDto, userId: string) {
    // Verify subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: createActivityDto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Verify class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: createActivityDto.classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Get teacher information
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found for current user');
    }

    return this.prisma.activity.create({
      data: {
        title: createActivityDto.title,
        description: createActivityDto.description,
        subjectId: createActivityDto.subjectId,
        classId: createActivityDto.classId,
        teacherId: teacher.id,
        institutionId: classEntity.institutionId,
        totalPoints: createActivityDto.totalPoints || 0,
        activityDate: createActivityDto.activityDate ? new Date(createActivityDto.activityDate) : null,
        headerTemplate: createActivityDto.headerText,
        footerTemplate: createActivityDto.footerText,
      },
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryActivityDto, currentUser: any) {
    const {
      page = 1,
      limit = 10,
      search,
      subjectId,
      classId,
      teacherId,
      fromDate,
      toDate,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    // Filter by institution if not SUPER_ADMIN
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.class = {
        institutionId: currentUser.institutionId,
      };
    }

    // Teachers can only see their own activities
    if (currentUser.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (teacher) {
        where.teacherId = teacher.id;
      }
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: true,
          class: true,
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: any) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        questions: {
          orderBy: { orderNumber: 'asc' },
          include: {
            question: {
              include: {
                category: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check access permissions
    this.checkAccessPermission(activity, currentUser);

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto, currentUser: any) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        teacher: true,
        class: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check permissions
    this.checkEditPermission(activity, currentUser);

    // Verify new subject if provided
    if (updateActivityDto.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: updateActivityDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    // Verify new class if provided
    if (updateActivityDto.classId) {
      const classEntity = await this.prisma.class.findUnique({
        where: { id: updateActivityDto.classId },
      });

      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }
    }

    // Preparar dados para atualização
    const { subjectId, classId, headerText, footerText, ...restDto } = updateActivityDto;
    const updateData: any = { ...restDto };

    // Mapear headerText/footerText para headerTemplate/footerTemplate
    if (headerText !== undefined) {
      updateData.headerTemplate = headerText;
    }
    if (footerText !== undefined) {
      updateData.footerTemplate = footerText;
    }

    // Converter activityDate para Date se fornecido
    if (updateActivityDto.activityDate !== undefined) {
      updateData.activityDate = updateActivityDto.activityDate
        ? new Date(updateActivityDto.activityDate)
        : null;
    }

    // Usar sintaxe de relação do Prisma para subject e class
    if (subjectId) {
      updateData.subject = { connect: { id: subjectId } };
    }
    if (classId) {
      updateData.class = { connect: { id: classId } };
    }

    return this.prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
  }

  async remove(id: string, currentUser: any) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        teacher: true,
        class: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check permissions
    this.checkEditPermission(activity, currentUser);

    await this.prisma.activity.delete({
      where: { id },
    });

    return { message: 'Activity deleted successfully' };
  }

  async addQuestion(activityId: string, addQuestionDto: AddQuestionDto, currentUser: any) {
    // Verify activity exists and user has permission
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        teacher: true,
        class: true,
        questions: {
          orderBy: { orderNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    this.checkEditPermission(activity, currentUser);

    // Verify question exists
    const question = await this.prisma.question.findUnique({
      where: { id: addQuestionDto.questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if question is already in activity
    const existingQuestion = await this.prisma.activityQuestion.findFirst({
      where: {
        activityId,
        questionId: addQuestionDto.questionId,
      },
    });

    if (existingQuestion) {
      throw new BadRequestException('Question is already in this activity');
    }

    // Determine order
    let orderNumber = addQuestionDto.orderNumber;
    if (!orderNumber) {
      // If no order specified, add to the end
      const lastQuestion = activity.questions[0];
      orderNumber = lastQuestion ? lastQuestion.orderNumber + 1 : 1;
    }

    // Determine custom points
    const customPoints = addQuestionDto.points !== undefined ? addQuestionDto.points : question.points;

    // Add question to activity
    const activityQuestion = await this.prisma.activityQuestion.create({
      data: {
        activityId,
        questionId: addQuestionDto.questionId,
        orderNumber,
        customPoints: customPoints,
      },
      include: {
        question: {
          include: {
            category: true,
          },
        },
      },
    });

    // Increment question usage count
    await this.prisma.question.update({
      where: { id: addQuestionDto.questionId },
      data: {
        timesUsed: {
          increment: 1,
        },
      },
    });

    // Recalculate total points
    await this.recalculateTotalPoints(activityId);

    return activityQuestion;
  }

  async updateActivityQuestion(
    activityId: string,
    questionId: string,
    updateDto: UpdateActivityQuestionDto,
    currentUser: any,
  ) {
    // Verify activity exists and user has permission
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        teacher: true,
        class: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    this.checkEditPermission(activity, currentUser);

    // Verify activity question exists
    const activityQuestion = await this.prisma.activityQuestion.findFirst({
      where: {
        activityId,
        questionId,
      },
    });

    if (!activityQuestion) {
      throw new NotFoundException('Question not found in this activity');
    }

    // Map points from DTO to customPoints
    const updateData: any = {};
    if (updateDto.orderNumber !== undefined) {
      updateData.orderNumber = updateDto.orderNumber;
    }
    if (updateDto.points !== undefined) {
      updateData.customPoints = updateDto.points;
    }

    // Update the activity question
    const updated = await this.prisma.activityQuestion.update({
      where: { id: activityQuestion.id },
      data: updateData,
      include: {
        question: {
          include: {
            category: true,
          },
        },
      },
    });

    // Recalculate total points if points changed
    if (updateDto.points !== undefined) {
      await this.recalculateTotalPoints(activityId);
    }

    return updated;
  }

  async removeQuestion(activityId: string, questionId: string, currentUser: any) {
    // Verify activity exists and user has permission
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        teacher: true,
        class: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    this.checkEditPermission(activity, currentUser);

    // Verify activity question exists
    const activityQuestion = await this.prisma.activityQuestion.findFirst({
      where: {
        activityId,
        questionId,
      },
    });

    if (!activityQuestion) {
      throw new NotFoundException('Question not found in this activity');
    }

    // Remove question from activity
    await this.prisma.activityQuestion.delete({
      where: { id: activityQuestion.id },
    });

    // Decrement question usage count
    await this.prisma.question.update({
      where: { id: questionId },
      data: {
        timesUsed: {
          decrement: 1,
        },
      },
    });

    // Recalculate total points
    await this.recalculateTotalPoints(activityId);

    return { message: 'Question removed from activity successfully' };
  }

  async preview(id: string, currentUser: any) {
    const activity = await this.findOne(id, currentUser);

    // Format the preview data
    return {
      title: activity.title,
      description: activity.description,
      subject: activity.subject?.name,
      class: activity.class?.name,
      totalPoints: activity.totalPoints,
      questions: activity.questions.map((aq, index) => ({
        number: index + 1,
        statement: aq.question.statement,
        type: aq.question.type,
        points: aq.customPoints,
        options: aq.question.options,
        images: aq.question.images,
      })),
    };
  }

  async getAnswerKey(id: string, currentUser: any) {
    const activity = await this.findOne(id, currentUser);

    return {
      title: `Gabarito - ${activity.title}`,
      questions: activity.questions.map((aq, index) => ({
        number: index + 1,
        statement: aq.question.statement,
        correctAnswer: aq.question.correctAnswer,
        answerKey: aq.question.answerKey,
        options: aq.question.options?.map((opt: any) => ({
          optionLetter: opt.optionLetter,
          text: opt.text,
        })),
        explanation: aq.question.explanation,
        points: aq.customPoints,
      })),
    };
  }

  private async recalculateTotalPoints(activityId: string) {
    const activityQuestions = await this.prisma.activityQuestion.findMany({
      where: { activityId },
    });

    const totalPoints = activityQuestions.reduce((sum, aq) => sum + (aq.customPoints || 0), 0);

    await this.prisma.activity.update({
      where: { id: activityId },
      data: { totalPoints },
    });
  }

  private checkAccessPermission(activity: any, currentUser: any) {
    // SUPER_ADMIN can access everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Check institution access
    if (activity.class.institutionId !== currentUser.institutionId) {
      throw new ForbiddenException('You do not have access to this activity');
    }
  }

  private checkEditPermission(activity: any, currentUser: any) {
    // SUPER_ADMIN can edit everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Check institution access
    if (activity.class.institutionId !== currentUser.institutionId) {
      throw new ForbiddenException('You do not have access to this activity');
    }

    // Teachers can only edit their own activities
    if (currentUser.role === UserRole.TEACHER) {
      if (activity.teacher.userId !== currentUser.userId) {
        throw new ForbiddenException('You can only edit your own activities');
      }
    }
  }

  async generatePdf(id: string, currentUser: any): Promise<Buffer> {
    // Buscar atividade com todas as questões e informações do cabeçalho
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        subject: true,
        class: {
          include: {
            institution: true,
            academicYear: {
              include: {
                periods: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    orderNumber: 'asc',
                  },
                  take: 1,
                },
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        questions: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: {
            orderNumber: 'asc',
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Verificar permissões de acesso
    this.checkAccessPermission(activity, currentUser);

    // Preparar dados para o template
    const teacherName = activity.teacher?.user?.name || '';
    const institutionName = activity.class?.institution?.name || '';
    const municipalityName = activity.class?.institution?.city || '';
    const className = activity.class?.name || '';
    const classShift = activity.class?.shift || '';

    // Buscar período acadêmico ativo
    const academicPeriod = activity.class?.academicYear?.periods?.[0];
    const evaluationPeriod = academicPeriod?.name || '';

    // Usar a data definida pelo professor, se existir, ou deixar vazio
    let activityDate = '';
    if (activity.activityDate) {
      const date = new Date(activity.activityDate);
      activityDate = date.toLocaleDateString('pt-BR');
    }

    const pdfData = {
      title: activity.title,
      description: activity.description || '',
      headerText: activity.headerTemplate || '',
      footerText: activity.footerTemplate || 'Boa sorte!',
      // Novos campos estruturados para o cabeçalho
      municipalityName: municipalityName,
      institutionName: institutionName,
      evaluationPeriod: evaluationPeriod,
      className: className,
      classShift: classShift,
      subjectName: activity.subject?.name || '',
      teacherName: teacherName,
      activityDate: activityDate,
      totalPoints: activity.totalPoints || 0,
      hasInstructions: !!activity.instructions,
      instructions: activity.instructions || '',
      questions: activity.questions.map((aq, index) => {
        const question = aq.question;
        const questionType = question.type;

        // Mapear tipo de questão
        const typeNames = {
          [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
          [QuestionType.OPEN_ENDED]: 'Resposta Aberta',
          [QuestionType.TRUE_FALSE]: 'Verdadeiro ou Falso',
          [QuestionType.SHORT_ANSWER]: 'Resposta Curta',
          [QuestionType.ESSAY]: 'Dissertativa',
          [QuestionType.FILL_IN_BLANK]: 'Preencher Lacunas',
        };

        // Preparar opções para múltipla escolha
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const options = question.options?.map((opt, i) => {
          const optionText = opt.text;
          const isLongText = optionText.length > 80;

          return {
            letter: opt.optionLetter || letters[i],
            text: optionText,
            isLongText: isLongText,
          };
        }) || [];

        // Verificar se há opções longas ou muitas opções
        const hasLongOptions = options.some(opt => opt.isLongText);
        const manyOptions = options.length >= 5;

        // Linhas para resposta dissertativa (ESSAY e OPEN_ENDED usam linhas)
        const answerLines = (questionType === QuestionType.ESSAY || questionType === QuestionType.OPEN_ENDED)
          ? Array(10).fill(0).map((_, i) => i)
          : [];

        // Processar imagens da questão
        let questionImages: string[] = [];
        if (question.images) {
          try {
            questionImages = typeof question.images === 'string'
              ? JSON.parse(question.images)
              : question.images;
          } catch (e) {
            // Se falhar ao parsear, tentar como array direto
            questionImages = [];
          }
        }

        // Converter URLs relativas em absolutas para o PDF funcionar
        const absoluteImageUrls = questionImages.map(url => this.getAbsoluteImageUrl(url));

        return {
          number: index + 1,
          statement: aq.customStatement || question.statement,
          typeName: typeNames[questionType] || 'Questão',
          points: aq.customPoints || question.points || 1,
          isMultipleChoice: questionType === QuestionType.MULTIPLE_CHOICE,
          isTrueFalse: questionType === QuestionType.TRUE_FALSE,
          isShortAnswer: questionType === QuestionType.SHORT_ANSWER,
          isEssay: questionType === QuestionType.ESSAY || questionType === QuestionType.OPEN_ENDED,
          isFillInBlank: questionType === QuestionType.FILL_IN_BLANK,
          images: absoluteImageUrls.length > 0 ? absoluteImageUrls : undefined,
          hasMultipleImages: absoluteImageUrls.length > 1,
          options: options.length > 0 ? options : undefined,
          hasLongOptions: hasLongOptions,
          manyOptions: manyOptions,
          answerLines: answerLines.length > 0 ? answerLines : undefined,
        };
      }),
    };

    // Gerar PDF
    return this.pdfService.generateActivityPdf(pdfData);
  }

  async generateHtmlPreview(id: string, currentUser: any): Promise<string> {
    // Buscar atividade (mesma lógica do generatePdf)
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        subject: true,
        class: {
          include: {
            institution: true,
            academicYear: {
              include: {
                periods: {
                  where: { isActive: true },
                  orderBy: { orderNumber: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        teacher: {
          include: { user: true },
        },
        questions: {
          include: {
            question: {
              include: { options: true },
            },
          },
          orderBy: { orderNumber: 'asc' },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    this.checkAccessPermission(activity, currentUser);

    // Preparar dados (reutilizar preparação do generatePdf)
    const teacherName = activity.teacher?.user?.name || '';
    const institutionName = activity.class?.institution?.name || '';
    const municipalityName = activity.class?.institution?.city || '';
    const className = activity.class?.name || '';
    const classShift = activity.class?.shift || '';
    const academicPeriod = activity.class?.academicYear?.periods?.[0];
    const evaluationPeriod = academicPeriod?.name || '';

    let activityDate = '';
    if (activity.activityDate) {
      activityDate = new Date(activity.activityDate).toLocaleDateString('pt-BR');
    }

    const typeNames = {
      [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
      [QuestionType.OPEN_ENDED]: 'Resposta Aberta',
      [QuestionType.TRUE_FALSE]: 'Verdadeiro ou Falso',
      [QuestionType.SHORT_ANSWER]: 'Resposta Curta',
      [QuestionType.ESSAY]: 'Dissertativa',
      [QuestionType.FILL_IN_BLANK]: 'Preencher Lacunas',
    };

    const pdfData = {
      title: activity.title,
      description: activity.description || '',
      headerText: activity.headerTemplate || '',
      footerText: activity.footerTemplate || 'Boa sorte!',
      municipalityName,
      institutionName,
      evaluationPeriod,
      className,
      classShift,
      subjectName: activity.subject?.name || '',
      teacherName,
      activityDate,
      totalPoints: activity.totalPoints || 0,
      hasInstructions: !!activity.instructions,
      instructions: activity.instructions || '',
      questions: activity.questions.map((aq, index) => {
        const question = aq.question;
        const questionType = question.type;
        const options = question.options?.map(opt => ({
          letter: opt.optionLetter,
          text: opt.text,
          isLongText: opt.text.length > 60,
        })) || [];

        let questionImages: string[] = [];
        if (question.images) {
          try {
            questionImages = typeof question.images === 'string' ? JSON.parse(question.images) : question.images;
          } catch (e) {
            questionImages = [];
          }
        }

        // Converter URLs relativas em absolutas para o preview funcionar
        const absoluteImageUrls = questionImages.map(url => this.getAbsoluteImageUrl(url));

        return {
          number: index + 1,
          statement: aq.customStatement || question.statement,
          typeName: typeNames[questionType] || 'Questão',
          points: aq.customPoints || question.points || 1,
          isMultipleChoice: questionType === QuestionType.MULTIPLE_CHOICE,
          isTrueFalse: questionType === QuestionType.TRUE_FALSE,
          isShortAnswer: questionType === QuestionType.SHORT_ANSWER,
          isEssay: questionType === QuestionType.ESSAY || questionType === QuestionType.OPEN_ENDED,
          isFillInBlank: questionType === QuestionType.FILL_IN_BLANK,
          images: absoluteImageUrls.length > 0 ? absoluteImageUrls : undefined,
          hasMultipleImages: absoluteImageUrls.length > 1,
          options: options.length > 0 ? options : undefined,
          hasLongOptions: options.some(opt => opt.isLongText),
          manyOptions: options.length >= 5,
          answerLines: (questionType === QuestionType.ESSAY || questionType === QuestionType.OPEN_ENDED) ? Array(10).fill(0).map((_, i) => i) : undefined,
        };
      }),
    };

    // Retornar HTML renderizado
    return this.pdfService.generateActivityHtml(pdfData);
  }
}
