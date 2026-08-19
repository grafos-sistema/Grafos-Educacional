import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../../common/decorators';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

type RequestLike = {
  method: string;
  originalUrl?: string;
  params?: Record<string, string | undefined>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  user?: CurrentUserPayload;
};

type CachedInstitutions = { expiresAt: number; ids: Set<string> };

/**
 * Prevents cross-tenant IDOR before controllers access Prisma.
 *
 * RLS protects direct Supabase REST calls, but Prisma uses the database
 * connection role and must enforce tenant ownership in the API as well.
 */
@Injectable()
export class TenantScopeGuard implements CanActivate {
  private readonly institutionCache = new Map<string, CachedInstitutions>();

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestLike>();
    const user = request.user;
    if (!user) return true; // JwtAuthGuard is responsible for authentication.
    if (user.role === UserRole.SUPER_ADMIN_GLOBAL) return true;

    const allowedInstitutionIds = await this.getAllowedInstitutionIds(user);
    const requestedInstitutionId = this.readString(
      request.body?.institutionId ?? request.query?.institutionId,
    );

    if (
      requestedInstitutionId &&
      !allowedInstitutionIds.has(requestedInstitutionId)
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar dados desta instituição.',
      );
    }

    const attemptScope = request.params?.attemptId
      ? await this.prisma.examAttempt.findUnique({
          where: { id: request.params.attemptId },
          select: {
            studentId: true,
            exam: { select: { institutionId: true } },
          },
        })
      : undefined;

    if (
      attemptScope &&
      user.role === UserRole.STUDENT &&
      attemptScope.studentId !== user.studentId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta tentativa.',
      );
    }

    const targetInstitutionId =
      attemptScope?.exam.institutionId ??
      (await this.resolveTargetInstitutionId(request));
    if (
      targetInstitutionId !== undefined &&
      targetInstitutionId !== null &&
      !allowedInstitutionIds.has(targetInstitutionId)
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este registro.',
      );
    }

    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (isWrite && targetInstitutionId === null) {
      throw new ForbiddenException(
        'Somente o Super Admin Global pode alterar registros globais.',
      );
    }

    return true;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private async getAllowedInstitutionIds(
    user: CurrentUserPayload,
  ): Promise<Set<string>> {
    const cached = this.institutionCache.get(user.userId);
    if (cached && cached.expiresAt > Date.now()) return cached.ids;

    const links = await this.prisma.userInstitution.findMany({
      where: { userId: user.userId, isActive: true },
      select: { institutionId: true },
    });
    const ids = new Set(
      [user.institutionId, ...links.map((link) => link.institutionId)].filter(
        (id): id is string => Boolean(id),
      ),
    );

    this.institutionCache.set(user.userId, {
      ids,
      expiresAt: Date.now() + 30_000,
    });
    return ids;
  }

  private async resolveTargetInstitutionId(
    request: RequestLike,
  ): Promise<string | null | undefined> {
    const params = request.params ?? {};
    const path = (request.originalUrl ?? '').split('?')[0];
    const resource = path.split('/').filter(Boolean)[0];

    if (params.institutionId) return params.institutionId;
    if (params.userId) return this.institutionFromUser(params.userId);
    if (params.classId) return this.institutionFromClass(params.classId);
    if (params.studentId) return this.institutionFromStudent(params.studentId);
    if (params.teacherId) return this.institutionFromTeacher(params.teacherId);
    if (params.parentId) return this.institutionFromParent(params.parentId);
    if (params.subjectId) return this.institutionFromSubject(params.subjectId);
    if (params.classSubjectId)
      return this.institutionFromClassSubject(params.classSubjectId);
    if (params.submissionId)
      return this.institutionFromSubmission(params.submissionId);

    const id = params.id;
    if (!id || !resource) return undefined;

    switch (resource) {
      case 'institutions':
        return id;
      case 'users':
        return (
          await this.prisma.user.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'teachers':
        return this.institutionFromTeacher(id);
      case 'students':
        return this.institutionFromStudent(id);
      case 'parents':
        return this.institutionFromParent(id);
      case 'academic-years':
        return (
          await this.prisma.academicYear.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'academic-periods':
        return (
          await this.prisma.academicPeriod.findUnique({
            where: { id },
            select: { academicYear: { select: { institutionId: true } } },
          })
        )?.academicYear.institutionId;
      case 'courses':
        return (
          await this.prisma.course.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'subjects':
        return (
          await this.prisma.subject.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'classes':
        return this.institutionFromClass(id);
      case 'class-subjects':
        return this.institutionFromClassSubject(id);
      case 'class-subject-requests':
        return (
          await this.prisma.classSubjectRequest.findUnique({
            where: { id },
            select: { class: { select: { institutionId: true } } },
          })
        )?.class.institutionId;
      case 'enrollments':
        return (
          await this.prisma.classEnrollment.findUnique({
            where: { id },
            select: { class: { select: { institutionId: true } } },
          })
        )?.class.institutionId;
      case 'parent-students':
        return (
          await this.prisma.studentParent.findUnique({
            where: { id },
            select: {
              student: {
                select: { user: { select: { institutionId: true } } },
              },
            },
          })
        )?.student.user.institutionId;
      case 'teacher-subjects':
        return (
          await this.prisma.teacherSubject.findUnique({
            where: { id },
            select: {
              teacher: {
                select: { user: { select: { institutionId: true } } },
              },
            },
          })
        )?.teacher.user.institutionId;
      case 'schedules':
        return (
          await this.prisma.classSchedule.findUnique({
            where: { id },
            select: { class: { select: { institutionId: true } } },
          })
        )?.class.institutionId;
      case 'attendances':
        return (
          await this.prisma.attendance.findUnique({
            where: { id },
            select: { class: { select: { institutionId: true } } },
          })
        )?.class.institutionId;
      case 'grades':
        return (
          await this.prisma.grade.findUnique({
            where: { id },
            select: {
              classSubject: {
                select: { class: { select: { institutionId: true } } },
              },
            },
          })
        )?.classSubject.class.institutionId;
      case 'assignments':
        return (
          await this.prisma.assignment.findUnique({
            where: { id },
            select: {
              classSubject: {
                select: { class: { select: { institutionId: true } } },
              },
            },
          })
        )?.classSubject.class.institutionId;
      case 'lesson-contents':
        return (
          await this.prisma.lessonContent.findUnique({
            where: { id },
            select: {
              classSubject: {
                select: { class: { select: { institutionId: true } } },
              },
            },
          })
        )?.classSubject.class.institutionId;
      case 'lesson-plans':
        return (
          await this.prisma.lessonPlan.findUnique({
            where: { id },
            select: {
              classSubject: {
                select: { class: { select: { institutionId: true } } },
              },
            },
          })
        )?.classSubject.class.institutionId;
      case 'observations':
        return (
          await this.prisma.studentObservation.findUnique({
            where: { id },
            select: {
              student: {
                select: { user: { select: { institutionId: true } } },
              },
            },
          })
        )?.student.user.institutionId;
      case 'questions':
        return (
          await this.prisma.question.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'question-categories':
        return (
          await this.prisma.questionCategory.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'activities':
        return (
          await this.prisma.activity.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'announcements':
        return (
          await this.prisma.announcement.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      case 'events':
        return (
          await this.prisma.event.findUnique({
            where: { id },
            select: {
              academicYear: { select: { institutionId: true } },
            },
          })
        )?.academicYear.institutionId;
      case 'ideb': {
        const recordType = path.split('/').filter(Boolean)[1];
        if (recordType === 'targets') {
          return (
            await this.prisma.iDEBTarget.findUnique({
              where: { id },
              select: { institutionId: true },
            })
          )?.institutionId;
        }
        if (recordType === 'indicators') {
          return (
            await this.prisma.iDEBIndicator.findUnique({
              where: { id },
              select: { institutionId: true },
            })
          )?.institutionId;
        }
        return undefined;
      }
      case 'exams':
        return (
          await this.prisma.exam.findUnique({
            where: { id },
            select: { institutionId: true },
          })
        )?.institutionId;
      default:
        return undefined;
    }
  }

  private async institutionFromClass(id: string) {
    return (
      await this.prisma.class.findUnique({
        where: { id },
        select: { institutionId: true },
      })
    )?.institutionId;
  }

  private async institutionFromUser(id: string) {
    return (
      await this.prisma.user.findUnique({
        where: { id },
        select: { institutionId: true },
      })
    )?.institutionId;
  }

  private async institutionFromSubject(id: string) {
    return (
      await this.prisma.subject.findUnique({
        where: { id },
        select: { institutionId: true },
      })
    )?.institutionId;
  }

  private async institutionFromClassSubject(id: string) {
    return (
      await this.prisma.classSubject.findUnique({
        where: { id },
        select: { class: { select: { institutionId: true } } },
      })
    )?.class.institutionId;
  }

  private async institutionFromSubmission(id: string) {
    return (
      await this.prisma.assignmentSubmission.findUnique({
        where: { id },
        select: {
          assignment: {
            select: {
              classSubject: {
                select: { class: { select: { institutionId: true } } },
              },
            },
          },
        },
      })
    )?.assignment.classSubject.class.institutionId;
  }

  private async institutionFromTeacher(id: string) {
    return (
      await this.prisma.teacher.findUnique({
        where: { id },
        select: { user: { select: { institutionId: true } } },
      })
    )?.user.institutionId;
  }

  private async institutionFromStudent(id: string) {
    return (
      await this.prisma.student.findUnique({
        where: { id },
        select: { user: { select: { institutionId: true } } },
      })
    )?.user.institutionId;
  }

  private async institutionFromParent(id: string) {
    return (
      await this.prisma.parent.findUnique({
        where: { id },
        select: { user: { select: { institutionId: true } } },
      })
    )?.user.institutionId;
  }
}
