import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAttendanceDto,
  BulkAttendanceDto,
  UpdateAttendanceDto,
} from './dto';
import { AttendanceStatus, DayOfWeek, UserRole } from '@prisma/client';
import { RankingsService } from '../rankings/rankings.service';
import { AchievementsService } from '../achievements/achievements.service';
import { TeacherAttendancesService } from '../teacher-attendances/teacher-attendances.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

type AttendanceActor = Pick<
  CurrentUserPayload,
  'userId' | 'role' | 'teacherId' | 'institutionId'
>;

const DAY_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

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
  async create(
    createAttendanceDto: CreateAttendanceDto,
    actor: AttendanceActor,
  ) {
    const {
      studentId,
      classId,
      classSubjectId,
      teacherId,
      date,
      status,
      notes,
      classScheduleId,
      authorizationReason,
    } = createAttendanceDto;

    const parsedDate = this.parseLocalDate(date);
    const session = await this.resolveSession(
      classId,
      classSubjectId,
      teacherId,
      date,
      classScheduleId,
      authorizationReason,
      actor,
    );
    await this.validateStudentEnrollment(studentId, classId);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId,
        classSubjectId,
        classScheduleId: session.schedule?.id ?? null,
        date: parsedDate,
      },
    });

    if (existingAttendance) {
      throw new ConflictException(
        'Já existe frequência deste aluno para esta aula e data',
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
        classScheduleId: session.schedule?.id ?? null,
        academicPeriodId: session.period.id,
        authorizationReason: session.authorizationReason,
        authorizedById: session.authorizedById,
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
  async createBulk(
    bulkAttendanceDto: BulkAttendanceDto,
    actor: AttendanceActor,
  ) {
    const {
      classId,
      classSubjectId,
      teacherId,
      date,
      attendances,
      classScheduleId,
      authorizationReason,
    } = bulkAttendanceDto;
    const parsedDate = this.parseLocalDate(date);
    const session = await this.resolveSession(
      classId,
      classSubjectId,
      teacherId,
      date,
      classScheduleId,
      authorizationReason,
      actor,
    );

    if (attendances.length === 0) {
      throw new BadRequestException('Nenhuma frequência foi informada');
    }

    const studentIds = [...new Set(attendances.map((a) => a.studentId))];
    if (studentIds.length !== attendances.length) {
      throw new BadRequestException(
        'Cada aluno deve aparecer apenas uma vez nesta aula',
      );
    }

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId, studentId: { in: studentIds }, isActive: true },
      select: { studentId: true },
    });

    if (enrollments.length !== studentIds.length) {
      throw new BadRequestException(
        'Um ou mais alunos não estão matriculados na turma',
      );
    }

    await this.prisma.attendance.deleteMany({
      where: {
        classSubjectId,
        date: parsedDate,
        classScheduleId: session.schedule?.id ?? null,
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
            classScheduleId: session.schedule?.id ?? null,
            academicPeriodId: session.period.id,
            authorizationReason: session.authorizationReason,
            authorizedById: session.authorizedById,
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
      if (session.schedule) {
        await this.teacherAttendancesService.create({
          teacherId,
          classId,
          classSubjectId,
          classScheduleId: session.schedule.id,
          date,
        });
      }
    } catch (error) {
      // Ignorar apenas erro de unique constraint (registro já existe)
      if (error?.code !== 'P2002') {
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

  private parseLocalDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      !year ||
      !month ||
      !day ||
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      throw new BadRequestException('Data da aula inválida');
    }
    return parsedDate;
  }

  private dateKey(value: Date): string {
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, '0'),
      String(value.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private isAdministrator(role: UserRole): boolean {
    const administratorRoles: UserRole[] = [
      UserRole.SUPER_ADMIN_GLOBAL,
      UserRole.SUPER_ADMIN,
      UserRole.DIRECTOR,
      UserRole.INSTITUTION_ADMIN,
      UserRole.COORDINATOR,
    ];
    return administratorRoles.includes(role);
  }

  private async assertInstitutionAccess(
    institutionId: string,
    actor: AttendanceActor,
  ) {
    if (actor.role === UserRole.SUPER_ADMIN_GLOBAL) return;
    if (actor.institutionId === institutionId) return;

    const linked = await this.prisma.userInstitution.findFirst({
      where: { userId: actor.userId, institutionId, isActive: true },
    });
    if (!linked) {
      throw new ForbiddenException(
        'Você não tem acesso à instituição desta turma',
      );
    }
  }

  private async resolveSession(
    classId: string,
    classSubjectId: string,
    teacherId: string,
    date: string,
    requestedScheduleId: string | undefined,
    authorizationReason: string | undefined,
    actor: AttendanceActor,
  ) {
    const parsedDate = this.parseLocalDate(date);
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        class: {
          select: {
            id: true,
            institutionId: true,
            academicYearId: true,
            academicYear: {
              select: {
                periods: {
                  orderBy: { orderNumber: 'asc' },
                },
              },
            },
          },
        },
        teacher: { select: { id: true } },
        schedules: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }
    if (classSubject.classId !== classId) {
      throw new BadRequestException('Disciplina não pertence à turma');
    }
    await this.assertInstitutionAccess(classSubject.class.institutionId, actor);

    if (!classSubject.teacherId || classSubject.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Este professor não está vinculado à disciplina desta turma',
      );
    }
    if (actor.role === UserRole.TEACHER && actor.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Você só pode registrar a frequência das suas próprias aulas',
      );
    }

    const period = classSubject.class.academicYear.periods.find((item) => {
      const start = this.dateKey(item.startDate);
      const end = this.dateKey(item.endDate);
      return date >= start && date <= end;
    });
    if (!period) {
      throw new BadRequestException(
        'A data escolhida não pertence a nenhum período acadêmico da turma',
      );
    }
    if (actor.role === UserRole.TEACHER && !period.isActive) {
      throw new ForbiddenException(
        'Este período acadêmico está encerrado. Solicite autorização à direção ou à coordenação',
      );
    }

    const dayOfWeek = DAY_OF_WEEK[parsedDate.getDay()];
    const schedulesOnDay = classSubject.schedules.filter(
      (schedule) => schedule.dayOfWeek === dayOfWeek,
    );
    const requestedSchedule = requestedScheduleId
      ? classSubject.schedules.find(
          (schedule) => schedule.id === requestedScheduleId,
        )
      : undefined;

    if (requestedScheduleId && !requestedSchedule) {
      throw new BadRequestException(
        'A aula selecionada não pertence a esta disciplina',
      );
    }

    const schedule =
      requestedSchedule ??
      (schedulesOnDay.length === 1 ? schedulesOnDay[0] : undefined);
    const isRegularSession = Boolean(
      schedule && schedule.dayOfWeek === dayOfWeek,
    );
    const isException = !isRegularSession;

    if (actor.role === UserRole.TEACHER && isException) {
      throw new ForbiddenException(
        'Você só pode registrar frequência no dia e horário em que tem aula nesta turma',
      );
    }
    if (schedulesOnDay.length > 1 && !requestedSchedule && !isException) {
      throw new BadRequestException(
        'Há mais de uma aula desta disciplina neste dia. Selecione o horário específico',
      );
    }
    const cleanReason = authorizationReason?.trim();
    if (isException && !cleanReason) {
      throw new ForbiddenException(
        'Esta data está fora da grade regular. A direção ou a coordenação precisa informar uma justificativa',
      );
    }
    if (isException && !this.isAdministrator(actor.role)) {
      throw new ForbiddenException(
        'Somente a direção ou a coordenação podem autorizar frequência fora da grade',
      );
    }

    return {
      schedule: schedule && isRegularSession ? schedule : undefined,
      period,
      authorizationReason: isException ? cleanReason : undefined,
      authorizedById: isException ? actor.userId : undefined,
    };
  }

  private async validateStudentEnrollment(studentId: string, classId: string) {
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: { studentId, classId, isActive: true },
    });
    if (!enrollment) {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true },
      });
      if (!student) throw new NotFoundException('Aluno não encontrado');
      throw new BadRequestException('Aluno não está matriculado na turma');
    }
  }

  async getAvailability(
    classId: string,
    classSubjectId: string,
    requestedTeacherId: string | undefined,
    actor: AttendanceActor,
  ) {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            institutionId: true,
            academicYear: {
              select: {
                id: true,
                year: true,
                periods: { orderBy: { orderNumber: 'asc' } },
              },
            },
          },
        },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true } },
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    if (!classSubject || classSubject.classId !== classId) {
      throw new NotFoundException('Turma ou disciplina não encontrada');
    }
    await this.assertInstitutionAccess(classSubject.class.institutionId, actor);
    const teacherId = requestedTeacherId || classSubject.teacherId;
    if (!teacherId || classSubject.teacherId !== teacherId) {
      throw new ForbiddenException(
        'O professor ainda não está vinculado a esta disciplina da turma',
      );
    }
    if (actor.role === UserRole.TEACHER && actor.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Você só pode consultar a disponibilidade das suas próprias aulas',
      );
    }
    return {
      class: {
        id: classSubject.class.id,
        name: classSubject.class.name,
      },
      classSubjectId,
      teacherId,
      academicYear: classSubject.class.academicYear,
      subject: classSubject.subject,
      schedules: classSubject.schedules,
    };
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
    academicPeriodId?: string,
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

    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { date: 'desc' },
          { student: { user: { firstName: 'asc' } } },
        ],
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
            institutionId: true,
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
  async update(
    id: string,
    updateAttendanceDto: UpdateAttendanceDto,
    actor: AttendanceActor,
  ) {
    const existing = await this.findOne(id);
    await this.assertInstitutionAccess(existing.class.institutionId, actor);
    if (
      actor.role === UserRole.TEACHER &&
      actor.teacherId !== existing.teacherId
    ) {
      throw new ForbiddenException(
        'Você só pode atualizar frequências das suas próprias aulas',
      );
    }

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
  async remove(id: string, actor: AttendanceActor) {
    const existing = await this.findOne(id);
    await this.assertInstitutionAccess(existing.class.institutionId, actor);
    if (
      actor.role === UserRole.TEACHER &&
      actor.teacherId !== existing.teacherId
    ) {
      throw new ForbiddenException(
        'Você só pode remover frequências das suas próprias aulas',
      );
    }

    return this.prisma.attendance.delete({
      where: { id },
    });
  }
}
