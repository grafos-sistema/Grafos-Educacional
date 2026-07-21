import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionCategoryDto } from './dto/create-question-category.dto';
import { UpdateQuestionCategoryDto } from './dto/update-question-category.dto';
import { QueryQuestionCategoryDto } from './dto/query-question-category.dto';

@Injectable()
export class QuestionCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionCategoryDto: CreateQuestionCategoryDto) {
    // Check if category with same name already exists
    const existingCategory = await this.prisma.questionCategory.findFirst({
      where: {
        name: createQuestionCategoryDto.name,
      },
    });

    if (existingCategory) {
      throw new ConflictException('A category with this name already exists');
    }

    return this.prisma.questionCategory.create({
      data: createQuestionCategoryDto,
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryQuestionCategoryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [categories, total] = await Promise.all([
      this.prisma.questionCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              questions: true,
            },
          },
        },
      }),
      this.prisma.questionCategory.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.questionCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Question category not found');
    }

    return category;
  }

  async update(id: string, updateQuestionCategoryDto: UpdateQuestionCategoryDto) {
    // Check if category exists
    const category = await this.prisma.questionCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Question category not found');
    }

    // If name is being updated, check for duplicates
    if (updateQuestionCategoryDto.name && updateQuestionCategoryDto.name !== category.name) {
      const existingCategory = await this.prisma.questionCategory.findFirst({
        where: {
          name: updateQuestionCategoryDto.name,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new ConflictException('A category with this name already exists');
      }
    }

    return this.prisma.questionCategory.update({
      where: { id },
      data: updateQuestionCategoryDto,
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Check if category exists
    const category = await this.prisma.questionCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Question category not found');
    }

    // Check if category has questions
    if (category._count.questions > 0) {
      throw new ConflictException(
        `Cannot delete category with ${category._count.questions} associated question(s). Please remove or reassign the questions first.`,
      );
    }

    await this.prisma.questionCategory.delete({
      where: { id },
    });

    return { message: 'Question category deleted successfully' };
  }

  async getStatistics(id: string) {
    const category = await this.prisma.questionCategory.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            difficulty: true,
            type: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Question category not found');
    }

    // Calculate statistics
    const totalQuestions = category.questions.length;
    const byDifficulty = category.questions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = category.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      id: category.id,
      name: category.name,
      totalQuestions,
      byDifficulty,
      byType,
    };
  }
}
