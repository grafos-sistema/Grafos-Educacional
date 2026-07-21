import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova turma
   */
  async create(createClassDto: CreateClassDto) {
    const {
      institutionId,
      courseId,
      academicYearId,
      mainTeacherId,
      ...data
    } = createClassDto;

    // Verifica se instituição existe e está ativa
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada');
    }

    if (!institution.isActive) {
      throw new BadRequestException('Instituição não está ativa');
    }

    // Verifica se curso existe, está ativo e pertence à instituição
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (!course.isActive) {
      throw new BadRequestException('Curso não está ativo');
    }

    if (course.institutionId !== institutionId) {
      throw new BadRequestException('Curso não pertence à instituição');
    }

    // Verifica se ano letivo existe, está ativo e pertence à instituição
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      throw new NotFoundException('Ano letivo não encontrado');
    }

    if (!academicYear.isActive) {
      throw new BadRequestException('Ano letivo não está ativo');
    }

    if (academicYear.institutionId !== institutionId) {
      throw new BadRequestException('Ano letivo não pertence à instituição');
    }

    // Verifica professor titular se fornecido
    if (mainTeacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: mainTeacherId },
        include: {
          user: {
            select: {
              institutionId: true,
              isActive: true,
            },
          },
        },
      });

      if (!teacher) {
        throw new NotFoundException('Professor titular não encontrado');
      }

      if (!teacher.isActive || !teacher.user.isActive) {
        throw new BadRequestException('Professor titular não está ativo');
      }

      if (teacher.user.institutionId !== institutionId) {
        throw new BadRequestException(
          'Professor titular não pertence à instituição',
        );
      }
    }

    return this.prisma.class.create({
      data: {
        ...data,
        institutionId,
        courseId,
        academicYearId,
        mainTeacherId,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        mainTeacher: {
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
        _count: {
          select: {
            enrollments: true,
            subjects: true,
            schedules: true,
          },
        },
      },
    });
  }

  /**
   * Lista todas as turmas com paginação e filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    institutionId?: string,
    courseId?: string,
    academicYearId?: string,
    grade?: string,
    shift?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (grade) {
      where.grade = { contains: grade, mode: 'insensitive' };
    }

    if (shift) {
      where.shift = shift;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ grade: 'asc' }, { section: 'asc' }],
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          academicYear: {
            select: {
              id: true,
              year: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          mainTeacher: {
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
          _count: {
            select: {
              enrollments: true,
              subjects: true,
              schedules: true,
            },
          },
        },
      }),
      this.prisma.class.count({ where }),
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
   * Busca uma turma por ID
   */
  async findOne(id: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        mainTeacher: {
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
        _count: {
          select: {
            enrollments: true,
            subjects: true,
            schedules: true,
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    return classEntity;
  }

  /**
   * Lista alunos matriculados na turma
   */
  async findStudents(classId: string) {
    // Verifica se turma existe
    await this.findOne(classId);

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId,
        isActive: true,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                cpf: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            firstName: 'asc',
          },
        },
      },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      enrollmentDate: enrollment.enrollmentDate,
      isActive: enrollment.isActive,
      studentId: enrollment.studentId,
      student: {
        id: enrollment.student.id,
        userId: enrollment.student.userId,
        registrationNumber: enrollment.student.registrationNumber,
        enrollmentNumber: enrollment.student.enrollmentNumber,
        isActive: enrollment.student.isActive,
        firstName: enrollment.student.user.firstName,
        lastName: enrollment.student.user.lastName,
        email: enrollment.student.user.email,
        cpf: enrollment.student.user.cpf,
        avatar: enrollment.student.user.avatar,
      },
    }));
  }

  /**
   * Lista disciplinas da turma
   */
  async findSubjects(classId: string) {
    // Verifica se turma existe
    await this.findOne(classId);

    const classSubjects = await this.prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            description: true,
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
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });

    return classSubjects.map((cs) => ({
      id: cs.id,
      classId: cs.classId,
      subjectId: cs.subjectId,
      teacherId: cs.teacherId,
      weeklyHours: cs.weeklyHours,
      subject: cs.subject,
      teacher: cs.teacher,
    }));
  }

  /**
   * Lista grade horária da turma
   */
  async findSchedule(classId: string) {
    // Verifica se turma existe
    await this.findOne(classId);

    const schedules = await this.prisma.classSchedule.findMany({
      where: { classId },
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
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return schedules.map((schedule) => ({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
      subject: schedule.classSubject.subject,
      teacher: schedule.classSubject.teacher,
    }));
  }

  /**
   * Atualiza uma turma
   */
  async update(id: string, updateClassDto: UpdateClassDto) {
    // Verifica se turma existe
    const existingClass = await this.findOne(id);

    // Valida professor titular se fornecido na atualização
    if (updateClassDto.mainTeacherId !== undefined) {
      if (updateClassDto.mainTeacherId) {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: updateClassDto.mainTeacherId },
          include: {
            user: {
              select: {
                institutionId: true,
                isActive: true,
              },
            },
          },
        });

        if (!teacher) {
          throw new NotFoundException('Professor titular não encontrado');
        }

        if (!teacher.isActive || !teacher.user.isActive) {
          throw new BadRequestException('Professor titular não está ativo');
        }

        if (teacher.user.institutionId !== existingClass.institutionId) {
          throw new BadRequestException(
            'Professor titular não pertence à instituição',
          );
        }
      }
    }

    return this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        mainTeacher: {
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
        _count: {
          select: {
            enrollments: true,
            subjects: true,
            schedules: true,
          },
        },
      },
    });
  }

  /**
   * Remove uma turma (soft delete)
   */
  async remove(id: string) {
    // Verifica se turma existe
    await this.findOne(id);

    // Verifica se há matrículas ativas
    const activeEnrollments = await this.prisma.classEnrollment.count({
      where: {
        classId: id,
        isActive: true,
      },
    });

    if (activeEnrollments > 0) {
      throw new BadRequestException(
        `Não é possível excluir turma com ${activeEnrollments} matrícula(s) ativa(s)`,
      );
    }

    return this.prisma.class.update({
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
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
  }
}
