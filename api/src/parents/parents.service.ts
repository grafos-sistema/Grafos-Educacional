import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParentDto, UpdateParentDto, LinkStudentDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo responsável
   */
  async create(createParentDto: CreateParentDto) {
    const { userId, institutionId, ...data } = createParentDto;

    // Verifica se usuário existe e tem role PARENT
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role !== UserRole.PARENT) {
      throw new BadRequestException('Usuário deve ter role PARENT');
    }

    if (user.institutionId !== institutionId) {
      throw new BadRequestException(
        'Instituição do responsável deve ser a mesma do usuário',
      );
    }

    // Verifica se já existe registro de responsável para este usuário
    const existingParent = await this.prisma.parent.findUnique({
      where: { userId },
    });

    if (existingParent) {
      throw new ConflictException(
        'Já existe registro de responsável para este usuário',
      );
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

    return this.prisma.parent.create({
      data: {
        ...data,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            institutionId: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos os responsáveis com paginação e filtros
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
        { occupation: { contains: search, mode: 'insensitive' } },
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
      this.prisma.parent.findMany({
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
              phone: true,
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
              children: true,
            },
          },
        },
      }),
      this.prisma.parent.count({ where }),
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
   * Busca um responsável por ID
   */
  async findOne(id: string) {
    const parent = await this.prisma.parent.findUnique({
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
        children: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Responsável não encontrado');
    }

    return parent;
  }

  /**
   * Busca filhos/alunos do responsável com informações de matrícula e desempenho
   */
  async findStudents(parentId: string) {
    // Verifica se responsável existe
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Responsável não encontrado');
    }

    // Busca os filhos com dados completos de matrícula e desempenho
    const children = await this.prisma.studentParent.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            classEnrollments: {
              where: {
                isActive: true,
              },
              include: {
                class: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    subjects: {
                      select: {
                        id: true,
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
                },
              },
            },
            grades: {
              select: {
                value: true,
                classSubject: {
                  select: {
                    subject: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            attendances: {
              select: {
                status: true,
                classSubject: {
                  select: {
                    subject: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Processar dados para incluir estatísticas e alertas
    return children.map((ps) => {
      const student = ps.student;

      // Calcular número de disciplinas únicas
      const subjectsSet = new Set<string>();
      student.classEnrollments.forEach((enrollment) => {
        enrollment.class.subjects.forEach((cs) => {
          subjectsSet.add(cs.subject.id);
        });
      });

      // Calcular alertas de desempenho
      const alerts: any[] = [];

      // Alertas de notas baixas (< 6.0)
      const lowGrades = student.grades.filter((g) => g.value < 6.0);
      const gradesBySubject = new Map<string, number[]>();

      lowGrades.forEach((grade) => {
        const subjectName = grade.classSubject.subject.name;
        if (!gradesBySubject.has(subjectName)) {
          gradesBySubject.set(subjectName, []);
        }
        gradesBySubject.get(subjectName)!.push(grade.value);
      });

      gradesBySubject.forEach((grades, subjectName) => {
        const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
        alerts.push({
          type: 'grade',
          subjectName,
          value: avgGrade.toFixed(1),
        });
      });

      // Alertas de frequência baixa (< 75%)
      const attendanceBySubject = new Map<
        string,
        { present: number; total: number }
      >();

      student.attendances.forEach((att) => {
        const subjectName = att.classSubject.subject.name;
        if (!attendanceBySubject.has(subjectName)) {
          attendanceBySubject.set(subjectName, { present: 0, total: 0 });
        }
        const stats = attendanceBySubject.get(subjectName)!;
        stats.total++;
        if (att.status === 'PRESENT') {
          stats.present++;
        }
      });

      attendanceBySubject.forEach((stats, subjectName) => {
        const attendanceRate = (stats.present / stats.total) * 100;
        if (attendanceRate < 75) {
          alerts.push({
            type: 'attendance',
            subjectName,
            value: `${attendanceRate.toFixed(0)}%`,
          });
        }
      });

      return {
        student: {
          id: student.id,
          registrationNumber: student.registrationNumber,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
          avatar: student.user.avatar,
          isActive: student.isActive,
        },
        enrollments: student.classEnrollments.map((e) => ({
          id: e.id,
          class: {
            id: e.class.id,
            name: e.class.name,
            grade: e.class.grade,
            section: e.class.section,
            course: e.class.course,
          },
        })),
        subjectsCount: subjectsSet.size,
        alerts,
        linkedAt: ps.createdAt,
      };
    });
  }

  /**
   * Vincula um aluno ao responsável
   */
  async linkStudent(parentId: string, linkStudentDto: LinkStudentDto) {
    const { studentId } = linkStudentDto;

    // Verifica se responsável existe
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        user: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Responsável não encontrado');
    }

    // Verifica se aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Verifica se aluno pertence à mesma instituição
    if (student.user.institutionId !== parent.user.institutionId) {
      throw new BadRequestException(
        'Aluno deve pertencer à mesma instituição do responsável',
      );
    }

    // Verifica se vinculação já existe
    const existingLink = await this.prisma.studentParent.findUnique({
      where: {
        studentId_parentId: {
          studentId,
          parentId,
        },
      },
    });

    if (existingLink) {
      throw new ConflictException('Aluno já está vinculado a este responsável');
    }

    // Cria vinculação
    await this.prisma.studentParent.create({
      data: {
        studentId,
        parentId,
        relationship: 'Parent', // Default relationship type
      },
    });

    return {
      message: 'Aluno vinculado com sucesso',
      parentId,
      studentId,
    };
  }

  /**
   * Remove vinculação de um aluno
   */
  async unlinkStudent(parentId: string, studentId: string) {
    // Verifica se vinculação existe
    const link = await this.prisma.studentParent.findUnique({
      where: {
        studentId_parentId: {
          studentId,
          parentId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Vinculação não encontrada');
    }

    // Remove vinculação
    await this.prisma.studentParent.delete({
      where: {
        studentId_parentId: {
          studentId,
          parentId,
        },
      },
    });

    return {
      message: 'Vinculação removida com sucesso',
      parentId,
      studentId,
    };
  }

  /**
   * Atualiza um responsável
   */
  async update(id: string, updateParentDto: UpdateParentDto) {
    // Verifica se responsável existe
    await this.findOne(id);

    return this.prisma.parent.update({
      where: { id },
      data: updateParentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
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
            children: true,
          },
        },
      },
    });
  }

  /**
   * Remove um responsável (soft delete)
   */
  async remove(id: string) {
    // Verifica se responsável existe
    await this.findOne(id);

    return this.prisma.parent.update({
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
