import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonPlanDto, UpdateLessonPlanDto } from './dto';

@Injectable()
export class LessonPlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria plano de ensino
   */
  async create(createLessonPlanDto: CreateLessonPlanDto) {
    const {
      classSubjectId,
      academicPeriodId,
      teacherId,
      createdById,
      title,
      description,
      objectives,
      methodology,
      resources,
      evaluation,
      startDate,
      endDate,
    } = createLessonPlanDto;

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

    // Valida período letivo
    const academicPeriod = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });

    if (!academicPeriod) {
      throw new NotFoundException('Período letivo não encontrado');
    }

    if (!academicPeriod.isActive) {
      throw new BadRequestException('Período letivo não está ativo');
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
    if (classSubject.teacherId && classSubject.teacherId !== teacherId) {
      throw new BadRequestException(
        'Professor não leciona esta disciplina na turma',
      );
    }

    // Valida criador
    const creator = await this.prisma.user.findUnique({
      where: { id: createdById },
    });

    if (!creator) {
      throw new NotFoundException('Usuário criador não encontrado');
    }

    // Valida datas
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedEndDate <= parsedStartDate) {
      throw new BadRequestException(
        'Data de término deve ser posterior à data de início',
      );
    }

    // Valida se datas estão dentro do período letivo
    if (
      parsedStartDate < academicPeriod.startDate ||
      parsedEndDate > academicPeriod.endDate
    ) {
      throw new BadRequestException(
        'As datas do plano devem estar dentro do período letivo',
      );
    }

    return this.prisma.lessonPlan.create({
      data: {
        classSubjectId,
        academicPeriodId,
        teacherId,
        createdById,
        title,
        description,
        objectives,
        methodology,
        resources,
        evaluation,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
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
        academicPeriod: {
          select: {
            id: true,
            name: true,
            orderNumber: true,
            startDate: true,
            endDate: true,
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Lista planos de ensino com filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    classSubjectId?: string,
    academicPeriodId?: string,
    teacherId?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (classSubjectId) {
      where.classSubjectId = classSubjectId;
    }

    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    const [data, total] = await Promise.all([
      this.prisma.lessonPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
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
          academicPeriod: {
            select: {
              id: true,
              name: true,
              orderNumber: true,
              startDate: true,
              endDate: true,
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.lessonPlan.count({ where }),
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
   * Busca plano de ensino por ID
   */
  async findOne(id: string) {
    const lessonPlan = await this.prisma.lessonPlan.findUnique({
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
        academicPeriod: {
          select: {
            id: true,
            name: true,
            orderNumber: true,
            startDate: true,
            endDate: true,
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!lessonPlan) {
      throw new NotFoundException('Plano de ensino não encontrado');
    }

    return lessonPlan;
  }

  /**
   * Atualiza plano de ensino
   */
  async update(id: string, updateLessonPlanDto: UpdateLessonPlanDto) {
    const lessonPlan = await this.findOne(id);

    const { startDate, endDate, ...data } = updateLessonPlanDto;

    // Se datas foram fornecidas, valida
    if (startDate || endDate) {
      const finalStartDate = startDate
        ? new Date(startDate)
        : lessonPlan.startDate;
      const finalEndDate = endDate ? new Date(endDate) : lessonPlan.endDate;

      if (finalEndDate <= finalStartDate) {
        throw new BadRequestException(
          'Data de término deve ser posterior à data de início',
        );
      }

      // Busca período letivo para validar datas
      const academicPeriod = await this.prisma.academicPeriod.findUnique({
        where: { id: lessonPlan.academicPeriodId },
      });

      if (!academicPeriod) {
        throw new NotFoundException('Período letivo não encontrado');
      }

      if (
        finalStartDate < academicPeriod.startDate ||
        finalEndDate > academicPeriod.endDate
      ) {
        throw new BadRequestException(
          'As datas do plano devem estar dentro do período letivo',
        );
      }
    }

    return this.prisma.lessonPlan.update({
      where: { id },
      data: {
        ...data,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
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
        academicPeriod: {
          select: {
            id: true,
            name: true,
            orderNumber: true,
          },
        },
        teacher: {
          select: {
            id: true,
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
  }

  /**
   * Submete plano de ensino para aprovação
   */
  async submit(id: string) {
    const lessonPlan = await this.findOne(id);

    if (lessonPlan.status !== 'DRAFT') {
      throw new BadRequestException(
        'Apenas planos em rascunho podem ser submetidos',
      );
    }

    return this.prisma.lessonPlan.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        classSubject: {
          include: {
            class: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        academicPeriod: true,
        teacher: {
          include: {
            user: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Aprova plano de ensino
   */
  async approve(id: string, approvedById: string) {
    const lessonPlan = await this.findOne(id);

    if (lessonPlan.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Apenas planos submetidos podem ser aprovados',
      );
    }

    // Verificar se o aprovador existe e tem permissão
    const approver = await this.prisma.user.findUnique({
      where: { id: approvedById },
    });

    if (!approver) {
      throw new NotFoundException('Usuário aprovador não encontrado');
    }

    if (
      !['COORDINATOR', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'].includes(
        approver.role,
      )
    ) {
      throw new BadRequestException(
        'Usuário não tem permissão para aprovar planos',
      );
    }

    return this.prisma.lessonPlan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById,
        rejectionReason: null, // Limpar motivo de rejeição anterior, se houver
      },
      include: {
        classSubject: {
          include: {
            class: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        academicPeriod: true,
        teacher: {
          include: {
            user: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Rejeita plano de ensino
   */
  async reject(id: string, approvedById: string, reason: string) {
    const lessonPlan = await this.findOne(id);

    if (lessonPlan.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Apenas planos submetidos podem ser rejeitados',
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'É necessário informar o motivo da rejeição',
      );
    }

    // Verificar se o aprovador existe e tem permissão
    const approver = await this.prisma.user.findUnique({
      where: { id: approvedById },
    });

    if (!approver) {
      throw new NotFoundException('Usuário aprovador não encontrado');
    }

    if (
      !['COORDINATOR', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'].includes(
        approver.role,
      )
    ) {
      throw new BadRequestException(
        'Usuário não tem permissão para rejeitar planos',
      );
    }

    return this.prisma.lessonPlan.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedById,
        approvedAt: new Date(), // Registrar quando foi rejeitado
      },
      include: {
        classSubject: {
          include: {
            class: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        academicPeriod: true,
        teacher: {
          include: {
            user: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Remove plano de ensino
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.lessonPlan.delete({
      where: { id },
    });
  }
}
