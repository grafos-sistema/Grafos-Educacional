import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParentStudentDto, UpdateParentStudentDto } from './dto';

@Injectable()
export class ParentStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateParentStudentDto) {
    // Verificar se o parent existe e tem perfil de PARENT
    const parent = await this.prisma.parent.findUnique({
      where: { userId: createDto.parentId },
      include: { user: true },
    });

    if (!parent) {
      throw new BadRequestException('Usuário não é um responsável válido');
    }

    // Verificar se o student existe e tem perfil de STUDENT
    const student = await this.prisma.student.findUnique({
      where: { userId: createDto.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new BadRequestException('Usuário não é um aluno válido');
    }

    // Verificar se já existe relacionamento
    const existing = await this.prisma.studentParent.findUnique({
      where: {
        studentId_parentId: {
          studentId: student.id,
          parentId: parent.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Relacionamento já existe');
    }

    // Criar relacionamento
    const parentStudent = await this.prisma.studentParent.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        relationship: createDto.relationship,
        isPrimary: createDto.isPrimary || false,
      },
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
        student: {
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
    });

    return parentStudent;
  }

  async findAll() {
    return this.prisma.studentParent.findMany({
      include: {
        parent: {
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
        student: {
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
    });
  }

  async findOne(id: string) {
    const parentStudent = await this.prisma.studentParent.findUnique({
      where: { id },
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
        student: {
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
    });

    if (!parentStudent) {
      throw new NotFoundException('Relacionamento não encontrado');
    }

    return parentStudent;
  }

  async findByParentUserId(parentUserId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: parentUserId },
    });

    if (!parent) {
      throw new NotFoundException('Responsável não encontrado');
    }

    return this.prisma.studentParent.findMany({
      where: { parentId: parent.id },
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
          },
        },
      },
    });
  }

  async findByStudentUserId(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    return this.prisma.studentParent.findMany({
      where: { studentId: student.id },
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
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateParentStudentDto) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.studentParent.update({
      where: { id },
      data: updateDto,
      include: {
        parent: {
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
        student: {
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
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.studentParent.delete({
      where: { id },
    });
  }
}
