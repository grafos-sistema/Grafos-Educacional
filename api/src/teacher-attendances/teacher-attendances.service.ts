import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherAttendanceDto } from './dto';

@Injectable()
export class TeacherAttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar registro de presença do professor
   */
  async create(dto: CreateTeacherAttendanceDto) {
    // Validar acesso do professor à turma/disciplina
    await this.validateTeacherClassAccess(
      dto.teacherId,
      dto.classId,
      dto.classSubjectId,
    );

    // Verificar se já existe registro para esta data
    const existing = await this.prisma.teacherAttendance.findFirst({
      where: {
        teacherId: dto.teacherId,
        classSubjectId: dto.classSubjectId,
        date: new Date(dto.date),
      },
    });

    if (existing) {
      // Retornar o registro existente ao invés de erro (para evitar problema no bulk)
      return existing;
    }

    // Criar registro
    return await this.prisma.teacherAttendance.create({
      data: {
        teacherId: dto.teacherId,
        classId: dto.classId,
        classSubjectId: dto.classSubjectId,
        date: new Date(dto.date),
        notes: dto.notes,
      },
      include: {
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
        class: {
          select: {
            name: true,
          },
        },
        classSubject: {
          include: {
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Buscar registros de um professor com filtros
   */
  async findByTeacher(
    teacherId: string,
    filters?: { month?: number; year?: number; classSubjectId?: string },
  ) {
    const where: any = { teacherId };

    // Filtro por mês/ano
    if (filters?.month || filters?.year) {
      const year = filters.year || new Date().getFullYear();
      const month = filters.month || 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Filtro por disciplina
    if (filters?.classSubjectId) {
      where.classSubjectId = filters.classSubjectId;
    }

    return await this.prisma.teacherAttendance.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
          },
        },
        classSubject: {
          include: {
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Buscar grade horária do professor
   */
  async getTeacherSchedule(teacherId: string) {
    // Buscar todas as disciplinas que o professor leciona
    const classSubjects = await this.prisma.classSubject.findMany({
      where: {
        teacherId,
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
            name: true,
          },
        },
        schedules: true,
      },
    });

    // Transformar em lista de horários
    const schedule: Array<{
      classId: string;
      className: string;
      classSubjectId: string;
      subjectName: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string | null;
    }> = [];

    for (const cs of classSubjects) {
      for (const sched of cs.schedules) {
        schedule.push({
          classId: cs.class.id,
          className: cs.class.name,
          classSubjectId: cs.id,
          subjectName: cs.subject.name,
          dayOfWeek: sched.dayOfWeek,
          startTime: sched.startTime,
          endTime: sched.endTime,
          room: sched.room,
        });
      }
    }

    return schedule;
  }

  /**
   * Buscar estatísticas de presença do professor
   */
  async getTeacherStats(
    teacherId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { teacherId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendances = await this.prisma.teacherAttendance.findMany({
      where,
    });

    const total = attendances.length;
    const byMonth = {};

    attendances.forEach((att) => {
      const month = new Date(att.date).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
      });
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    return {
      total,
      byMonth,
    };
  }

  /**
   * Validar se professor tem acesso à turma/disciplina
   */
  private async validateTeacherClassAccess(
    teacherId: string,
    classId: string,
    classSubjectId: string,
  ): Promise<void> {
    // Verificar se professor está vinculado via ClassSubject
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        classId,
        teacherId,
      },
    });

    if (classSubject) {
      return; // Acesso autorizado
    }

    // Verificar se professor tem a disciplina configurada (TeacherSubject)
    const csWithSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: { subject: true },
    });

    if (csWithSubject) {
      const teacherSubject = await this.prisma.teacherSubject.findFirst({
        where: {
          teacherId,
          subjectId: csWithSubject.subjectId,
        },
      });

      if (teacherSubject) {
        return; // Acesso autorizado via TeacherSubject
      }
    }

    throw new ForbiddenException(
      'Professor não está autorizado a registrar presença nesta turma/disciplina',
    );
  }
}
