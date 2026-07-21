import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonContentDto, UpdateLessonContentDto } from './dto';

@Injectable()
export class LessonContentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria conteúdo de aula
   */
  async create(createLessonContentDto: CreateLessonContentDto) {
    const {
      classSubjectId,
      teacherId,
      date,
      title,
      description,
      objectives,
      activities,
      homework,
      observations,
    } = createLessonContentDto;

    // Valida disciplina
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    // Valida professor
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    if (!teacher.isActive) {
      throw new BadRequestException('Professor não está ativo');
    }

    // Valida se professor leciona a disciplina
    if (classSubject.teacherId !== teacherId) {
      throw new BadRequestException(
        'Professor não leciona esta disciplina na turma',
      );
    }

    return this.prisma.lessonContent.create({
      data: {
        classSubjectId,
        teacherId,
        date: new Date(date),
        title,
        description,
        objectives,
        activities,
        homework,
        observations,
      },
      include: {
        classSubject: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Lista conteúdos de aula com filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    classSubjectId?: string,
    teacherId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (classSubjectId) {
      where.classSubjectId = classSubjectId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.lessonContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          classSubject: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  grade: true,
                  section: true,
                },
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.lessonContent.count({ where }),
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
   * Busca conteúdo de aula por ID
   */
  async findOne(id: string) {
    const lessonContent = await this.prisma.lessonContent.findUnique({
      where: { id },
      include: {
        classSubject: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!lessonContent) {
      throw new NotFoundException('Conteúdo de aula não encontrado');
    }

    return lessonContent;
  }

  /**
   * Atualiza conteúdo de aula
   */
  async update(id: string, updateLessonContentDto: UpdateLessonContentDto) {
    await this.findOne(id);

    return this.prisma.lessonContent.update({
      where: { id },
      data: updateLessonContentDto,
      include: {
        classSubject: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Remove conteúdo de aula
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.lessonContent.delete({
      where: { id },
    });
  }
}
