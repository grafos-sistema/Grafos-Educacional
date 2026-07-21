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

  async create(createAnnouncementDto: CreateAnnouncementDto, userId: string) {
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

    // Validate expiration date
    if (createAnnouncementDto.expiresAt) {
      const expiresDate = new Date(createAnnouncementDto.expiresAt);
      const currentDate = new Date();

      if (expiresDate <= currentDate) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Published immediately by default
    const isPublished = true;

    const announcement = await this.prisma.announcement.create({
      data: {
        title: createAnnouncementDto.title,
        content: createAnnouncementDto.content,
        priority: createAnnouncementDto.priority,
        targetRoles: createAnnouncementDto.targetRoles,
        institutionId: createAnnouncementDto.institutionId,
        expiresAt: createAnnouncementDto.expiresAt
          ? new Date(createAnnouncementDto.expiresAt)
          : null,
        attachments: createAnnouncementDto.attachments
          ? JSON.stringify(createAnnouncementDto.attachments)
          : null,
        createdById: userId,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
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
    const where: any = {};

    if (search) {
      where.OR = [
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
      ];
    }

    if (priority) {
      where.priority = priority;
    }

    // Filter by published status
    if (onlyPublished) {
      where.isPublished = true;
    }

    // Filter by active status (not expired)
    if (onlyActive) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    // Filter by institution
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      // Non-super admins can only see announcements for their institution or global announcements
      where.OR = [
        { institutionId: currentUser.institutionId },
        { institutionId: null }, // Global announcements
      ];
    } else if (institutionId) {
      where.institutionId = institutionId;
    }

    // Filter by target role
    if (targetRole) {
      where.targetRoles = {
        has: targetRole,
      };
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      // Filter announcements relevant to user's role
      where.targetRoles = {
        has: currentUser.role,
      };
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { publishedAt: 'desc' },
        ],
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
    this.checkAccessPermission(announcement, currentUser);

    return announcement;
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto, currentUser: any) {
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


    // Validate expiration date if being updated
    if (updateAnnouncementDto.expiresAt) {
      const expiresDate = new Date(updateAnnouncementDto.expiresAt);
      const referenceDate = announcement.publishedAt || new Date();

      if (expiresDate <= referenceDate) {
        throw new BadRequestException('Expiration date must be after publish date');
      }
    }

    // Prepare update data
    const updateData: any = { ...updateAnnouncementDto };
    if (updateAnnouncementDto.expiresAt) {
      updateData.expiresAt = new Date(updateAnnouncementDto.expiresAt);
    }
    if (updateAnnouncementDto.attachments) {
      updateData.attachments = JSON.stringify(updateAnnouncementDto.attachments);
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

    if (announcement.isPublished) {
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

  private checkAccessPermission(announcement: any, currentUser: any) {
    // SUPER_ADMIN can access everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Check if announcement is for user's institution or is global
    if (
      announcement.institutionId &&
      announcement.institutionId !== currentUser.institutionId
    ) {
      throw new ForbiddenException('You do not have access to this announcement');
    }

    // Check if announcement targets user's role
    if (!announcement.targetRoles.includes(currentUser.role)) {
      throw new ForbiddenException('This announcement is not targeted to your role');
    }
  }

  private checkEditPermission(announcement: any, currentUser: any) {
    // SUPER_ADMIN can edit everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // INSTITUTION_ADMIN and COORDINATOR can edit announcements in their institution
    if (
      [UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR].includes(currentUser.role)
    ) {
      // Check if announcement is for user's institution
      if (
        announcement.institutionId &&
        announcement.institutionId !== currentUser.institutionId
      ) {
        throw new ForbiddenException('You do not have access to edit this announcement');
      }
      return;
    }

    // Other roles cannot edit announcements
    throw new ForbiddenException('You do not have permission to edit announcements');
  }

  async findActiveForUser(currentUser: any) {
    // Build where clause for active, published announcements
    const where: any = {
      isPublished: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    // Filter by institution
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      // Non-super admins can only see announcements for their institution or global announcements
      where.AND = [
        {
          OR: [
            { institutionId: currentUser.institutionId },
            { institutionId: null }, // Global announcements
          ],
        },
        // Filter announcements relevant to user's role
        {
          targetRoles: {
            has: currentUser.role,
          },
        },
      ];
    }

    const announcements = await this.prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
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
