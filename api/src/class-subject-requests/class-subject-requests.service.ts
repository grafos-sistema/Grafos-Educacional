import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectRequestDto, RejectRequestDto } from './dto';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class ClassSubjectRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obter ID do professor a partir do ID do usuário
   */
  async getTeacherIdByUserId(userId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    return teacher.id;
  }

  /**
   * Criar solicitação de disciplina usando userId (wrapper)
   */
  async createByUserId(userId: string, createDto: CreateSubjectRequestDto) {
    const teacherId = await this.getTeacherIdByUserId(userId);
    return this.create(teacherId, createDto);
  }

  /**
   * Criar solicitação de disciplina (Professor)
   */
  async create(teacherId: string, createDto: CreateSubjectRequestDto) {
    const { classId, subjectId, message } = createDto;

    // Verificar se professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    if (!teacher.isActive) {
      throw new BadRequestException('Professor não está ativo');
    }

    // Verificar se turma existe
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Verificar se disciplina existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    // Verificar se já existe atribuição ativa para esta turma/disciplina
    const existingAssignment = await this.prisma.classSubject.findUnique({
      where: {
        classId_subjectId: {
          classId,
          subjectId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'Esta disciplina já possui um professor atribuído nesta turma',
      );
    }

    // Verificar se já existe solicitação pendente
    const existingRequest = await this.prisma.classSubjectRequest.findUnique({
      where: {
        classId_subjectId_teacherId: {
          classId,
          subjectId,
          teacherId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === RequestStatus.PENDING) {
        throw new ConflictException('Você já possui uma solicitação pendente');
      }
      // Se foi rejeitada, permitir nova solicitação deletando a antiga
      await this.prisma.classSubjectRequest.delete({
        where: { id: existingRequest.id },
      });
    }

    // Criar solicitação
    return this.prisma.classSubjectRequest.create({
      data: {
        teacherId,
        classId,
        subjectId,
        message,
      },
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
            color: true,
          },
        },
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
      },
    });
  }

  /**
   * Listar todas as solicitações com filtros
   */
  async findAll(
    institutionId?: string,
    teacherId?: string,
    status?: RequestStatus,
  ) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (institutionId) {
      where.class = {
        institutionId,
      };
    }

    return this.prisma.classSubjectRequest.findMany({
      where,
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
            color: true,
          },
        },
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
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Buscar solicitação por ID
   */
  async findOne(id: string) {
    const request = await this.prisma.classSubjectRequest.findUnique({
      where: { id },
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
            color: true,
          },
        },
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
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    return request;
  }

  /**
   * Aprovar solicitação e criar ClassSubject
   */
  async approve(id: string, reviewedById: string, weeklyHours?: number) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Apenas solicitações pendentes podem ser aprovadas');
    }

    // Verificar se ainda não existe atribuição
    const existingAssignment = await this.prisma.classSubject.findUnique({
      where: {
        classId_subjectId: {
          classId: request.classId,
          subjectId: request.subjectId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'Esta disciplina já possui um professor atribuído',
      );
    }

    // Criar atribuição e atualizar solicitação em uma transação
    return this.prisma.$transaction(async (tx) => {
      // Criar ClassSubject
      await tx.classSubject.create({
        data: {
          classId: request.classId,
          subjectId: request.subjectId,
          teacherId: request.teacherId,
          weeklyHours,
        },
      });

      // Atualizar solicitação
      return tx.classSubjectRequest.update({
        where: { id },
        data: {
          status: RequestStatus.APPROVED,
          reviewedById,
          reviewedAt: new Date(),
        },
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
          teacher: {
            include: {
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
    });
  }

  /**
   * Rejeitar solicitação
   */
  async reject(id: string, reviewedById: string, rejectDto: RejectRequestDto) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Apenas solicitações pendentes podem ser rejeitadas');
    }

    return this.prisma.classSubjectRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: rejectDto.rejectionReason,
      },
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
          },
        },
        teacher: {
          include: {
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
   * Cancelar solicitação (Professor)
   */
  async cancel(id: string, teacherId: string) {
    const request = await this.findOne(id);

    if (request.teacherId !== teacherId) {
      throw new BadRequestException(
        'Você só pode cancelar suas próprias solicitações',
      );
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Apenas solicitações pendentes podem ser canceladas');
    }

    await this.prisma.classSubjectRequest.delete({
      where: { id },
    });

    return { message: 'Solicitação cancelada com sucesso' };
  }
}
