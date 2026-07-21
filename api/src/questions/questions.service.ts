import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, QuestionType } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto, user: any) {
    // Verify category exists (if provided)
    if (createQuestionDto.categoryId) {
      const category = await this.prisma.questionCategory.findUnique({
        where: { id: createQuestionDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Question category not found');
      }
    }

    // Validate options for multiple choice questions
    if (createQuestionDto.type === QuestionType.MULTIPLE_CHOICE) {
      if (!createQuestionDto.options || createQuestionDto.options.length < 2) {
        throw new BadRequestException('Multiple choice questions must have at least 2 options');
      }

      const correctOptions = createQuestionDto.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        throw new BadRequestException('Multiple choice questions must have at least one correct option');
      }
    }

    // Prepare options data for nested create
    const optionsData = createQuestionDto.options?.map((opt, index) => ({
      optionLetter: String.fromCharCode(65 + index), // A, B, C, D...
      text: opt.text,
      orderNumber: index + 1,
    })) || [];

    // Set correctAnswer based on the correct option letter
    let correctAnswer = createQuestionDto.correctAnswer;
    if (createQuestionDto.type === QuestionType.MULTIPLE_CHOICE && createQuestionDto.options) {
      const correctIndex = createQuestionDto.options.findIndex(opt => opt.isCorrect);
      if (correctIndex >= 0) {
        correctAnswer = String.fromCharCode(65 + correctIndex);
      }
    }

    // Extract user data
    const createdById = user.userId;
    // For SUPER_ADMIN, institutionId is optional (null for public questions)
    // For other users, use their institutionId
    const institutionId = user.role === 'SUPER_ADMIN' ? null : user.institutionId;

    // Preparar imagens - aceitar tanto imageUrl (single) quanto images (array)
    let imageData: string | null = null;
    if (createQuestionDto.images && createQuestionDto.images.length > 0) {
      // Se forneceu array de imagens, usar esse
      imageData = JSON.stringify(createQuestionDto.images);
    } else if (createQuestionDto.imageUrl) {
      // Se forneceu imageUrl (compatibilidade), converter para array
      imageData = JSON.stringify([createQuestionDto.imageUrl]);
    }

    return this.prisma.question.create({
      data: {
        title: createQuestionDto.title,
        statement: createQuestionDto.statement,
        type: createQuestionDto.type,
        difficulty: createQuestionDto.difficulty,
        categoryId: createQuestionDto.categoryId || null,
        subjectId: createQuestionDto.subjectId || null,
        institutionId: institutionId,
        createdById: createdById,
        correctAnswer: correctAnswer,
        explanation: createQuestionDto.explanation,
        tags: createQuestionDto.tags || [],
        points: createQuestionDto.points || 1.0,
        isPublic: createQuestionDto.isPublic ?? false,
        images: imageData,
        timesUsed: 0,
        options: {
          create: optionsData,
        },
      },
      include: {
        category: true,
        subject: true,
        options: true,
      },
    });
  }

  async findAll(query: QueryQuestionDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      type,
      difficulty,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.statement = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        hasSome: tagArray,
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      data: questions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    // Check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // If category is being updated, verify it exists
    if (updateQuestionDto.categoryId) {
      const category = await this.prisma.questionCategory.findUnique({
        where: { id: updateQuestionDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Question category not found');
      }
    }

    // Validate options if being updated
    if (updateQuestionDto.options) {
      const questionType = updateQuestionDto.type || question.type;

      if (questionType === QuestionType.MULTIPLE_CHOICE) {
        if (updateQuestionDto.options.length < 2) {
          throw new BadRequestException('Multiple choice questions must have at least 2 options');
        }

        const correctOptions = updateQuestionDto.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          throw new BadRequestException('Multiple choice questions must have at least one correct option');
        }
      }
    }

    // Remove fields that need special handling
    const { categoryId, subjectId, options, imageUrl, images, ...restData } = updateQuestionDto;

    // Preparar dados para atualização
    const updateData: any = { ...restData };

    // Processar imagens se fornecidas
    if (images && images.length > 0) {
      updateData.images = JSON.stringify(images);
    } else if (imageUrl) {
      updateData.images = JSON.stringify([imageUrl]);
    } else if (updateQuestionDto.hasOwnProperty('images')) {
      // Se images foi explicitamente passado como vazio/null, limpar
      updateData.images = null;
    }

    // Adicionar relações se fornecidas
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }
    if (subjectId !== undefined) {
      updateData.subjectId = subjectId;
    }

    // TODO: Handle options update separately if needed
    // For now, updating options requires deleting and recreating them

    return this.prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subject: true,
        options: true,
      },
    });
  }

  async remove(id: string) {
    // Check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activityQuestions: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if question is being used in activities
    if (question._count.activityQuestions > 0) {
      throw new BadRequestException(
        `Cannot delete question that is used in ${question._count.activityQuestions} activity(ies). Please remove it from activities first.`,
      );
    }

    await this.prisma.question.delete({
      where: { id },
    });

    return { message: 'Question deleted successfully' };
  }

  async duplicate(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Create a copy of the question
    const { id: _id, createdAt, updatedAt, timesUsed, ...questionData } = question;

    const duplicatedQuestion = await this.prisma.question.create({
      data: {
        ...questionData,
        statement: `${questionData.statement} (cópia)`,
        timesUsed: 0,
      },
      include: {
        category: true,
      },
    });

    return duplicatedQuestion;
  }

  async incrementUsageCount(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        timesUsed: {
          increment: 1,
        },
      },
    });
  }

  async getStatistics() {
    const [
      total,
      byType,
      byDifficulty,
      byCategory,
      mostUsed,
    ] = await Promise.all([
      this.prisma.question.count(),
      this.prisma.question.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.question.groupBy({
        by: ['difficulty'],
        _count: true,
      }),
      this.prisma.question.groupBy({
        by: ['categoryId'],
        _count: true,
        orderBy: {
          _count: {
            categoryId: 'desc',
          },
        },
        take: 5,
      }),
      this.prisma.question.findMany({
        orderBy: {
          timesUsed: 'desc',
        },
        take: 10,
        include: {
          category: true,
        },
      }),
    ]);

    // Fetch category names for top categories
    const categoryIds = byCategory.map(c => c.categoryId).filter((id): id is string => id !== null);
    const categories = await this.prisma.questionCategory.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });

    const topCategories = byCategory.map(c => {
      const category = categories.find(cat => cat.id === c.categoryId);
      return {
        categoryId: c.categoryId,
        categoryName: category?.name || 'Unknown',
        count: c._count,
      };
    });

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byDifficulty: byDifficulty.reduce((acc, item) => {
        acc[item.difficulty] = item._count;
        return acc;
      }, {} as Record<string, number>),
      topCategories,
      mostUsed,
    };
  }
}
