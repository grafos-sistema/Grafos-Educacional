import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassSubjectDto } from './dto';

@Injectable()
export class ClassSubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createClassSubjectDto: CreateClassSubjectDto) {
    const { classId, subjectId, teacherId, weeklyHours } = createClassSubjectDto;

    // Verificar se a turma existe
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    // Verificar se a disciplina existe
    const subjectExists = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subjectExists) {
      throw new NotFoundException(
        `Disciplina com ID ${subjectId} não encontrada`,
      );
    }

    // Verificar se o professor existe (apenas se teacherId foi fornecido)
    if (teacherId) {
      const teacherExists = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });

      if (!teacherExists) {
        throw new NotFoundException(
          `Professor com ID ${teacherId} não encontrado`,
        );
      }
    }

    // Verificar se a disciplina já está vinculada à turma
    const existing = await this.prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Esta disciplina já está vinculada a esta turma',
      );
    }

    // Criar vínculo - usar sintaxe de relação do Prisma
    const data: any = {
      class: {
        connect: { id: classId },
      },
      subject: {
        connect: { id: subjectId },
      },
    };

    if (teacherId) {
      data.teacher = {
        connect: { id: teacherId },
      };
    }

    if (weeklyHours !== undefined && weeklyHours !== null) {
      data.weeklyHours = weeklyHours;
    }

    return this.prisma.classSubject.create({
      data,
      include: {
        class: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Verificar se existe
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id },
    });

    if (!classSubject) {
      throw new NotFoundException(
        `Vínculo de disciplina com ID ${id} não encontrado`,
      );
    }

    // Remover (soft delete não necessário aqui, é apenas um vínculo)
    return this.prisma.classSubject.delete({
      where: { id },
      include: {
        class: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }
}
