import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  private getPublishDate(scheduledFor?: string | null) {
    if (!scheduledFor) {
      return new Date();
    }

    return new Date(scheduledFor);
  }

  private normalizeUserIds(ids?: string[]) {
    return Array.from(new Set((ids ?? []).filter(Boolean)));
  }

  private isManagementRole(role: UserRole) {
    return (
      role === UserRole.SUPER_ADMIN_GLOBAL ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.DIRECTOR ||
      role === UserRole.INSTITUTION_ADMIN ||
      role === UserRole.COORDINATOR
    );
  }

  private isGlobalAdmin(role: UserRole) {
    return (
      role === UserRole.SUPER_ADMIN_GLOBAL || role === UserRole.SUPER_ADMIN
    );
  }

  private normalizeTargetRoles(
    role: UserRole,
    requestedRoles: string[] | undefined,
    targetStudentIds: string[],
    targetParentIds: string[],
  ) {
    const isGlobal =
      role === UserRole.SUPER_ADMIN_GLOBAL || role === UserRole.SUPER_ADMIN;
    const allowedRoles = isGlobal
      ? Object.values(UserRole)
      : role === UserRole.TEACHER
        ? [
            UserRole.DIRECTOR,
            UserRole.INSTITUTION_ADMIN,
            UserRole.COORDINATOR,
            UserRole.TEACHER,
            UserRole.STUDENT,
            UserRole.PARENT,
          ]
        : [
            UserRole.DIRECTOR,
            UserRole.INSTITUTION_ADMIN,
            UserRole.COORDINATOR,
            UserRole.TEACHER,
            UserRole.STUDENT,
            UserRole.PARENT,
          ];

    const defaults =
      role === UserRole.TEACHER
        ? [UserRole.STUDENT, UserRole.PARENT]
        : [
            UserRole.DIRECTOR,
            UserRole.INSTITUTION_ADMIN,
            UserRole.COORDINATOR,
            UserRole.TEACHER,
          ];
    const roles = Array.from(
      new Set(
        (requestedRoles?.length ? requestedRoles : defaults).filter(
          (value): value is UserRole =>
            allowedRoles.includes(value as UserRole),
        ),
      ),
    );

    if (targetStudentIds.length > 0 && !roles.includes(UserRole.STUDENT)) {
      roles.push(UserRole.STUDENT);
    }
    if (targetParentIds.length > 0 && !roles.includes(UserRole.PARENT)) {
      roles.push(UserRole.PARENT);
    }
    // Todo aviso enviado para alunos também fica disponível para seus responsáveis.
    if (roles.includes(UserRole.STUDENT) && !roles.includes(UserRole.PARENT)) {
      roles.push(UserRole.PARENT);
    }

    return roles;
  }

  private async validateSpecificRecipients(
    institutionId: string,
    targetStudentIds?: string[],
    targetParentIds?: string[],
  ) {
    const normalizedStudentIds = this.normalizeUserIds(targetStudentIds);
    const normalizedParentIds = this.normalizeUserIds(targetParentIds);
    const requestedIds = [...normalizedStudentIds, ...normalizedParentIds];

    if (requestedIds.length === 0) {
      return {
        targetStudentIds: normalizedStudentIds,
        targetParentIds: normalizedParentIds,
      };
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: requestedIds },
      },
      select: {
        id: true,
        role: true,
        institutionId: true,
      },
    });

    if (users.length !== requestedIds.length) {
      throw new NotFoundException(
        'One or more specific recipients were not found',
      );
    }

    const userMap = new Map(users.map((user) => [user.id, user]));

    normalizedStudentIds.forEach((id) => {
      const user = userMap.get(id);
      if (!user || user.role !== UserRole.STUDENT) {
        throw new BadRequestException(
          'Specific student recipients must be student users',
        );
      }
      if (user.institutionId !== institutionId) {
        throw new ForbiddenException(
          'Specific student recipients must belong to the same institution',
        );
      }
    });

    normalizedParentIds.forEach((id) => {
      const user = userMap.get(id);
      if (!user || user.role !== UserRole.PARENT) {
        throw new BadRequestException(
          'Specific parent recipients must be parent users',
        );
      }
      if (user.institutionId !== institutionId) {
        throw new ForbiddenException(
          'Specific parent recipients must belong to the same institution',
        );
      }
    });

    return {
      targetStudentIds: normalizedStudentIds,
      targetParentIds: normalizedParentIds,
    };
  }

  private async getLinkedStudentUserIdsForParent(parentUserId: string) {
    const links = await this.prisma.studentParent.findMany({
      where: {
        parent: {
          userId: parentUserId,
        },
      },
      select: {
        student: {
          select: {
            userId: true,
          },
        },
      },
    });

    return this.normalizeUserIds(
      links
        .map((link) => link.student.userId)
        .filter((userId): userId is string => Boolean(userId)),
    );
  }

  private async buildRecipientVisibilityWhere(currentUser: any) {
    if (this.isManagementRole(currentUser.role)) {
      return null;
    }

    if (currentUser.role === UserRole.STUDENT) {
      return {
        OR: [
          {
            AND: [
              { targetRoles: { has: UserRole.STUDENT } },
              { targetStudentIds: { isEmpty: true } },
            ],
          },
          {
            targetStudentIds: {
              has: currentUser.userId,
            },
          },
        ],
      };
    }

    if (currentUser.role === UserRole.PARENT) {
      const linkedStudentUserIds = await this.getLinkedStudentUserIdsForParent(
        currentUser.userId,
      );

      const parentConditions: any[] = [
        {
          AND: [
            { targetRoles: { has: UserRole.PARENT } },
            { targetParentIds: { isEmpty: true } },
            { targetStudentIds: { isEmpty: true } },
          ],
        },
        {
          targetParentIds: {
            has: currentUser.userId,
          },
        },
      ];

      if (linkedStudentUserIds.length > 0) {
        parentConditions.push({
          targetStudentIds: {
            hasSome: linkedStudentUserIds,
          },
        });
      }

      return {
        OR: parentConditions,
      };
    }

    return {
      targetRoles: {
        has: currentUser.role,
      },
    };
  }

  private async hasRecipientAccess(announcement: any, currentUser: any) {
    if (this.isManagementRole(currentUser.role)) {
      return true;
    }

    const targetStudentIds = announcement.targetStudentIds ?? [];
    const targetParentIds = announcement.targetParentIds ?? [];

    if (currentUser.role === UserRole.STUDENT) {
      if (targetStudentIds.includes(currentUser.userId)) {
        return true;
      }

      return (
        announcement.targetRoles.includes(UserRole.STUDENT) &&
        targetStudentIds.length === 0
      );
    }

    if (currentUser.role === UserRole.PARENT) {
      if (targetParentIds.includes(currentUser.userId)) {
        return true;
      }

      const linkedStudentUserIds = await this.getLinkedStudentUserIdsForParent(
        currentUser.userId,
      );
      if (
        linkedStudentUserIds.some((studentUserId) =>
          targetStudentIds.includes(studentUserId),
        )
      ) {
        return true;
      }

      return (
        announcement.targetRoles.includes(UserRole.PARENT) &&
        targetParentIds.length === 0 &&
        targetStudentIds.length === 0
      );
    }

    return announcement.targetRoles.includes(currentUser.role);
  }

  async create(createAnnouncementDto: CreateAnnouncementDto, currentUser: any) {
    // Require institutionId
    if (!createAnnouncementDto.institutionId) {
      throw new BadRequestException('Institution ID is required');
    }

    // Verify institution
    const institution = await this.prisma.institution.findUnique({
      where: { id: createAnnouncementDto.institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    const specificRecipients = await this.validateSpecificRecipients(
      createAnnouncementDto.institutionId,
      createAnnouncementDto.targetStudentIds,
      createAnnouncementDto.targetParentIds,
    );
    const targetRoles = this.normalizeTargetRoles(
      currentUser.role,
      createAnnouncementDto.targetRoles,
      specificRecipients.targetStudentIds,
      specificRecipients.targetParentIds,
    );

    if (targetRoles.length === 0) {
      throw new BadRequestException(
        'Selecione pelo menos um público para o comunicado',
      );
    }

    const publishDate = this.getPublishDate(createAnnouncementDto.scheduledFor);
    const now = new Date();

    if (Number.isNaN(publishDate.getTime())) {
      throw new BadRequestException('Scheduled publish date is invalid');
    }

    if (createAnnouncementDto.scheduledFor && publishDate <= now) {
      throw new BadRequestException(
        'Scheduled publish date must be in the future',
      );
    }

    // Validate expiration date
    if (createAnnouncementDto.expiresAt) {
      const expiresDate = new Date(createAnnouncementDto.expiresAt);

      if (expiresDate <= publishDate) {
        throw new BadRequestException(
          'Expiration date must be after publish date',
        );
      }
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        title: createAnnouncementDto.title,
        content: createAnnouncementDto.content,
        priority: createAnnouncementDto.priority,
        targetRoles,
        targetStudentIds: specificRecipients.targetStudentIds,
        targetParentIds: specificRecipients.targetParentIds,
        institutionId: createAnnouncementDto.institutionId,
        expiresAt: createAnnouncementDto.expiresAt
          ? new Date(createAnnouncementDto.expiresAt)
          : null,
        attachments: createAnnouncementDto.attachments
          ? JSON.stringify(createAnnouncementDto.attachments)
          : null,
        createdById: currentUser.userId,
        isPublished: true,
        publishedAt: publishDate,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        institution: true,
      },
    });

    return announcement;
  }

  async findAll(query: QueryAnnouncementDto, currentUser: any) {
    const {
      page = 1,
      limit = 10,
      search,
      priority,
      institutionId,
      targetRole,
      onlyPublished = true,
      onlyActive = true,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { AND: [] };

    if (search) {
      where.AND.push({
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (priority) {
      where.AND.push({ priority });
    }

    if (onlyPublished) {
      where.AND.push({ isPublished: true });
      where.AND.push({
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      });
    }

    if (onlyActive) {
      where.AND.push({
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      });
    }

    if (!this.isGlobalAdmin(currentUser.role)) {
      where.AND.push({
        OR: [
          { institutionId: currentUser.institutionId },
          { institutionId: null },
        ],
      });
    } else if (institutionId) {
      where.AND.push({ institutionId });
    }

    if (targetRole) {
      where.AND.push({
        targetRoles: {
          has: targetRole,
        },
      });
    }

    const recipientWhere =
      await this.buildRecipientVisibilityWhere(currentUser);
    if (recipientWhere) {
      where.AND.push(recipientWhere);
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          institution: true,
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data: announcements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: any) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        institution: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check access permissions
    await this.checkAccessPermission(announcement, currentUser);

    return announcement;
  }

  async update(
    id: string,
    updateAnnouncementDto: UpdateAnnouncementDto,
    currentUser: any,
  ) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        institution: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check permissions
    this.checkEditPermission(announcement, currentUser);

    // Verify institution if being updated
    if (updateAnnouncementDto.institutionId) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: updateAnnouncementDto.institutionId },
      });

      if (!institution) {
        throw new NotFoundException('Institution not found');
      }
    }

    const effectiveInstitutionId =
      updateAnnouncementDto.institutionId ?? announcement.institutionId;

    if (!effectiveInstitutionId) {
      throw new BadRequestException(
        'Institution ID is required to update specific recipients',
      );
    }

    const specificRecipients = await this.validateSpecificRecipients(
      effectiveInstitutionId,
      updateAnnouncementDto.targetStudentIds ?? announcement.targetStudentIds,
      updateAnnouncementDto.targetParentIds ?? announcement.targetParentIds,
    );

    // Validate expiration date if being updated
    if (updateAnnouncementDto.expiresAt) {
      const expiresDate = new Date(updateAnnouncementDto.expiresAt);
      const referenceDate = updateAnnouncementDto.scheduledFor
        ? this.getPublishDate(updateAnnouncementDto.scheduledFor)
        : announcement.publishedAt || new Date();

      if (expiresDate <= referenceDate) {
        throw new BadRequestException(
          'Expiration date must be after publish date',
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...updateAnnouncementDto };
    updateData.targetStudentIds = specificRecipients.targetStudentIds;
    updateData.targetParentIds = specificRecipients.targetParentIds;
    updateData.targetRoles = this.normalizeTargetRoles(
      currentUser.role,
      updateAnnouncementDto.targetRoles ?? announcement.targetRoles,
      specificRecipients.targetStudentIds,
      specificRecipients.targetParentIds,
    );
    if (updateAnnouncementDto.scheduledFor) {
      const scheduledPublishDate = this.getPublishDate(
        updateAnnouncementDto.scheduledFor,
      );

      if (Number.isNaN(scheduledPublishDate.getTime())) {
        throw new BadRequestException('Scheduled publish date is invalid');
      }

      if (scheduledPublishDate <= new Date()) {
        throw new BadRequestException(
          'Scheduled publish date must be in the future',
        );
      }

      updateData.isPublished = true;
      updateData.publishedAt = scheduledPublishDate;
    }
    if (updateAnnouncementDto.expiresAt) {
      updateData.expiresAt = new Date(updateAnnouncementDto.expiresAt);
    }
    if (updateAnnouncementDto.expiresAt === null) {
      updateData.expiresAt = null;
    }
    if (updateAnnouncementDto.attachments) {
      updateData.attachments = JSON.stringify(
        updateAnnouncementDto.attachments,
      );
    }

    return this.prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        institution: true,
      },
    });
  }

  async remove(id: string, currentUser: any) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        institution: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check permissions
    this.checkEditPermission(announcement, currentUser);

    await this.prisma.announcement.delete({
      where: { id },
    });

    return { message: 'Announcement deleted successfully' };
  }

  async publish(id: string, currentUser: any) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        institution: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check permissions
    this.checkEditPermission(announcement, currentUser);

    const isScheduledForFuture =
      announcement.isPublished &&
      Boolean(announcement.publishedAt) &&
      new Date(announcement.publishedAt as Date).getTime() > Date.now();

    if (announcement.isPublished && !isScheduledForFuture) {
      throw new BadRequestException('Announcement is already published');
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        institution: true,
      },
    });
  }

  async unpublish(id: string, currentUser: any) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        institution: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check permissions
    this.checkEditPermission(announcement, currentUser);

    if (!announcement.isPublished) {
      throw new BadRequestException('Announcement is not published');
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        institution: true,
      },
    });
  }

  private async checkAccessPermission(announcement: any, currentUser: any) {
    // SUPER_ADMIN can access everything
    if (this.isGlobalAdmin(currentUser.role)) {
      return;
    }

    // Check if announcement is for user's institution or is global
    if (
      announcement.institutionId &&
      announcement.institutionId !== currentUser.institutionId
    ) {
      throw new ForbiddenException(
        'You do not have access to this announcement',
      );
    }

    if (this.isManagementRole(currentUser.role)) {
      return;
    }

    const hasAccess = await this.hasRecipientAccess(announcement, currentUser);
    if (!hasAccess) {
      throw new ForbiddenException(
        'This announcement is not targeted to your role',
      );
    }
  }

  private checkEditPermission(announcement: any, currentUser: any) {
    // SUPER_ADMIN can edit everything
    if (this.isGlobalAdmin(currentUser.role)) {
      return;
    }

    // INSTITUTION_ADMIN and COORDINATOR can edit announcements in their institution
    if (
      [
        UserRole.DIRECTOR,
        UserRole.INSTITUTION_ADMIN,
        UserRole.COORDINATOR,
        UserRole.TEACHER,
      ].includes(currentUser.role)
    ) {
      if (
        currentUser.role === UserRole.TEACHER &&
        announcement.createdById !== currentUser.userId
      ) {
        throw new ForbiddenException(
          'Você só pode editar comunicados criados por você',
        );
      }
      // Check if announcement is for user's institution
      if (
        announcement.institutionId &&
        announcement.institutionId !== currentUser.institutionId
      ) {
        throw new ForbiddenException(
          'You do not have access to edit this announcement',
        );
      }
      return;
    }

    // Other roles cannot edit announcements
    throw new ForbiddenException(
      'You do not have permission to edit announcements',
    );
  }

  async findActiveForUser(
    currentUser: any,
    options?: { institutionId?: string; institutionIds?: string[] },
  ) {
    // Build where clause for active, published announcements
    const where: any = {
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    // Filter by institution
    if (!this.isGlobalAdmin(currentUser.role)) {
      const links = await this.prisma.userInstitution.findMany({
        where: { userId: currentUser.userId, isActive: true },
        select: { institutionId: true },
      });

      const allowed = Array.from(
        new Set(
          [
            currentUser.institutionId,
            ...links.map((link) => link.institutionId),
          ].filter((value): value is string => Boolean(value)),
        ),
      );

      const requested = Array.from(
        new Set(
          [
            ...(options?.institutionIds ?? []),
            ...(options?.institutionId ? [options.institutionId] : []),
          ].filter(Boolean),
        ),
      );

      const effective =
        requested.length > 0
          ? requested.filter((value) => allowed.includes(value))
          : allowed.length > 0 && currentUser.institutionId
            ? [currentUser.institutionId]
            : allowed;

      where.AND = [
        {
          OR: [
            ...(effective.length > 0
              ? [{ institutionId: { in: effective } }]
              : [{ institutionId: currentUser.institutionId }]),
            { institutionId: null }, // Global announcements
          ],
        },
        {
          OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
        },
      ];
    }

    const recipientWhere =
      await this.buildRecipientVisibilityWhere(currentUser);
    if (recipientWhere) {
      where.AND = [...(where.AND ?? []), recipientWhere];
    }

    const announcements = await this.prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        institution: true,
      },
    });

    return announcements;
  }
}
