import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo curso
   */
  async create(createCourseDto: CreateCourseDto) {
    const { institutionId, code, duration, workload, ...data } = createCourseDto;

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
      const existingCode = await this.prisma.course.findFirst({
        where: {
          institutionId,
          code,
        },
      });

      if (existingCode) {
        throw new ConflictException(
          'Já existe um curso com este código nesta instituição',
        );
      }
    }

    return this.prisma.course.create({
      data: {
        ...data,
        code,
        institutionId,
        duration: duration ? parseInt(duration) : undefined,
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
            classes: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos os cursos com paginação e filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    institutionId?: string,
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

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
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
              classes: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
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
   * Busca um curso por ID
   */
  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
          orderBy: {
            name: 'asc',
          },
          take: 10,
        },
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    return course;
  }

  /**
   * Atualiza um curso
   */
  async update(id: string, updateCourseDto: UpdateCourseDto) {
    // Verifica se curso existe
    const course = await this.findOne(id);

    const { code, duration, workload, ...data } = updateCourseDto;

    // Se código foi fornecido, verifica unicidade
    if (code) {
      const existingCode = await this.prisma.course.findFirst({
        where: {
          institutionId: course.institutionId,
          code,
        },
      });

      if (existingCode && existingCode.id !== id) {
        throw new ConflictException(
          'Já existe um curso com este código nesta instituição',
        );
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        ...data,
        code,
        duration: duration ? parseInt(duration) : undefined,
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
            classes: true,
          },
        },
      },
    });
  }

  /**
   * Remove um curso (soft delete)
   */
  async remove(id: string) {
    // Verifica se curso existe
    await this.findOne(id);

    // Verifica se há turmas ativas vinculadas ao curso
    const activeClasses = await this.prisma.class.count({
      where: {
        courseId: id,
        isActive: true,
      },
    });

    if (activeClasses > 0) {
      throw new BadRequestException(
        `Não é possível excluir curso com ${activeClasses} turma(s) ativa(s)`,
      );
    }

    return this.prisma.course.update({
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
