import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, BulkGradeDto, UpdateGradeDto } from './dto';
import { GradeStatus, UserRole } from '@prisma/client';
import { RankingsService } from '../rankings/rankings.service';
import { AchievementsService } from '../achievements/achievements.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rankingsService: RankingsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  /**
   * Cria nota individual
   */
  async create(
    createGradeDto: CreateGradeDto,
    currentUser?: CurrentUserPayload,
  ) {
    const {
      studentId,
      classSubjectId,
      academicPeriodId,
      teacherId,
      value,
      weight,
      examType,
      examDate,
      description,
      observations,
    } = createGradeDto;

    // Valida entidades
    await this.validateEntities(
      studentId,
      classSubjectId,
      academicPeriodId,
      teacherId,
      currentUser,
    );

    const grade = await this.prisma.grade.create({
      data: {
        studentId,
        classSubjectId,
        academicPeriodId,
        teacherId,
        value,
        weight: weight || 1.0,
        examType,
        examDate: examDate ? new Date(examDate) : null,
        description,
        observations,
        isVisibleToStudents: false,
      },
      include: {
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        classSubject: {
          select: {
            id: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
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
                id: true,
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Adicionar pontos ao ranking (assíncrono, não bloqueia)
    this.addGradePoints(grade.id, studentId, value).catch((error) => {
      console.error('Erro ao adicionar pontos da nota:', error);
    });

    return grade;
  }

  /**
   * Adiciona pontos de uma nota ao ranking do aluno
   */
  private async addGradePoints(
    gradeId: string,
    studentId: string,
    gradeValue: number,
  ) {
    // Calcular pontos: nota * 10 (nota 10 = 100 pontos, nota 5 = 50 pontos)
    const points = Math.round(gradeValue * 10);

    // Adicionar pontos
    await this.rankingsService.addPoints(
      studentId,
      points,
      'grade',
      `Nota ${gradeValue.toFixed(1)} registrada`,
      { gradeId, gradeValue },
    );

    // Verificar conquistas (nota 10, etc.)
    await this.achievementsService.checkAndUnlockBadges(studentId);
  }

  /**
   * Cria notas em lote
   */
  async createBulk(
    bulkGradeDto: BulkGradeDto,
    currentUser?: CurrentUserPayload,
  ) {
    const {
      classSubjectId,
      academicPeriodId,
      teacherId,
      examType,
      weight,
      examDate,
      description,
      grades,
    } = bulkGradeDto;

    // Valida disciplina e professor
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      select: {
        id: true,
        classId: true,
        teacherId: true,
        class: {
          select: {
            academicYearId: true,
          },
        },
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    if (!currentUser?.teacherId || currentUser.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Você só pode lançar notas usando o seu próprio perfil de professor',
      );
    }

    if (classSubject.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Você não está vinculado à disciplina selecionada nesta turma',
      );
    }

    // Valida período letivo
    const academicPeriod = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });

    if (!academicPeriod) {
      throw new NotFoundException('Período letivo não encontrado');
    }

    if (academicPeriod.academicYearId !== classSubject.class.academicYearId) {
      throw new BadRequestException(
        'O período acadêmico não pertence ao ano letivo da turma',
      );
    }

    // Valida que todos os alunos estão matriculados
    const studentIds = grades.map((g) => g.studentId);
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId: classSubject.classId,
        studentId: { in: studentIds },
        isActive: true,
      },
    });

    if (enrollments.length !== studentIds.length) {
      throw new BadRequestException(
        'Um ou mais alunos não estão matriculados na turma',
      );
    }

    // Cria notas em transação
    const parsedExamDate = examDate ? new Date(examDate) : null;
    const createdGrades = await this.prisma.$transaction(
      grades.map((grade) =>
        this.prisma.grade.create({
          data: {
            studentId: grade.studentId,
            classSubjectId,
            academicPeriodId,
            teacherId,
            value: grade.value,
            weight: weight || 1.0,
            examType,
            examDate: parsedExamDate,
            description,
            observations: grade.observations,
            isVisibleToStudents: false,
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
            classSubject: {
              select: {
                id: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    color: true,
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
        }),
      ),
    );

    return {
      total: createdGrades.length,
      grades: createdGrades,
    };
  }

  /**
   * Valida entidades relacionadas
   */
  private async validateEntities(
    studentId: string,
    classSubjectId: string,
    academicPeriodId: string,
    teacherId: string,
    currentUser?: CurrentUserPayload,
  ): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    const academicPeriod = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });

    if (!academicPeriod) {
      throw new NotFoundException('Período letivo não encontrado');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    if (!currentUser?.teacherId || currentUser.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Você só pode lançar notas usando o seu próprio perfil de professor',
      );
    }

    if (classSubject.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Você não está vinculado à disciplina selecionada nesta turma',
      );
    }

    // Valida se aluno está matriculado na turma
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        classId: classSubject.classId,
        isActive: true,
      },
    });

    if (!enrollment) {
      throw new BadRequestException('Aluno não está matriculado na turma');
    }
  }

  /**
   * Lista notas com filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    studentId?: string,
    classSubjectId?: string,
    academicPeriodId?: string,
    teacherId?: string,
    status?: GradeStatus,
    currentUser?: CurrentUserPayload,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (classSubjectId) {
      where.classSubjectId = classSubjectId;
    }

    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (status) {
      where.status = status;
    }

    if (currentUser?.role === UserRole.PARENT) {
      if (!currentUser.parentId) {
        throw new ForbiddenException(
          'Responsável sem vínculo de acesso configurado',
        );
      }

      // O responsável só pode consultar notas de alunos vinculados ao
      // próprio perfil, mesmo que tente trocar o studentId na URL.
      where.student = {
        parents: {
          some: { parentId: currentUser.parentId },
        },
      };
      where.isVisibleToStudents = true;
    } else if (currentUser?.role === UserRole.STUDENT) {
      where.isVisibleToStudents = true;
    }

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          student: {
            select: {
              id: true,
              enrollmentNumber: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          classSubject: {
            select: {
              id: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true,
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
      }),
      this.prisma.grade.count({ where }),
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
   * Busca nota por ID
   */
  async findOne(id: string) {
    const grade = await this.prisma.grade.findUnique({
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
        classSubject: {
          select: {
            id: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
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

    if (!grade) {
      throw new NotFoundException('Nota não encontrada');
    }

    return grade;
  }

  /**
   * Busca notas do aluno com cálculo de médias
   */
  async findByStudent(studentId: string, currentUser?: CurrentUserPayload) {
    if (
      currentUser?.role === UserRole.STUDENT &&
      currentUser.studentId !== studentId
    ) {
      throw new BadRequestException(
        'Você só pode consultar suas próprias notas',
      );
    }

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

    // Busca todas as notas do aluno
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        ...(currentUser?.role === UserRole.STUDENT ||
        currentUser?.role === UserRole.PARENT
          ? { isVisibleToStudents: true }
          : {}),
      },
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
        academicPeriod: {
          select: {
            id: true,
            name: true,
            orderNumber: true,
          },
        },
      },
      orderBy: { examDate: 'desc' },
    });

    // Calcula médias por disciplina e período
    const subjectPeriodStats: any = {};

    for (const grade of grades) {
      const key = `${grade.classSubject.subject.id}-${grade.academicPeriodId}`;

      if (!subjectPeriodStats[key]) {
        subjectPeriodStats[key] = {
          subject: grade.classSubject.subject,
          academicPeriod: grade.academicPeriod,
          grades: [],
          totalWeightedValue: 0,
          totalWeight: 0,
          average: 0,
        };
      }

      subjectPeriodStats[key].grades.push(grade);
      subjectPeriodStats[key].totalWeightedValue += grade.value * grade.weight;
      subjectPeriodStats[key].totalWeight += grade.weight;
    }

    // Calcula média ponderada
    Object.values(subjectPeriodStats).forEach((stats: any) => {
      stats.average = Number(
        (stats.totalWeightedValue / stats.totalWeight).toFixed(2),
      );
    });

    return {
      student: {
        id: student.id,
        enrollmentNumber: student.enrollmentNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
      },
      gradesBySubjectPeriod: Object.values(subjectPeriodStats),
      allGrades: grades,
    };
  }

  /**
   * Atualiza nota
   */
  async update(
    id: string,
    updateGradeDto: UpdateGradeDto,
    currentUser: CurrentUserPayload,
  ) {
    const existingGrade = await this.findOne(id);
    this.ensureTeacherCanManage(existingGrade.teacherId, currentUser);

    const { examDate, ...data } = updateGradeDto;

    return this.prisma.grade.update({
      where: { id },
      data: {
        ...data,
        examDate: examDate ? new Date(examDate) : undefined,
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
        classSubject: {
          select: {
            id: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
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
        },
        academicPeriod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStudentVisibility(
    id: string,
    isVisibleToStudents: boolean,
    currentUser: CurrentUserPayload,
  ) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      select: { id: true, teacherId: true },
    });

    if (!grade) {
      throw new NotFoundException('Nota não encontrada');
    }

    if (currentUser.teacherId !== grade.teacherId) {
      throw new BadRequestException(
        'Você só pode alterar a visibilidade das suas próprias notas',
      );
    }

    return this.prisma.grade.update({
      where: { id },
      data: { isVisibleToStudents },
    });
  }

  /**
   * Publica nota (torna visível para aluno)
   */
  async publish(id: string, currentUser: CurrentUserPayload) {
    const grade = await this.findOne(id);
    this.ensureTeacherCanManage(grade.teacherId, currentUser);

    if (
      grade.status === GradeStatus.PUBLISHED ||
      grade.status === GradeStatus.FINAL
    ) {
      throw new BadRequestException('Nota já foi publicada');
    }

    if (!grade.isVisibleToStudents) {
      throw new BadRequestException(
        'Ative a opção “Mostrar para alunos” antes de publicar esta nota',
      );
    }

    return this.prisma.grade.update({
      where: { id },
      data: {
        status: GradeStatus.PUBLISHED,
        publishedAt: new Date(),
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
    });
  }

  /**
   * Remove nota
   */
  async remove(id: string, currentUser: CurrentUserPayload) {
    const grade = await this.findOne(id);
    this.ensureTeacherCanManage(grade.teacherId, currentUser);

    return this.prisma.grade.delete({
      where: { id },
    });
  }

  private ensureTeacherCanManage(
    teacherId: string,
    currentUser: CurrentUserPayload,
  ) {
    if (
      currentUser.role === UserRole.TEACHER &&
      currentUser.teacherId !== teacherId
    ) {
      throw new ForbiddenException(
        'Você só pode gerenciar as notas das suas próprias turmas',
      );
    }
  }
}
