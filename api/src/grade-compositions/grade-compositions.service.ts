import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GradeCompositionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateGradeCompositionDto } from './dto';

const managerRoles = new Set<UserRole>([
  UserRole.SUPER_ADMIN_GLOBAL,
  UserRole.SUPER_ADMIN,
  UserRole.DIRECTOR,
  UserRole.INSTITUTION_ADMIN,
  UserRole.COORDINATOR,
]);

@Injectable()
export class GradeCompositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateGradeCompositionDto,
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException(
        'A composição deve ser enviada pelo professor responsável',
      );
    }

    if (!currentUser.teacherId) {
      throw new ForbiddenException('Perfil de professor não encontrado');
    }

    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academicPeriodId },
      select: {
        id: true,
        academicYear: { select: { id: true, institutionId: true } },
      },
    });

    if (!period) {
      throw new NotFoundException('Período acadêmico não encontrado');
    }

    await this.assertInstitutionAccess(
      period.academicYear.institutionId,
      currentUser,
    );

    const teacherHasAssignment = await this.prisma.classSubject.findFirst({
      where: {
        teacherId: currentUser.teacherId,
        class: { academicYearId: period.academicYear.id },
      },
      select: { id: true },
    });

    if (!teacherHasAssignment) {
      throw new ForbiddenException(
        'Você não possui uma turma vinculada a este período acadêmico',
      );
    }

    this.validateWeights(dto);

    const existing = await this.prisma.gradeComposition.findUnique({
      where: {
        teacherId_academicPeriodId: {
          teacherId: currentUser.teacherId,
          academicPeriodId: dto.academicPeriodId,
        },
      },
      select: { id: true, status: true },
    });

    if (existing?.status === GradeCompositionStatus.APPROVED) {
      throw new ConflictException(
        'A composição deste bimestre já foi aprovada e não pode ser alterada',
      );
    }

    if (existing?.status === GradeCompositionStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'A composição deste bimestre já está aguardando análise',
      );
    }

    const data = {
      assessmentCount: dto.assessmentCount,
      va1Weight: dto.va1Weight,
      va2Weight: dto.assessmentCount >= 2 ? dto.va2Weight! : null,
      va3Weight: dto.assessmentCount >= 3 ? dto.va3Weight! : null,
      va4Weight: dto.assessmentCount >= 4 ? dto.va4Weight! : null,
      status: GradeCompositionStatus.PENDING_APPROVAL,
      reviewNote: null,
      reviewedAt: null,
      reviewedById: null,
      submittedAt: new Date(),
      submittedById: currentUser.userId,
    };

    const composition = existing
      ? await this.prisma.gradeComposition.update({
          where: { id: existing.id },
          data,
          include: this.includeRelations(),
        })
      : await this.prisma.gradeComposition.create({
          data: {
            ...data,
            teacherId: currentUser.teacherId,
            academicPeriodId: dto.academicPeriodId,
          },
          include: this.includeRelations(),
        });

    return composition;
  }

  async findAll(params: {
    academicPeriodId?: string;
    status?: GradeCompositionStatus;
    currentUser: CurrentUserPayload;
  }) {
    const { currentUser } = params;
    const where: any = {};

    if (params.academicPeriodId) {
      where.academicPeriodId = params.academicPeriodId;
    }
    if (params.status) where.status = params.status;

    if (currentUser.role === UserRole.TEACHER) {
      where.teacherId = currentUser.teacherId ?? '__none__';
    } else if (currentUser.role !== UserRole.SUPER_ADMIN_GLOBAL) {
      where.academicPeriod = {
        academicYear: {
          institutionId: currentUser.institutionId ?? '__none__',
        },
      };
    }

    return this.prisma.gradeComposition.findMany({
      where,
      orderBy: [{ status: 'asc' }, { submittedAt: 'asc' }],
      include: this.includeRelations(),
    });
  }

  async approve(id: string, currentUser: CurrentUserPayload) {
    const composition = await this.findOne(id, currentUser);
    this.assertManager(currentUser);

    if (composition.status !== GradeCompositionStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'Somente composições aguardando análise podem ser aprovadas',
      );
    }

    return this.prisma.gradeComposition.update({
      where: { id },
      data: {
        status: GradeCompositionStatus.APPROVED,
        reviewNote: null,
        reviewedAt: new Date(),
        reviewedById: currentUser.userId,
      },
      include: this.includeRelations(),
    });
  }

  async requestChanges(
    id: string,
    reason: string | undefined,
    currentUser: CurrentUserPayload,
  ) {
    const composition = await this.findOne(id, currentUser);
    this.assertManager(currentUser);

    if (composition.status !== GradeCompositionStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'Somente composições aguardando análise podem ser devolvidas',
      );
    }

    return this.prisma.gradeComposition.update({
      where: { id },
      data: {
        status: GradeCompositionStatus.CHANGES_REQUESTED,
        reviewNote: reason?.trim() || 'Revise a composição e envie novamente.',
        reviewedAt: new Date(),
        reviewedById: currentUser.userId,
      },
      include: this.includeRelations(),
    });
  }

  private async findOne(id: string, currentUser: CurrentUserPayload) {
    const composition = await this.prisma.gradeComposition.findUnique({
      where: { id },
      include: this.includeRelations(),
    });

    if (!composition) {
      throw new NotFoundException('Composição da nota não encontrada');
    }

    await this.assertInstitutionAccess(
      composition.academicPeriod.academicYear.institutionId,
      currentUser,
    );

    if (
      currentUser.role === UserRole.TEACHER &&
      composition.teacherId !== currentUser.teacherId
    ) {
      throw new ForbiddenException(
        'Você não tem acesso a esta composição de notas',
      );
    }

    return composition;
  }

  private assertManager(currentUser: CurrentUserPayload) {
    if (!managerRoles.has(currentUser.role)) {
      throw new ForbiddenException(
        'Somente a direção ou coordenação pode analisar a composição',
      );
    }
  }

  private validateWeights(dto: CreateGradeCompositionDto) {
    const weights = [
      dto.va1Weight,
      dto.va2Weight,
      dto.va3Weight,
      dto.va4Weight,
    ];
    const activeWeights = weights.slice(0, dto.assessmentCount);
    const inactiveWeights = weights.slice(dto.assessmentCount);

    if (
      activeWeights.some(
        (weight) =>
          typeof weight !== 'number' ||
          !Number.isInteger(weight) ||
          weight < 1 ||
          weight > 100,
      )
    ) {
      throw new BadRequestException(
        'Cada peso deve ser um número inteiro entre 1% e 100%',
      );
    }

    if (
      inactiveWeights.some((weight) => weight !== undefined && weight !== null)
    ) {
      throw new BadRequestException(
        'Informe pesos somente para as avaliações selecionadas',
      );
    }

    const total = activeWeights.reduce<number>(
      (sum, weight) => sum + Number(weight ?? 0),
      0,
    );
    if (total !== 100) {
      throw new BadRequestException(
        'A soma dos pesos das avaliações deve totalizar exatamente 100%',
      );
    }
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
      teacher: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      classSubject: {
        select: {
          id: true,
          teacherId: true,
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              institutionId: true,
              academicYearId: true,
            },
          },
          subject: { select: { id: true, name: true, code: true } },
        },
      },
      academicPeriod: {
        select: {
          id: true,
          name: true,
          orderNumber: true,
          type: true,
          academicYearId: true,
          academicYear: { select: { institutionId: true } },
        },
      },
      submittedBy: {
        select: { id: true, name: true, firstName: true, lastName: true },
      },
      reviewedBy: {
        select: { id: true, name: true, firstName: true, lastName: true },
      },
    } as const;
  }
}
