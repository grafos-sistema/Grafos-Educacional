import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova disciplina
   */
  async create(createSubjectDto: CreateSubjectDto) {
    const { institutionId, code, courseIds, ...data } = createSubjectDto;

    // Verifica se instituição existe
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada');
    }

    if (!institution.isActive) {
      throw new BadRequestException('Instituição não está ativa');
    }

    // Se código foi fornecido, verifica unicidade na instituição
    if (code) {
      const existingCode = await this.prisma.subject.findFirst({
        where: {
          institutionId,
          code,
        },
      });

      if (existingCode) {
        throw new ConflictException(
          'Já existe uma disciplina com este código nesta instituição',
        );
      }
    }

    // Note: Subject doesn't have direct course relation in schema
    // Subjects are related to courses through Class

    return this.prisma.subject.create({
      data: {
        ...data,
        code,
        institutionId,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            classSubjects: true,
            questionCategories: true,
            questions: true,
            activities: true,
          },
        },
      },
    });
  }

  /**
   * Lista todas as disciplinas com paginação e filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    institutionId?: string,
    courseId?: string,
    search?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Note: Subject doesn't have direct course relation
    // Filter by course through classes if needed
    if (courseId) {
      where.classSubjects = {
        some: {
          class: {
            courseId: courseId,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              classSubjects: true,
              questionCategories: true,
              questions: true,
              activities: true,
            },
          },
        },
      }),
      this.prisma.subject.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Busca uma disciplina por ID
   */
  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        classSubjects: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            classSubjects: true,
            questionCategories: true,
            questions: true,
            activities: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    return subject;
  }

  /**
   * Atualiza uma disciplina
   */
  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    // Verifica se disciplina existe
    const subject = await this.findOne(id);

    const { code, courseIds, ...data } = updateSubjectDto;

    // Se código foi fornecido, verifica unicidade
    if (code) {
      const existingCode = await this.prisma.subject.findFirst({
        where: {
          institutionId: subject.institutionId,
          code,
        },
      });

      if (existingCode && existingCode.id !== id) {
        throw new ConflictException(
          'Já existe uma disciplina com este código nesta instituição',
        );
      }
    }

    // Note: Subject doesn't have direct course relation in schema
    // Courses are related through Class assignments

    return this.prisma.subject.update({
      where: { id },
      data: {
        ...data,
        code,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            classSubjects: true,
            questionCategories: true,
            questions: true,
            activities: true,
          },
        },
      },
    });
  }

  /**
   * Remove uma disciplina (soft delete)
   */
  async remove(id: string) {
    // Verifica se disciplina existe
    await this.findOne(id);

    // Verifica se há turmas ativas vinculadas à disciplina via ClassSubject
    const activeClassSubjects = await this.prisma.classSubject.count({
      where: {
        subjectId: id,
        class: {
          isActive: true,
        },
      },
    });

    if (activeClassSubjects > 0) {
      throw new BadRequestException(
        `Não é possível excluir disciplina com ${activeClassSubjects} atribuição(ões) ativa(s)`,
      );
    }

    return this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
