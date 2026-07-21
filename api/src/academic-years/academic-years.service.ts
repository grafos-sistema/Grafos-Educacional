import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo ano letivo
   */
  async create(createAcademicYearDto: CreateAcademicYearDto) {
    const { institutionId, year, startDate, endDate, ...data } =
      createAcademicYearDto;

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

    // Verifica se já existe ano letivo para o mesmo ano e instituição
    const existingYear = await this.prisma.academicYear.findFirst({
      where: {
        institutionId,
        year,
      },
    });

    if (existingYear) {
      throw new ConflictException(
        `Já existe um ano letivo cadastrado para o ano ${year} nesta instituição`,
      );
    }

    // Converte datas string para Date
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Valida se data de término é posterior à data de início
    if (parsedEndDate <= parsedStartDate) {
      throw new BadRequestException(
        'Data de término deve ser posterior à data de início',
      );
    }

    // Verifica se há conflito de datas com outros anos letivos da instituição
    const conflictingYear = await this.prisma.academicYear.findFirst({
      where: {
        institutionId,
        OR: [
          {
            AND: [
              { startDate: { lte: parsedStartDate } },
              { endDate: { gte: parsedStartDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: parsedEndDate } },
              { endDate: { gte: parsedEndDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: parsedStartDate } },
              { endDate: { lte: parsedEndDate } },
            ],
          },
        ],
      },
    });

    if (conflictingYear) {
      throw new ConflictException(
        `As datas informadas conflitam com o ano letivo "${conflictingYear.name}"`,
      );
    }

    return this.prisma.academicYear.create({
      data: {
        ...data,
        year,
        institutionId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
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
            periods: true,
            classes: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos os anos letivos com paginação e filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    institutionId?: string,
    year?: number,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (year) {
      where.year = year;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.academicYear.findMany({
        where,
        skip,
        take: limit,
        orderBy: { year: 'desc' },
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
              periods: true,
              classes: true,
            },
          },
        },
      }),
      this.prisma.academicYear.count({ where }),
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
   * Busca um ano letivo por ID
   */
  async findOne(id: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        periods: {
          orderBy: { orderNumber: 'asc' },
        },
        _count: {
          select: {
            periods: true,
            classes: true,
          },
        },
      },
    });

    if (!academicYear) {
      throw new NotFoundException('Ano letivo não encontrado');
    }

    return academicYear;
  }

  /**
   * Busca o ano letivo ativo de uma instituição
   */
  async findActive(institutionId: string) {
    const now = new Date();

    const activeYear = await this.prisma.academicYear.findFirst({
      where: {
        institutionId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        periods: {
          orderBy: { orderNumber: 'asc' },
        },
        _count: {
          select: {
            periods: true,
            classes: true,
          },
        },
      },
    });

    if (!activeYear) {
      throw new NotFoundException(
        'Nenhum ano letivo ativo encontrado para esta instituição',
      );
    }

    return activeYear;
  }

  /**
   * Atualiza um ano letivo
   */
  async update(id: string, updateAcademicYearDto: UpdateAcademicYearDto) {
    // Verifica se ano letivo existe
    await this.findOne(id);

    const { year, startDate, endDate, ...data } = updateAcademicYearDto;

    // Se ano foi fornecido, verifica unicidade
    if (year) {
      const academicYear = await this.prisma.academicYear.findUnique({
        where: { id },
        select: { institutionId: true },
      });

      const existingYear = await this.prisma.academicYear.findFirst({
        where: {
          institutionId: academicYear!.institutionId,
          year,
        },
      });

      if (existingYear && existingYear.id !== id) {
        throw new ConflictException(
          `Já existe um ano letivo cadastrado para o ano ${year} nesta instituição`,
        );
      }
    }

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    // Converte datas se fornecidas
    if (startDate) {
      parsedStartDate = new Date(startDate);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
    }

    // Se ambas as datas foram fornecidas, valida
    if (parsedStartDate && parsedEndDate) {
      if (parsedEndDate <= parsedStartDate) {
        throw new BadRequestException(
          'Data de término deve ser posterior à data de início',
        );
      }
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        ...data,
        year,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
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
            periods: true,
            classes: true,
          },
        },
      },
    });
  }

  /**
   * Remove um ano letivo (soft delete)
   */
  async remove(id: string) {
    // Verifica se ano letivo existe
    await this.findOne(id);

    // Verifica se há turmas ativas
    const activeClasses = await this.prisma.class.count({
      where: {
        academicYearId: id,
        isActive: true,
      },
    });

    if (activeClasses > 0) {
      throw new BadRequestException(
        `Não é possível excluir ano letivo com ${activeClasses} turma(s) ativa(s)`,
      );
    }

    return this.prisma.academicYear.update({
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

  /**
   * Retorna um resumo do impacto antes da exclusão permanente
   */
  async getDeleteImpact(id: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        year: true,
        periods: {
          orderBy: { orderNumber: 'asc' },
          take: 5,
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        classes: {
          orderBy: { name: 'asc' },
          take: 5,
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        events: {
          orderBy: { startDate: 'asc' },
          take: 5,
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
        _count: {
          select: {
            periods: true,
            classes: true,
            events: true,
          },
        },
      },
    });

    if (!academicYear) {
      throw new NotFoundException('Ano letivo não encontrado');
    }

    const [
      lessonPlans,
      grades,
      enrollments,
      schedules,
      attendances,
      activities,
      rankings,
      examAssignments,
    ] = await Promise.all([
      this.prisma.lessonPlan.count({
        where: { academicPeriod: { academicYearId: id } },
      }),
      this.prisma.grade.count({
        where: { academicPeriod: { academicYearId: id } },
      }),
      this.prisma.classEnrollment.count({
        where: { class: { academicYearId: id } },
      }),
      this.prisma.classSchedule.count({
        where: { class: { academicYearId: id } },
      }),
      this.prisma.attendance.count({
        where: { class: { academicYearId: id } },
      }),
      this.prisma.activity.count({
        where: { class: { academicYearId: id } },
      }),
      this.prisma.ranking.count({
        where: { class: { academicYearId: id } },
      }),
      this.prisma.examAssignment.count({
        where: { class: { academicYearId: id } },
      }),
    ]);

    return {
      academicYearId: academicYear.id,
      name: academicYear.name,
      year: academicYear.year,
      directRelations: {
        periods: academicYear._count.periods,
        classes: academicYear._count.classes,
        events: academicYear._count.events,
      },
      dependentRelations: {
        lessonPlans,
        grades,
        enrollments,
        schedules,
        attendances,
        activities,
        rankings,
        examAssignments,
      },
      samples: {
        periods: academicYear.periods,
        classes: academicYear.classes,
        events: academicYear.events,
      },
    };
  }

  /**
   * Exclui permanentemente um ano letivo e todos os vínculos em cascata
   */
  async removePermanently(id: string) {
    await this.findOne(id);

    await this.prisma.academicYear.delete({
      where: { id },
    });

    return { success: true };
  }
}
