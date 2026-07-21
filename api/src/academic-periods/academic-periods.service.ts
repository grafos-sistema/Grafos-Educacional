import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicPeriodDto, UpdateAcademicPeriodDto } from './dto';

@Injectable()
export class AcademicPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo período acadêmico
   */
  async create(createAcademicPeriodDto: CreateAcademicPeriodDto) {
    const { academicYearId, orderNumber, startDate, endDate, type, ...data } =
      createAcademicPeriodDto;

    // Verifica se ano letivo existe
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      throw new NotFoundException('Ano letivo não encontrado');
    }

    if (!academicYear.isActive) {
      throw new BadRequestException('Ano letivo não está ativo');
    }

    // Verifica se já existe período com a mesma ordem no ano letivo
    const existingOrder = await this.prisma.academicPeriod.findFirst({
      where: {
        academicYearId,
        orderNumber,
        isActive: true,
      },
    });

    if (existingOrder) {
      throw new ConflictException(
        `Já existe um período com a ordem ${orderNumber} neste ano letivo`,
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

    // Valida se as datas estão dentro do período do ano letivo
    if (
      parsedStartDate < academicYear.startDate ||
      parsedEndDate > academicYear.endDate
    ) {
      throw new BadRequestException(
        'As datas do período devem estar dentro do período do ano letivo',
      );
    }

    // Verifica se há conflito de datas com outros períodos do ano letivo
    const conflictingPeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        academicYearId,
        isActive: true,
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

    if (conflictingPeriod) {
      throw new ConflictException(
        `As datas informadas conflitam com o período "${conflictingPeriod.name}"`,
      );
    }

    // Valida ordem sequencial (verifica se não está pulando números)
    const periods = await this.prisma.academicPeriod.findMany({
      where: {
        academicYearId,
        isActive: true,
      },
      orderBy: { orderNumber: 'asc' },
    });

    if (periods.length > 0) {
      const maxOrder = Math.max(...periods.map((p) => p.orderNumber));
      if (orderNumber > maxOrder + 1) {
        throw new BadRequestException(
          `A ordem ${orderNumber} não é sequencial. O próximo período deve ter ordem ${maxOrder + 1}`,
        );
      }

      // Valida ordem cronológica (períodos devem estar em ordem cronológica)
      const previousPeriod = periods.find((p) => p.orderNumber === orderNumber - 1);
      if (previousPeriod && parsedStartDate <= previousPeriod.endDate) {
        throw new BadRequestException(
          `O período de ordem ${orderNumber} deve começar após o término do período anterior`,
        );
      }
    } else if (orderNumber !== 1) {
      throw new BadRequestException(
        'O primeiro período deve ter ordem 1',
      );
    }

    return this.prisma.academicPeriod.create({
      data: {
        ...data,
        type,
        orderNumber,
        academicYearId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos os períodos acadêmicos com paginação e filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    academicYearId?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.academicPeriod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderNumber: 'asc' },
        include: {
          academicYear: {
            select: {
              id: true,
              year: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.academicPeriod.count({ where }),
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
   * Busca um período acadêmico por ID
   */
  async findOne(id: string) {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Período acadêmico não encontrado');
    }

    return period;
  }

  /**
   * Atualiza um período acadêmico
   */
  async update(id: string, updateAcademicPeriodDto: UpdateAcademicPeriodDto) {
    // Verifica se período existe
    const period = await this.findOne(id);

    const { orderNumber, startDate, endDate, ...data } = updateAcademicPeriodDto;

    // Se ordem foi fornecida, verifica unicidade
    if (orderNumber !== undefined && orderNumber !== period.orderNumber) {
      const existingOrder = await this.prisma.academicPeriod.findFirst({
        where: {
          academicYearId: period.academicYearId,
          orderNumber,
          isActive: true,
        },
      });

      if (existingOrder) {
        throw new ConflictException(
          `Já existe um período com a ordem ${orderNumber} neste ano letivo`,
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

      // Valida se as datas estão dentro do período do ano letivo
      if (
        parsedStartDate < period.academicYear.startDate ||
        parsedEndDate > period.academicYear.endDate
      ) {
        throw new BadRequestException(
          'As datas do período devem estar dentro do período do ano letivo',
        );
      }
    }

    return this.prisma.academicPeriod.update({
      where: { id },
      data: {
        ...data,
        orderNumber,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Remove um período acadêmico (soft delete)
   */
  async remove(id: string) {
    // Verifica se período existe
    await this.findOne(id);

    return this.prisma.academicPeriod.update({
      where: { id },
      data: { isActive: false },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            name: true,
          },
        },
      },
    });
  }
}
