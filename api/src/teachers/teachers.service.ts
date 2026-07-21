import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo professor
   */
  async create(createTeacherDto: CreateTeacherDto) {
    const { userId, institutionId, subjectIds, ...data } = createTeacherDto;

    // Verifica se usuário existe e tem role TEACHER
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role !== UserRole.TEACHER) {
      throw new BadRequestException('Usuário deve ter role TEACHER');
    }

    if (user.institutionId !== institutionId) {
      throw new BadRequestException(
        'Instituição do professor deve ser a mesma do usuário',
      );
    }

    // Verifica se já existe registro de professor para este usuário
    const existingTeacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (existingTeacher) {
      throw new ConflictException('Já existe registro de professor para este usuário');
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

    // Note: Teacher doesn't have direct subject relation in schema
    // Subjects are assigned through ClassSubject when teacher is assigned to a class

    // Cria o professor
    return this.prisma.teacher.create({
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
            classSubjects: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos os professores com paginação e filtros
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
        { specialization: { contains: search, mode: 'insensitive' } },
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
      this.prisma.teacher.findMany({
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
              classSubjects: true,
            },
          },
        },
      }),
      this.prisma.teacher.count({ where }),
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
   * Busca um professor por ID
   */
  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
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
        classSubjects: {
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
        _count: {
          select: {
            classSubjects: true,
            lessonPlans: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    return teacher;
  }

  /**
   * Busca turmas do professor
   */
  async findClasses(teacherId: string) {
    // Verifica se professor existe
    await this.findOne(teacherId);

    // Teacher teaches classes through ClassSubject relation
    const classSubjects = await this.prisma.classSubject.findMany({
      where: {
        teacherId,
      },
      include: {
        class: {
          include: {
            academicYear: {
              select: {
                id: true,
                year: true,
                name: true,
              },
            },
            course: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return classSubjects.map(cs => ({
      ...cs.class,
      subject: cs.subject,
    }));
  }

  /**
   * Busca disciplinas do professor
   */
  async findSubjects(teacherId: string) {
    // Verifica se professor existe
    const teacher = await this.findOne(teacherId);

    // Extract unique subjects from classSubjects
    const uniqueSubjects = new Map();
    teacher.classSubjects.forEach(cs => {
      if (!uniqueSubjects.has(cs.subject.id)) {
        uniqueSubjects.set(cs.subject.id, cs.subject);
      }
    });

    return Array.from(uniqueSubjects.values());
  }

  /**
   * Atualiza um professor
   */
  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    // Verifica se professor existe
    await this.findOne(id);

    // Note: Teacher subjects are managed through ClassSubject assignments, not directly
    const { subjectIds, ...data } = updateTeacherDto;

    return this.prisma.teacher.update({
      where: { id },
      data: {
        ...data,
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
        classSubjects: {
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
        _count: {
          select: {
            classSubjects: true,
          },
        },
      },
    });
  }

  /**
   * Remove um professor (soft delete)
   */
  async remove(id: string) {
    // Verifica se professor existe
    await this.findOne(id);

    // Verifica se professor tem turmas ativas através de ClassSubject
    const activeClassSubjects = await this.prisma.classSubject.count({
      where: {
        teacherId: id,
        class: {
          isActive: true,
        },
      },
    });

    if (activeClassSubjects > 0) {
      throw new BadRequestException(
        `Não é possível excluir professor com ${activeClassSubjects} atribuição(ões) ativa(s)`,
      );
    }

    return this.prisma.teacher.update({
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
