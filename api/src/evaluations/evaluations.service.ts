import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentSlot, EvaluationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateEvaluationDto } from './dto';

const managerRoles = new Set<UserRole>([
  UserRole.SUPER_ADMIN_GLOBAL,
  UserRole.SUPER_ADMIN,
  UserRole.DIRECTOR,
  UserRole.INSTITUTION_ADMIN,
  UserRole.COORDINATOR,
]);

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEvaluationDto, currentUser: CurrentUserPayload) {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: dto.classSubjectId },
      select: {
        id: true,
        teacherId: true,
        subject: { select: { id: true, name: true } },
        class: {
          select: {
            id: true,
            institutionId: true,
            academicYearId: true,
            name: true,
          },
        },
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina da turma não encontrada');
    }

    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academicPeriodId },
      select: { id: true, academicYearId: true, name: true },
    });

    if (!period) {
      throw new NotFoundException('Período acadêmico não encontrado');
    }

    if (period.academicYearId !== classSubject.class.academicYearId) {
      throw new ForbiddenException(
        'O período acadêmico não pertence ao ano letivo da turma',
      );
    }

    await this.assertInstitutionAccess(
      classSubject.class.institutionId,
      currentUser,
    );

    if (currentUser.role === UserRole.TEACHER) {
      if (
        !currentUser.teacherId ||
        classSubject.teacherId !== currentUser.teacherId
      ) {
        throw new ForbiddenException(
          'Você só pode propor avaliações para suas próprias disciplinas',
        );
      }
    }

    const creator = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { id: true },
    });

    if (!creator) {
      throw new NotFoundException('Usuário criador não encontrado');
    }

    const status = managerRoles.has(currentUser.role)
      ? EvaluationStatus.APPROVED
      : EvaluationStatus.PENDING_APPROVAL;

    try {
      return await this.prisma.evaluation.create({
        data: {
          title: dto.title.trim(),
          type: dto.type.trim(),
          slot: dto.slot,
          description: dto.description?.trim() || null,
          examDate: dto.examDate ? new Date(dto.examDate) : null,
          maxValue: dto.maxValue ?? 10,
          countsTowardsAverage: dto.countsTowardsAverage ?? true,
          status,
          approvedAt: status === EvaluationStatus.APPROVED ? new Date() : null,
          institutionId: classSubject.class.institutionId,
          classSubjectId: classSubject.id,
          academicPeriodId: period.id,
          createdById: creator.id,
          approvedById:
            status === EvaluationStatus.APPROVED ? creator.id : null,
        },
        include: this.includeRelations(),
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Já existe uma avaliação cadastrada para esta VA, turma e período',
        );
      }
      throw error;
    }
  }

  async findAll(params: {
    classSubjectId?: string;
    academicPeriodId?: string;
    status?: EvaluationStatus;
    slot?: AssessmentSlot;
    currentUser: CurrentUserPayload;
  }) {
    const { currentUser } = params;
    const where: any = {};

    if (params.classSubjectId) where.classSubjectId = params.classSubjectId;
    if (params.academicPeriodId)
      where.academicPeriodId = params.academicPeriodId;
    if (params.status) where.status = params.status;
    if (params.slot) where.slot = params.slot;

    if (currentUser.role === UserRole.TEACHER) {
      where.classSubject = { teacherId: currentUser.teacherId ?? '__none__' };
    } else if (currentUser.role !== UserRole.SUPER_ADMIN_GLOBAL) {
      where.institutionId = currentUser.institutionId ?? '__none__';
    }

    return this.prisma.evaluation.findMany({
      where,
      orderBy: [{ academicPeriod: { orderNumber: 'asc' } }, { slot: 'asc' }],
      include: this.includeRelations(),
    });
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
      include: this.includeRelations(),
    });

    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    await this.assertInstitutionAccess(evaluation.institutionId, currentUser);
    return evaluation;
  }

  async approve(id: string, currentUser: CurrentUserPayload) {
    const evaluation = await this.findOne(id, currentUser);
    if (!managerRoles.has(currentUser.role)) {
      throw new ForbiddenException(
        'Somente a direção ou coordenação pode aprovar avaliações',
      );
    }
    if (evaluation.status !== EvaluationStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'Somente avaliações pendentes podem ser aprovadas',
      );
    }

    return this.prisma.evaluation.update({
      where: { id },
      data: {
        status: EvaluationStatus.APPROVED,
        rejectionReason: null,
        approvedAt: new Date(),
        approvedById: currentUser.userId,
      },
      include: this.includeRelations(),
    });
  }

  async reject(
    id: string,
    reason: string | undefined,
    currentUser: CurrentUserPayload,
  ) {
    const evaluation = await this.findOne(id, currentUser);
    if (!managerRoles.has(currentUser.role)) {
      throw new ForbiddenException(
        'Somente a direção ou coordenação pode reprovar avaliações',
      );
    }
    if (evaluation.status !== EvaluationStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'Somente avaliações pendentes podem ser reprovadas',
      );
    }

    return this.prisma.evaluation.update({
      where: { id },
      data: {
        status: EvaluationStatus.REJECTED,
        rejectionReason: reason?.trim() || 'Avaliação devolvida para revisão',
        approvedAt: null,
        approvedById: null,
      },
      include: this.includeRelations(),
    });
  }

  private async assertInstitutionAccess(
    institutionId: string,
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.role === UserRole.SUPER_ADMIN_GLOBAL) return;
    if (currentUser.institutionId === institutionId) return;

    const link = await this.prisma.userInstitution.findFirst({
      where: {
        userId: currentUser.userId,
        institutionId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException('Você não tem acesso a esta instituição');
    }
  }

  private includeRelations() {
    return {
      classSubject: {
        select: {
          id: true,
          class: { select: { id: true, name: true, grade: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
      },
      academicPeriod: {
        select: { id: true, name: true, orderNumber: true, type: true },
      },
      createdBy: {
        select: { id: true, name: true, firstName: true, lastName: true },
      },
      approvedBy: {
        select: { id: true, name: true, firstName: true, lastName: true },
      },
    } as const;
  }
}
