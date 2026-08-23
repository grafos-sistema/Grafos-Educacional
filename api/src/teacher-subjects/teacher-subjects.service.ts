import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTeacherSubjectDto,
  BulkCreateTeacherSubjectDto,
  DistributeSubjectDto,
} from './dto';

@Injectable()
export class TeacherSubjectsService {
  constructor(private prisma: PrismaService) {}

  private timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private dayLabel(dayOfWeek: string) {
    const labels: Record<string, string> = {
      MONDAY: 'segunda-feira',
      TUESDAY: 'terça-feira',
      WEDNESDAY: 'quarta-feira',
      THURSDAY: 'quinta-feira',
      FRIDAY: 'sexta-feira',
      SATURDAY: 'sábado',
      SUNDAY: 'domingo',
    };

    return labels[dayOfWeek] || 'neste dia';
  }

  private async assertNoScheduleConflictOnAssignment(
    teacherId: string,
    classSubjectIds: string[],
  ) {
    if (classSubjectIds.length === 0) return;

    const pendingSchedules = await this.prisma.classSchedule.findMany({
      where: { classSubjectId: { in: classSubjectIds } },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        classSubjectId: true,
        class: { select: { name: true } },
      },
    });

    if (pendingSchedules.length === 0) return;

    const existingSchedules = await this.prisma.classSchedule.findMany({
      where: {
        classSubject: {
          teacherId,
          id: { notIn: classSubjectIds },
        },
      },
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        class: { select: { name: true } },
      },
    });

    const schedulesToCompare = [
      ...existingSchedules.map((schedule) => ({
        ...schedule,
        source: 'existing',
      })),
      ...pendingSchedules.map((schedule) => ({
        ...schedule,
        source: schedule.id,
      })),
    ];

    for (const pending of pendingSchedules) {
      for (const existing of schedulesToCompare) {
        if (existing.source === pending.id) continue;
        if (existing.dayOfWeek !== pending.dayOfWeek) continue;

        const hasOverlap =
          this.timeToMinutes(pending.startTime) <
            this.timeToMinutes(existing.endTime) &&
          this.timeToMinutes(pending.endTime) >
            this.timeToMinutes(existing.startTime);

        if (!hasOverlap) continue;

        throw new ConflictException(
          `O professor já tem aula na turma ${existing.class.name} na ${this.dayLabel(pending.dayOfWeek)}, das ${existing.startTime} às ${existing.endTime}. Escolha outro professor ou revise os horários antes de distribuir.`,
        );
      }
    }
  }

  private async assertTeacherSubjectCanBeRemoved(
    teacherId: string,
    subjectId: string,
  ) {
    const assignments = await this.prisma.classSubject.findMany({
      where: { teacherId, subjectId },
      select: {
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        class: {
          name: 'asc',
        },
      },
    });

    if (assignments.length === 0) return;

    const classNames = assignments
      .map((assignment) => assignment.class.name)
      .filter(Boolean);
    const suffix =
      classNames.length > 0
        ? ` Turma(s): ${classNames.slice(0, 3).join(', ')}${classNames.length > 3 ? '...' : ''}.`
        : '';

    throw new ConflictException(
      `Não é possível remover esta disciplina do professor enquanto ela estiver distribuída em uma turma.${suffix} Primeiro altere a distribuição da disciplina.`,
    );
  }

  async findAllByTeacher(teacherId: string) {
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
      return [];
    }

    return this.prisma.teacherSubject.findMany({
      // Evita exibir vínculos antigos de outra instituição caso um dado
      // inconsistente tenha sido criado antes da validação de pertencimento.
      where: {
        teacherId,
        subject: {
          institutionId: teacher.user.institutionId,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            description: true,
            institutionId: true,
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
                phone: true,
                whatsapp: true,
                avatar: true,
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

  async distributeSubject(
    subjectId: string,
    distributeDto: DistributeSubjectDto,
  ) {
    const uniqueClassIds = Array.from(new Set(distributeDto.classIds));

    if (uniqueClassIds.length === 0) {
      throw new BadRequestException('Selecione pelo menos uma turma.');
    }

    const [subject, teacher, classes, existingAssignments] = await Promise.all([
      this.prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, institutionId: true },
      }),
      this.prisma.teacher.findUnique({
        where: { id: distributeDto.teacherId },
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              institutionId: true,
            },
          },
        },
      }),
      this.prisma.class.findMany({
        where: { id: { in: uniqueClassIds } },
        select: { id: true, name: true, isActive: true, institutionId: true },
      }),
      this.prisma.classSubject.findMany({
        where: {
          subjectId,
          classId: { in: uniqueClassIds },
        },
        select: {
          id: true,
          classId: true,
          teacherId: true,
          class: { select: { name: true } },
          schedules: {
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
    ]);

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada.');
    }

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado.');
    }

    if (
      !teacher.user.institutionId ||
      teacher.user.institutionId !== subject.institutionId
    ) {
      throw new ForbiddenException(
        'O professor e a disciplina precisam pertencer à mesma instituição.',
      );
    }

    if (classes.length !== uniqueClassIds.length) {
      throw new NotFoundException(
        'Uma ou mais turmas não foram encontradas na instituição selecionada.',
      );
    }

    const invalidClass = classes.find(
      (item) => item.institutionId !== subject.institutionId || !item.isActive,
    );
    if (invalidClass) {
      throw new BadRequestException(
        `A turma ${invalidClass.name} não está ativa ou não pertence à instituição da disciplina.`,
      );
    }

    const occupiedByAnotherTeacher = existingAssignments.filter(
      (assignment) =>
        assignment.teacherId &&
        assignment.teacherId !== distributeDto.teacherId,
    );

    if (occupiedByAnotherTeacher.length > 0) {
      const classNames = occupiedByAnotherTeacher
        .map((assignment) => assignment.class.name)
        .join(', ');
      throw new ConflictException(
        `A disciplina já possui outro professor vinculado à(s) turma(s): ${classNames}. Remova ou altere essa distribuição antes de continuar.`,
      );
    }

    await this.assertNoScheduleConflictOnAssignment(
      distributeDto.teacherId,
      existingAssignments
        .filter((assignment) => !assignment.teacherId)
        .map((assignment) => assignment.id),
    );

    const existingByClassId = new Map(
      existingAssignments.map((assignment) => [assignment.classId, assignment]),
    );

    return this.prisma.$transaction(async (transaction) => {
      const teacherSubject = await transaction.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: distributeDto.teacherId,
            subjectId,
          },
        },
        create: {
          teacherId: distributeDto.teacherId,
          subjectId,
        },
        update: {},
      });

      let created = 0;
      let updated = 0;

      for (const classId of uniqueClassIds) {
        const existing = existingByClassId.get(classId);
        const data = {
          teacherId: distributeDto.teacherId,
        };

        if (existing) {
          await transaction.classSubject.update({
            where: { id: existing.id },
            data,
          });
          updated += 1;
        } else {
          await transaction.classSubject.create({
            data: {
              classId,
              subjectId,
              ...data,
            },
          });
          created += 1;
        }
      }

      return {
        teacherSubjectId: teacherSubject.id,
        subjectId,
        teacherId: distributeDto.teacherId,
        classIds: uniqueClassIds,
        created,
        updated,
        message: `${subject.name} distribuída para ${uniqueClassIds.length} turma(s) com sucesso.`,
      };
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
    const uniqueSubjectIds = Array.from(new Set(subjectIds.filter(Boolean)));

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
    if (uniqueSubjectIds.length > 0) {
      const subjects = await this.prisma.subject.findMany({
        where: {
          id: { in: uniqueSubjectIds },
          institutionId: teacher.user.institutionId,
        },
      });

      if (subjects.length !== uniqueSubjectIds.length) {
        throw new NotFoundException(
          'Uma ou mais disciplinas não foram encontradas ou não pertencem à instituição',
        );
      }
    }

    const currentLinks = await this.prisma.teacherSubject.findMany({
      where: { teacherId },
      select: { subjectId: true },
    });
    const removedSubjectIds = currentLinks
      .map((link) => link.subjectId)
      .filter((subjectId) => !uniqueSubjectIds.includes(subjectId));

    for (const subjectId of removedSubjectIds) {
      await this.assertTeacherSubjectCanBeRemoved(teacherId, subjectId);
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.teacherSubject.deleteMany({
        where: { teacherId },
      });

      if (uniqueSubjectIds.length > 0) {
        await transaction.teacherSubject.createMany({
          data: uniqueSubjectIds.map((subjectId) => ({
            teacherId,
            subjectId,
          })),
        });
      }
    });

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

      if (
        teachers.some(
          (teacher) => teacher.user.institutionId !== subject.institutionId,
        )
      ) {
        throw new ForbiddenException(
          'Professor não pertence à mesma instituição da disciplina',
        );
      }
    }

    const currentLinks = await this.prisma.teacherSubject.findMany({
      where: { subjectId },
      select: { teacherId: true },
    });
    const removedTeacherIds = currentLinks
      .map((link) => link.teacherId)
      .filter((teacherId) => !uniqueTeacherIds.includes(teacherId));

    for (const teacherId of removedTeacherIds) {
      await this.assertTeacherSubjectCanBeRemoved(teacherId, subjectId);
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

    await this.assertTeacherSubjectCanBeRemoved(teacherId, subjectId);

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

    return this.remove(teacherSubject.teacherId, teacherSubject.subjectId);
  }
}
