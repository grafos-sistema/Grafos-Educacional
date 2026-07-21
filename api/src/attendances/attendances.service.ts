import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAttendanceDto,
  BulkAttendanceDto,
  UpdateAttendanceDto,
} from './dto';
import { AttendanceStatus } from '@prisma/client';
import { RankingsService } from '../rankings/rankings.service';
import { AchievementsService } from '../achievements/achievements.service';
import { TeacherAttendancesService } from '../teacher-attendances/teacher-attendances.service';

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rankingsService: RankingsService,
    private readonly achievementsService: AchievementsService,
    private readonly teacherAttendancesService: TeacherAttendancesService,
  ) {}

  /**
   * Cria registro de frequência individual
   */
  async create(createAttendanceDto: CreateAttendanceDto) {
    const {
      studentId,
      classId,
      classSubjectId,
      teacherId,
      date,
      status,
      notes,
    } = createAttendanceDto;

    // Parse da data como local timezone
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Meio-dia para evitar problemas de timezone

    // Valida entidades relacionadas
    await this.validateEntities(
      studentId,
      classId,
      classSubjectId,
      teacherId,
    );

    // Verifica se já existe registro de frequência para este aluno, disciplina e data
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId,
        classSubjectId,
        date: parsedDate,
      },
    });

    if (existingAttendance) {
      throw new ConflictException(
        'Já existe registro de frequência para este aluno nesta disciplina e data',
      );
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        studentId,
        classId,
        classSubjectId,
        teacherId,
        date: parsedDate,
        status,
        notes,
      },
      include: {
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        classSubject: {
          select: {
            id: true,
            subject: {
              select: {
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
              },
            },
          },
        },
      },
    });

    // Adicionar pontos se estiver presente
    if (status === AttendanceStatus.PRESENT) {
      this.addAttendancePoints(attendance.id, studentId).catch((error) => {
        console.error('Erro ao adicionar pontos de presença:', error);
      });
    }

    return attendance;
  }

  /**
   * Adiciona pontos de presença ao ranking do aluno
   */
  private async addAttendancePoints(attendanceId: string, studentId: string) {
    const points = 10; // 10 pontos por presença

    // Adicionar pontos
    await this.rankingsService.addPoints(
      studentId,
      points,
      'attendance',
      'Presença registrada',
      { attendanceId },
    );

    // Verificar conquistas (100% frequência, etc.)
    await this.achievementsService.checkAndUnlockBadges(studentId);
  }

  /**
   * Cria registros de frequência em lote
   */
  async createBulk(bulkAttendanceDto: BulkAttendanceDto) {
    const { classId, classSubjectId, teacherId, date, attendances } =
      bulkAttendanceDto;

    // Parse da data como local timezone
    const [year, month, day] = date.split('-').map(Number);

    // Valida turma e disciplina
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    if (classSubject.classId !== classId) {
      throw new BadRequestException('Disciplina não pertence à turma');
    }

    // Valida professor
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    // Valida que todos os alunos estão matriculados na turma
    const studentIds = attendances.map((a) => a.studentId);
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId,
        studentId: { in: studentIds },
        isActive: true,
      },
    });

    if (enrollments.length !== studentIds.length) {
      throw new BadRequestException(
        'Um ou mais alunos não estão matriculados na turma',
      );
    }

    // Remove registros existentes para esta data (permitir atualização)
    // Parse da data como local timezone para evitar problemas de UTC
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Meio-dia para evitar problemas de timezone

    await this.prisma.attendance.deleteMany({
      where: {
        classSubjectId,
        date: parsedDate,
        studentId: { in: studentIds },
      },
    });

    // Cria registros em transação
    const createdAttendances = await this.prisma.$transaction(
      attendances.map((attendance) =>
        this.prisma.attendance.create({
          data: {
            studentId: attendance.studentId,
            classId,
            classSubjectId,
            teacherId,
            date: parsedDate,
            status: attendance.status,
            notes: attendance.notes,
          },
          include: {
            student: {
              select: {
                id: true,
                enrollmentNumber: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        }),
      ),
    );

    // Registrar presença do professor automaticamente
    try {
      await this.teacherAttendancesService.create({
        teacherId,
        classId,
        classSubjectId,
        date,
      });
    } catch (error) {
      // Ignorar apenas erro de unique constraint (registro já existe)
      if (error.code !== 'P2002') {
        console.error('Erro ao registrar presença do professor:', error);
        // Não bloqueia o fluxo, mas registra o erro para investigação
      }
    }

    // Adicionar pontos de gamificação para alunos presentes (processamento em batch)
    const presentAttendances = createdAttendances.filter(
      (att) => att.status === AttendanceStatus.PRESENT,
    );

    if (presentAttendances.length > 0) {
      // Processar pontos em paralelo (não bloquear resposta)
      Promise.all(
        presentAttendances.map((att) =>
          this.addAttendancePoints(att.id, att.studentId).catch((error) => {
            console.error(
              `Erro ao adicionar pontos para aluno ${att.studentId}:`,
              error,
            );
          }),
        ),
      ).catch((error) => {
        console.error('Erro ao processar pontos em batch:', error);
      });
    }

    return {
      total: createdAttendances.length,
      attendances: createdAttendances,
    };
  }

  /**
   * Valida entidades relacionadas
   */
  private async validateEntities(
    studentId: string,
    classId: string,
    classSubjectId: string,
    teacherId: string,
  ): Promise<void> {
    // Valida aluno
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Valida turma
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Valida disciplina
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    if (classSubject.classId !== classId) {
      throw new BadRequestException('Disciplina não pertence à turma');
    }

    // Valida professor
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    // Valida se aluno está matriculado na turma
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        classId,
        isActive: true,
      },
    });

    if (!enrollment) {
      throw new BadRequestException('Aluno não está matriculado na turma');
    }
  }

  /**
   * Lista frequências com filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    classId?: string,
    classSubjectId?: string,
    studentId?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
    status?: AttendanceStatus,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (classId) {
      where.classId = classId;
    }

    if (classSubjectId) {
      where.classSubjectId = classSubjectId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (date) {
      // Parse data como local timezone
      const [year, month, day] = date.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      where.date = parsedDate;
    } else if (startDate || endDate) {
      // Filtro por período
      where.date = {};
      if (startDate) {
        const [year, month, day] = startDate.split('-').map(Number);
        // Início do dia (00:00:00)
        where.date.gte = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      if (endDate) {
        const [year, month, day] = endDate.split('-').map(Number);
        // Fim do dia (23:59:59)
        where.date.lte = new Date(year, month - 1, day, 23, 59, 59, 999);
      }
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { student: { user: { firstName: 'asc' } } }],
        include: {
          student: {
            select: {
              id: true,
              enrollmentNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          classSubject: {
            select: {
              id: true,
              subject: {
                select: {
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
                },
              },
            },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
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
   * Gera relatório de frequência do aluno
   */
  async getStudentReport(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Busca todas as frequências do aluno
    const attendances = await this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        classSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calcula estatísticas por disciplina
    const subjectStats: any = {};

    for (const attendance of attendances) {
      const subjectId = attendance.classSubject.subject.id;

      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          subject: attendance.classSubject.subject,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
        };
      }

      subjectStats[subjectId].total++;
      subjectStats[subjectId][attendance.status.toLowerCase()]++;
    }

    // Calcula taxa de presença por disciplina
    Object.values(subjectStats).forEach((stats: any) => {
      stats.attendanceRate = Number(
        ((stats.present / stats.total) * 100).toFixed(2),
      );
    });

    // Estatísticas gerais
    const totalAttendances = attendances.length;
    const presentCount = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    const absentCount = attendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;
    const lateCount = attendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    const excusedCount = attendances.filter(
      (a) => a.status === AttendanceStatus.EXCUSED,
    ).length;

    const overallAttendanceRate =
      totalAttendances > 0
        ? Number(((presentCount / totalAttendances) * 100).toFixed(2))
        : 0;

    return {
      student: {
        id: student.id,
        enrollmentNumber: student.enrollmentNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
      },
      overall: {
        total: totalAttendances,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendanceRate: overallAttendanceRate,
      },
      bySubject: Object.values(subjectStats),
      recentAttendances: attendances.slice(0, 10),
    };
  }

  /**
   * Busca frequência por ID
   */
  async findOne(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        classSubject: {
          select: {
            id: true,
            subject: {
              select: {
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
              },
            },
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Registro de frequência não encontrado');
    }

    return attendance;
  }

  /**
   * Atualiza registro de frequência
   */
  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    await this.findOne(id);

    return this.prisma.attendance.update({
      where: { id },
      data: updateAttendanceDto,
      include: {
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        classSubject: {
          select: {
            id: true,
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Buscar histórico de frequência do aluno com filtros
   */
  async getStudentHistory(
    studentId: string,
    filters?: { month?: number; year?: number; classSubjectId?: string },
  ) {
    const where: any = { studentId };

    // Filtro por disciplina
    if (filters?.classSubjectId) {
      where.classSubjectId = filters.classSubjectId;
    }

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

    // Buscar frequências
    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        classSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            class: {
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

    // Agrupar por disciplina
    const bySubject: any = {};
    for (const att of attendances) {
      const subjectId = att.classSubject.subject.id;
      if (!bySubject[subjectId]) {
        bySubject[subjectId] = {
          subject: att.classSubject.subject,
          className: att.classSubject.class.name,
          attendances: [],
          stats: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          },
        };
      }

      bySubject[subjectId].attendances.push({
        id: att.id,
        date: att.date,
        status: att.status,
        notes: att.notes,
      });

      bySubject[subjectId].stats[att.status.toLowerCase()]++;
      bySubject[subjectId].stats.total++;
    }

    return {
      filters,
      data: Object.values(bySubject),
    };
  }

  /**
   * Remove registro de frequência
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.attendance.delete({
      where: { id },
    });
  }
}
