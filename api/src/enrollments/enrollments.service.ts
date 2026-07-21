import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto, TransferEnrollmentDto } from './dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova matrícula
   */
  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { classId, studentId, enrollmentDate } = createEnrollmentDto;

    // Verifica se turma existe e está ativa
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (!classEntity.isActive) {
      throw new BadRequestException('Turma não está ativa');
    }

    // Verifica se aluno existe e está ativo
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    if (!student.isActive) {
      throw new BadRequestException('Aluno não está ativo');
    }

    // Verifica se aluno pertence à mesma instituição da turma
    if (student.user.institutionId !== classEntity.institutionId) {
      throw new BadRequestException(
        'Aluno não pertence à mesma instituição da turma',
      );
    }

    // Verifica se aluno já está matriculado na turma
    const existingEnrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        classId,
        studentId,
        isActive: true,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Aluno já está matriculado nesta turma');
    }

    // Verifica capacidade máxima da turma
    if (classEntity.maxStudents) {
      const currentEnrollments = classEntity._count.enrollments;
      if (currentEnrollments >= classEntity.maxStudents) {
        throw new BadRequestException(
          `Turma atingiu capacidade máxima de ${classEntity.maxStudents} alunos`,
        );
      }
    }

    // Cria matrícula
    return this.prisma.classEnrollment.create({
      data: {
        classId,
        studentId,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            shift: true,
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
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                cpf: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Lista todas as matrículas com paginação e filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    classId?: string,
    studentId?: string,
    institutionId?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (classId) {
      where.classId = classId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (institutionId) {
      where.class = {
        institutionId,
      };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.classEnrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrollmentDate: 'desc' },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              section: true,
              shift: true,
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
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              enrollmentNumber: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  cpf: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.classEnrollment.count({ where }),
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
   * Busca uma matrícula por ID
   */
  async findOne(id: string) {
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            shift: true,
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
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                cpf: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    return enrollment;
  }

  /**
   * Transfere aluno para outra turma
   */
  async transfer(id: string, transferDto: TransferEnrollmentDto) {
    const { newClassId } = transferDto;

    // Verifica se matrícula existe e está ativa
    const enrollment = await this.findOne(id);

    if (!enrollment.isActive) {
      throw new BadRequestException('Matrícula não está ativa');
    }

    // Verifica se nova turma existe e está ativa
    const newClass = await this.prisma.class.findUnique({
      where: { id: newClassId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!newClass) {
      throw new NotFoundException('Nova turma não encontrada');
    }

    if (!newClass.isActive) {
      throw new BadRequestException('Nova turma não está ativa');
    }

    // Verifica se é a mesma turma
    if (enrollment.classId === newClassId) {
      throw new BadRequestException('Aluno já está matriculado nesta turma');
    }

    // Verifica se nova turma pertence à mesma instituição
    const currentClass = await this.prisma.class.findUnique({
      where: { id: enrollment.classId },
    });

    if (!currentClass) {
      throw new NotFoundException('Turma atual não encontrada');
    }

    if (currentClass.institutionId !== newClass.institutionId) {
      throw new BadRequestException(
        'Não é possível transferir para turma de outra instituição',
      );
    }

    // Verifica se aluno já está matriculado na nova turma
    const existingEnrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        classId: newClassId,
        studentId: enrollment.studentId,
        isActive: true,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Aluno já está matriculado na nova turma');
    }

    // Verifica capacidade máxima da nova turma
    if (newClass.maxStudents) {
      const currentEnrollments = newClass._count.enrollments;
      if (currentEnrollments >= newClass.maxStudents) {
        throw new BadRequestException(
          `Nova turma atingiu capacidade máxima de ${newClass.maxStudents} alunos`,
        );
      }
    }

    // Desativa matrícula atual e cria nova
    return this.prisma.$transaction(async (tx) => {
      // Desativa matrícula atual
      await tx.classEnrollment.update({
        where: { id },
        data: { isActive: false },
      });

      // Cria nova matrícula
      const newEnrollment = await tx.classEnrollment.create({
        data: {
          classId: newClassId,
          studentId: enrollment.studentId,
          enrollmentDate: new Date(),
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              section: true,
              shift: true,
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
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              enrollmentNumber: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  cpf: true,
                },
              },
            },
          },
        },
      });

      return newEnrollment;
    });
  }

  /**
   * Cancela uma matrícula (soft delete)
   */
  async remove(id: string) {
    // Verifica se matrícula existe
    await this.findOne(id);

    return this.prisma.classEnrollment.update({
      where: { id },
      data: { isActive: false },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }
}
