import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherSubjectDto, BulkCreateTeacherSubjectDto } from './dto';

@Injectable()
export class TeacherSubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAllByTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    return this.prisma.teacherSubject.findMany({
      where: { teacherId },
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
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });
  }

  async findAllBySubject(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    return this.prisma.teacherSubject.findMany({
      where: { subjectId },
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
      },
      orderBy: {
        teacher: {
          user: {
            firstName: 'asc',
          },
        },
      },
    });
  }

  async findAllByTeacherUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Perfil de professor não encontrado');
    }

    return this.findAllByTeacher(teacher.id);
  }

  async create(teacherId: string, createDto: CreateTeacherSubjectDto) {
    // Verificar se professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            institutionId: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    // Verificar se disciplina existe e pertence à mesma instituição
    const subject = await this.prisma.subject.findUnique({
      where: { id: createDto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    if (subject.institutionId !== teacher.user.institutionId) {
      throw new ForbiddenException(
        'Disciplina não pertence à mesma instituição do professor',
      );
    }

    // Verificar se já existe o vínculo
    const existing = await this.prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId: createDto.subjectId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Professor já está vinculado a esta disciplina',
      );
    }

    return this.prisma.teacherSubject.create({
      data: {
        teacherId,
        subjectId: createDto.subjectId,
      },
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
      },
    });
  }

  async bulkCreate(teacherId: string, bulkDto: BulkCreateTeacherSubjectDto) {
    // Verificar se professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            institutionId: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    if (!teacher.user.institutionId) {
      throw new BadRequestException(
        'O professor precisa estar vinculado a uma instituição',
      );
    }

    // Verificar se todas as disciplinas existem e pertencem à mesma instituição
    const subjects = await this.prisma.subject.findMany({
      where: {
        id: { in: bulkDto.subjectIds },
        institutionId: teacher.user.institutionId,
      },
    });

    if (subjects.length !== bulkDto.subjectIds.length) {
      throw new NotFoundException(
        'Uma ou mais disciplinas não foram encontradas ou não pertencem à instituição',
      );
    }

    // Obter vínculos existentes
    const existingLinks = await this.prisma.teacherSubject.findMany({
      where: {
        teacherId,
        subjectId: { in: bulkDto.subjectIds },
      },
    });

    const existingSubjectIds = existingLinks.map((link) => link.subjectId);
    const newSubjectIds = bulkDto.subjectIds.filter(
      (id) => !existingSubjectIds.includes(id),
    );

    if (newSubjectIds.length === 0) {
      return {
        created: 0,
        message: 'Todas as disciplinas já estão vinculadas',
      };
    }

    // Criar novos vínculos
    await this.prisma.teacherSubject.createMany({
      data: newSubjectIds.map((subjectId) => ({
        teacherId,
        subjectId,
      })),
    });

    return {
      created: newSubjectIds.length,
      message: `${newSubjectIds.length} disciplina(s) vinculada(s) com sucesso`,
    };
  }

  async syncTeacherSubjects(teacherId: string, subjectIds: string[]) {
    // Verificar se professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            institutionId: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    if (!teacher.user.institutionId) {
      throw new BadRequestException(
        'O professor precisa estar vinculado a uma instituição',
      );
    }

    // Verificar se todas as disciplinas existem e pertencem à mesma instituição
    if (subjectIds.length > 0) {
      const subjects = await this.prisma.subject.findMany({
        where: {
          id: { in: subjectIds },
          institutionId: teacher.user.institutionId,
        },
      });

      if (subjects.length !== subjectIds.length) {
        throw new NotFoundException(
          'Uma ou mais disciplinas não foram encontradas ou não pertencem à instituição',
        );
      }
    }

    // Deletar vínculos existentes
    await this.prisma.teacherSubject.deleteMany({
      where: { teacherId },
    });

    // Criar novos vínculos
    if (subjectIds.length > 0) {
      await this.prisma.teacherSubject.createMany({
        data: subjectIds.map((subjectId) => ({
          teacherId,
          subjectId,
        })),
      });
    }

    return this.findAllByTeacher(teacherId);
  }

  async syncSubjectTeachers(subjectId: string, teacherIds: string[]) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, institutionId: true },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    const uniqueTeacherIds = Array.from(new Set(teacherIds.filter(Boolean)));

    if (uniqueTeacherIds.length > 0) {
      const teachers = await this.prisma.teacher.findMany({
        where: { id: { in: uniqueTeacherIds } },
        select: {
          id: true,
          user: { select: { institutionId: true } },
        },
      });

      if (teachers.length !== uniqueTeacherIds.length) {
        throw new NotFoundException(
          'Um ou mais professores não foram encontrados',
        );
      }

      if (teachers.some((teacher) => teacher.user.institutionId !== subject.institutionId)) {
        throw new ForbiddenException(
          'Professor não pertence à mesma instituição da disciplina',
        );
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.teacherSubject.deleteMany({ where: { subjectId } });

      if (uniqueTeacherIds.length > 0) {
        await transaction.teacherSubject.createMany({
          data: uniqueTeacherIds.map((teacherId) => ({ teacherId, subjectId })),
        });
      }
    });

    return this.findAllBySubject(subjectId);
  }

  async remove(teacherId: string, subjectId: string) {
    const teacherSubject = await this.prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId,
        },
      },
    });

    if (!teacherSubject) {
      throw new NotFoundException('Vínculo não encontrado');
    }

    return this.prisma.teacherSubject.delete({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId,
        },
      },
    });
  }

  async removeById(id: string) {
    const teacherSubject = await this.prisma.teacherSubject.findUnique({
      where: { id },
    });

    if (!teacherSubject) {
      throw new NotFoundException('Vínculo não encontrado');
    }

    return this.prisma.teacherSubject.delete({
      where: { id },
    });
  }
}
