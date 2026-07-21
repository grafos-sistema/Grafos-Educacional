import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo aluno
   */
  async create(createStudentDto: CreateStudentDto) {
    const { userId, institutionId, admissionDate, enrollmentNumber, ...data } =
      createStudentDto;

    // Verifica se usuário existe e tem role STUDENT
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role !== UserRole.STUDENT) {
      throw new BadRequestException('Usuário deve ter role STUDENT');
    }

    if (user.institutionId !== institutionId) {
      throw new BadRequestException(
        'Instituição do aluno deve ser a mesma do usuário',
      );
    }

    // Verifica se já existe registro de aluno para este usuário
    const existingStudent = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (existingStudent) {
      throw new ConflictException('Já existe registro de aluno para este usuário');
    }

    // Verifica se número de matrícula já existe na instituição
    const existingEnrollment = await this.prisma.student.findFirst({
      where: {
        registrationNumber: enrollmentNumber,
        user: {
          institutionId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Número de matrícula já está em uso');
    }

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

    // Converte admissionDate string para Date se fornecido
    const parsedAdmissionDate = admissionDate ? new Date(admissionDate) : undefined;

    return this.prisma.student.create({
      data: {
        ...data,
        registrationNumber: enrollmentNumber,
        userId,
        ...(parsedAdmissionDate && { enrollmentDate: parsedAdmissionDate }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            birthDate: true,
            institutionId: true,
            institution: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            classEnrollments: true,
            grades: true,
            attendances: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos os alunos com paginação e filtros
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
      where.user = {
        institutionId: institutionId,
      };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              birthDate: true,
              institutionId: true,
              institution: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              classEnrollments: true,
              grades: true,
              attendances: true,
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
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
   * Busca um aluno por ID
   */
  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            cpf: true,
            phone: true,
            birthDate: true,
            avatar: true,
            institutionId: true,
            institution: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            classEnrollments: true,
            grades: true,
            attendances: true,
            parents: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    return student;
  }

  /**
   * Busca notas do aluno
   */
  async findGrades(studentId: string, academicYearId?: string) {
    // Verifica se aluno existe
    await this.findOne(studentId);

    const where: any = { studentId };

    if (academicYearId) {
      where.class = {
        academicYearId,
      };
    }

    return this.prisma.grade.findMany({
      where,
      include: {
        classSubject: {
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
        },
        academicPeriod: {
          select: {
            id: true,
            name: true,
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Busca frequências do aluno
   */
  async findAttendances(studentId: string, academicYearId?: string) {
    // Verifica se aluno existe
    await this.findOne(studentId);

    const where: any = { studentId };

    if (academicYearId) {
      where.classSubject = {
        class: {
          academicYearId,
        },
      };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Gera relatório de desempenho do aluno
   */
  async getReport(studentId: string, academicYearId?: string) {
    // Verifica se aluno existe
    const student = await this.findOne(studentId);

    // Busca todas as matrículas do aluno
    const enrollmentWhere: any = {
      studentId,
      isActive: true,
    };
    if (academicYearId) {
      enrollmentWhere.class = { academicYearId };
    }

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: enrollmentWhere,
      include: {
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    // Para cada matrícula, busca estatísticas
    const performanceByClass = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [grades, attendances] = await Promise.all([
          this.prisma.grade.findMany({
            where: {
              studentId,
              classSubject: {
                classId: enrollment.classId,
              },
            },
          }),
          this.prisma.attendance.findMany({
            where: {
              studentId,
              classId: enrollment.classId,
            },
          }),
        ]);

        // Calcula média das notas
        const totalGrade = grades.reduce((sum, g) => sum + Number(g.value), 0);
        const averageGrade = grades.length > 0 ? totalGrade / grades.length : 0;

        // Calcula taxa de presença
        const totalClasses = attendances.length;
        const presentClasses = attendances.filter(
          (a) => a.status === 'PRESENT',
        ).length;
        const attendanceRate =
          totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

        return {
          class: {
            id: enrollment.class.id,
            name: enrollment.class.name,
            academicYear: enrollment.class.academicYear,
          },
          enrollment: {
            id: enrollment.id,
            enrollmentDate: enrollment.enrollmentDate,
          },
          statistics: {
            totalGrades: grades.length,
            averageGrade: Number(averageGrade.toFixed(2)),
            totalClasses,
            presentClasses,
            attendanceRate: Number(attendanceRate.toFixed(2)),
          },
        };
      }),
    );

    // Calcula estatísticas gerais
    const allGrades = performanceByClass.flatMap((p) =>
      Array(p.statistics.totalGrades).fill(p.statistics.averageGrade),
    );
    const overallAverage =
      allGrades.length > 0
        ? allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length
        : 0;

    const totalClassesCount = performanceByClass.reduce(
      (sum, p) => sum + p.statistics.totalClasses,
      0,
    );
    const totalPresentCount = performanceByClass.reduce(
      (sum, p) => sum + p.statistics.presentClasses,
      0,
    );
    const overallAttendanceRate =
      totalClassesCount > 0 ? (totalPresentCount / totalClassesCount) * 100 : 0;

    return {
      student: {
        id: student.id,
        registrationNumber: student.registrationNumber,
        user: student.user,
      },
      overall: {
        averageGrade: Number(overallAverage.toFixed(2)),
        attendanceRate: Number(overallAttendanceRate.toFixed(2)),
        totalEnrollments: enrollments.length,
      },
      performanceByClass,
    };
  }

  /**
   * Atualiza um aluno
   */
  async update(id: string, updateStudentDto: UpdateStudentDto) {
    // Verifica se aluno existe
    await this.findOne(id);

    const { enrollmentNumber, admissionDate, ...data } = updateStudentDto;

    // Verifica número de matrícula único se fornecido
    if (enrollmentNumber) {
      const student = await this.prisma.student.findUnique({
        where: { id },
        include: { user: { select: { institutionId: true } } },
      });

      const existingEnrollment = await this.prisma.student.findFirst({
        where: {
          registrationNumber: enrollmentNumber,
          user: {
            institutionId: student!.user.institutionId,
          },
        },
      });

      if (existingEnrollment && existingEnrollment.id !== id) {
        throw new ConflictException('Número de matrícula já está em uso');
      }
    }

    // Converte admissionDate string para Date se fornecido
    const parsedAdmissionDate = admissionDate ? new Date(admissionDate) : undefined;

    return this.prisma.student.update({
      where: { id },
      data: {
        ...data,
        registrationNumber: enrollmentNumber,
        enrollmentDate: parsedAdmissionDate,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            institutionId: true,
            institution: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            classEnrollments: true,
            grades: true,
            attendances: true,
          },
        },
      },
    });
  }

  /**
   * Remove um aluno (soft delete)
   */
  async remove(id: string) {
    // Verifica se aluno existe
    await this.findOne(id);

    // Verifica se aluno tem matrículas ativas
    const activeEnrollments = await this.prisma.classEnrollment.count({
      where: {
        studentId: id,
        class: {
          isActive: true,
        },
      },
    });

    if (activeEnrollments > 0) {
      throw new BadRequestException(
        `Não é possível excluir aluno com ${activeEnrollments} matrícula(s) ativa(s)`,
      );
    }

    return this.prisma.student.update({
      where: { id },
      data: { isActive: false },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }
}
