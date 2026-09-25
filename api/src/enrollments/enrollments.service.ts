import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BulkCreateEnrollmentDto,
  CreateEnrollmentDto,
  TransferEnrollmentDto,
} from './dto';

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
    // Não carregue o usuário inteiro aqui. A coluna legada `users.password`
    // ainda contém NULL em registros criados pelo Supabase/Auth, enquanto o
    // schema Prisma antigo a declara como String. Selecionar somente a coluna
    // necessária evita que a leitura falhe com P2032 antes da matrícula ser
    // criada.
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        isActive: true,
        user: {
          select: {
            institutionId: true,
          },
        },
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
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Cria ou reativa várias matrículas de uma vez.
   */
  async bulkCreate(bulkCreateEnrollmentDto: BulkCreateEnrollmentDto) {
    const { classId, studentIds } = bulkCreateEnrollmentDto;
    const uniqueStudentIds = [...new Set(studentIds)];

    return this.prisma.$transaction(async (tx) => {
      const classEntity = await tx.class.findUnique({
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

      const students = await tx.student.findMany({
        where: { id: { in: uniqueStudentIds } },
        select: {
          id: true,
          isActive: true,
          user: {
            select: {
              institutionId: true,
            },
          },
        },
      });

      if (students.length !== uniqueStudentIds.length) {
        throw new NotFoundException('Um ou mais alunos não foram encontrados');
      }

      if (students.some((student) => !student.isActive)) {
        throw new BadRequestException(
          'Não é possível vincular alunos inativos',
        );
      }

      if (
        students.some(
          (student) => student.user.institutionId !== classEntity.institutionId,
        )
      ) {
        throw new BadRequestException(
          'Todos os alunos devem pertencer à mesma instituição da turma',
        );
      }

      const activeTargetEnrollments = await tx.classEnrollment.findMany({
        where: {
          classId,
          studentId: { in: uniqueStudentIds },
          isActive: true,
        },
        select: { studentId: true },
      });

      if (activeTargetEnrollments.length > 0) {
        throw new ConflictException(
          'Um ou mais alunos já estão matriculados nesta turma',
        );
      }

      const activeOtherClassEnrollments = await tx.classEnrollment.findMany({
        where: {
          studentId: { in: uniqueStudentIds },
          classId: { not: classId },
          isActive: true,
        },
        select: { studentId: true },
      });

      if (activeOtherClassEnrollments.length > 0) {
        throw new ConflictException(
          'Um ou mais alunos já estão vinculados a outra turma',
        );
      }

      if (
        classEntity.maxStudents &&
        classEntity._count.enrollments + uniqueStudentIds.length >
          classEntity.maxStudents
      ) {
        throw new BadRequestException(
          `A turma comporta mais ${classEntity.maxStudents - classEntity._count.enrollments} aluno(s)`,
        );
      }

      const previousTargetEnrollments = await tx.classEnrollment.findMany({
        where: {
          classId,
          studentId: { in: uniqueStudentIds },
          isActive: false,
        },
        select: { id: true, studentId: true },
      });
      const previousByStudentId = new Map(
        previousTargetEnrollments.map((enrollment) => [
          enrollment.studentId,
          enrollment.id,
        ]),
      );
      const enrollmentDate = new Date();

      for (const studentId of uniqueStudentIds) {
        const previousEnrollmentId = previousByStudentId.get(studentId);
        if (previousEnrollmentId) {
          await tx.classEnrollment.update({
            where: { id: previousEnrollmentId },
            data: { isActive: true, enrollmentDate },
          });
        } else {
          await tx.classEnrollment.create({
            data: { classId, studentId, enrollmentDate },
          });
        }
      }

      return tx.classEnrollment.findMany({
        where: {
          classId,
          studentId: { in: uniqueStudentIds },
          isActive: true,
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
                select: { id: true, name: true, code: true },
              },
              academicYear: {
                select: { id: true, year: true },
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
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { enrollmentDate: 'desc' },
      });
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
                  avatar: true,
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
