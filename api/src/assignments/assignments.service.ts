import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
} from './dto';
import { AssignmentStatus } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria tarefa/atividade
   */
  async create(createAssignmentDto: CreateAssignmentDto) {
    const {
      classSubjectId,
      teacherId,
      title,
      description,
      dueDate,
      maxScore,
      attachments,
      instructions,
    } = createAssignmentDto;

    // Valida disciplina
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    // Valida professor
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    if (!teacher.isActive) {
      throw new BadRequestException('Professor não está ativo');
    }

    // Valida se professor leciona a disciplina
    if (classSubject.teacherId && classSubject.teacherId !== teacherId) {
      throw new BadRequestException(
        'Professor não leciona esta disciplina na turma',
      );
    }

    return this.prisma.assignment.create({
      data: {
        classSubjectId,
        teacherId,
        title,
        description,
        dueDate: new Date(dueDate),
        maxScore,
        attachments,
        instructions,
      },
      include: {
        classSubject: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
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
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  /**
   * Lista tarefas com filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    classSubjectId?: string,
    teacherId?: string,
    dueDateStart?: string,
    dueDateEnd?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (classSubjectId) {
      where.classSubjectId = classSubjectId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (dueDateStart || dueDateEnd) {
      where.dueDate = {};
      if (dueDateStart) {
        where.dueDate.gte = new Date(dueDateStart);
      }
      if (dueDateEnd) {
        where.dueDate.lte = new Date(dueDateEnd);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'desc' },
        include: {
          classSubject: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  grade: true,
                  section: true,
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
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      }),
      this.prisma.assignment.count({ where }),
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
   * Busca tarefa por ID
   */
  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        classSubject: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
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
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return assignment;
  }

  /**
   * Aluno submete tarefa
   */
  async submit(assignmentId: string, submitDto: SubmitAssignmentDto) {
    const { studentId, content, attachments } = submitDto;

    // Valida tarefa
    const assignment = await this.findOne(assignmentId);

    // Valida aluno
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Valida se aluno está matriculado na turma
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: assignment.classSubjectId },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina da turma não encontrada');
    }

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

    // Verifica se já existe submissão
    const existingSubmission =
      await this.prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
      });

    if (existingSubmission) {
      throw new ConflictException('Aluno já submeteu esta tarefa');
    }

    // Determina status (atrasado ou não)
    const now = new Date();
    const isLate = now > assignment.dueDate;
    const status = isLate ? AssignmentStatus.LATE : AssignmentStatus.SUBMITTED;

    return this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        content,
        attachments,
        status,
        submittedAt: now,
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            maxScore: true,
          },
        },
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
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
    });
  }

  /**
   * Lista submissões de uma tarefa
   */
  async getSubmissions(assignmentId: string) {
    // Valida tarefa
    await this.findOne(assignmentId);

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            enrollmentNumber: true,
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
      orderBy: { submittedAt: 'desc' },
    });

    return submissions;
  }

  /**
   * Professor corrige submissão
   */
  async gradeSubmission(submissionId: string, gradeDto: GradeSubmissionDto) {
    const { score, feedback } = gradeDto;

    // Busca submissão
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            maxScore: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submissão não encontrada');
    }

    // Valida nota
    if (submission.assignment?.maxScore && score > submission.assignment.maxScore) {
      throw new BadRequestException(
        `Nota não pode ser maior que ${submission.assignment.maxScore}`,
      );
    }

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        status: AssignmentStatus.GRADED,
        gradedAt: new Date(),
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
          },
        },
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
   * Atualiza tarefa
   */
  async update(id: string, updateAssignmentDto: UpdateAssignmentDto) {
    await this.findOne(id);

    const { dueDate, ...data } = updateAssignmentDto;

    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...data,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
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
              },
            },
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
  }

  /**
   * Remove tarefa
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.assignment.delete({
      where: { id },
    });
  }
}
