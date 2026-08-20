import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class EventsService {
  private readonly defaultAudienceRoles = [
    'STUDENTS',
    'PARENTS',
    'TEACHERS',
    'COLLABORATORS',
  ];

  constructor(private prisma: PrismaService) {}

  private jsonStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private isEventManager(currentUser: any) {
    return [
      UserRole.SUPER_ADMIN_GLOBAL,
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTION_ADMIN,
      UserRole.DIRECTOR,
      UserRole.COORDINATOR,
    ].includes(currentUser.role);
  }

  private roleAudience(currentUser: any): string[] {
    switch (currentUser.role) {
      case UserRole.STUDENT:
        return ['STUDENTS'];
      case UserRole.PARENT:
        return ['PARENTS'];
      case UserRole.TEACHER:
        return ['TEACHERS', 'COLLABORATORS'];
      default:
        return ['COLLABORATORS'];
    }
  }

  private async getAudienceContext(currentUser: any) {
    const classIds = new Set<string>();
    const courseIds = new Set<string>();

    if (currentUser.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
        select: {
          classSubjects: {
            select: { classId: true, class: { select: { courseId: true } } },
          },
          mainClasses: { select: { id: true, courseId: true } },
        },
      });

      teacher?.classSubjects.forEach((item) => {
        classIds.add(item.classId);
        courseIds.add(item.class.courseId);
      });
      teacher?.mainClasses.forEach((item) => {
        classIds.add(item.id);
        courseIds.add(item.courseId);
      });
    }

    if (currentUser.role === UserRole.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUser.userId },
        select: {
          classEnrollments: {
            where: { isActive: true },
            select: { classId: true, class: { select: { courseId: true } } },
          },
        },
      });

      student?.classEnrollments.forEach((item) => {
        classIds.add(item.classId);
        courseIds.add(item.class.courseId);
      });
    }

    if (currentUser.role === UserRole.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUser.userId },
        select: {
          children: {
            select: {
              student: {
                select: {
                  classEnrollments: {
                    where: { isActive: true },
                    select: { classId: true, class: { select: { courseId: true } } },
                  },
                },
              },
            },
          },
        },
      });

      parent?.children.forEach((child) => {
        child.student.classEnrollments.forEach((item) => {
          classIds.add(item.classId);
          courseIds.add(item.class.courseId);
        });
      });
    }

    return { classIds, courseIds };
  }

  private isVisibleToAudience(
    event: any,
    currentUser: any,
    context: { classIds: Set<string>; courseIds: Set<string> },
  ) {
    if (this.isEventManager(currentUser) || event.isGeneral !== false) {
      return true;
    }

    const roles = this.jsonStringArray(event.audienceRoles);
    if (!this.roleAudience(currentUser).some((role) => roles.includes(role))) {
      return false;
    }

    const targetClassIds = this.jsonStringArray(event.classIds);
    const targetCourseIds = this.jsonStringArray(event.courseIds);
    if (targetClassIds.length === 0 && targetCourseIds.length === 0) {
      return true;
    }

    return (
      targetClassIds.some((id) => context.classIds.has(id)) ||
      targetCourseIds.some((id) => context.courseIds.has(id))
    );
  }

  private async filterVisibleEvents(events: any[], currentUser: any) {
    if (this.isEventManager(currentUser)) return events;

    const context = await this.getAudienceContext(currentUser);
    return events.filter((event) =>
      this.isVisibleToAudience(event, currentUser, context),
    );
  }

  private async validateEventTargets(
    institutionId: string,
    academicYearId: string,
    courseIds: string[],
    classIds: string[],
  ) {
    const uniqueCourseIds = Array.from(new Set(courseIds));
    const uniqueClassIds = Array.from(new Set(classIds));

    if (uniqueCourseIds.length > 0) {
      const courseCount = await this.prisma.course.count({
        where: { id: { in: uniqueCourseIds }, institutionId, isActive: true },
      });
      if (courseCount !== uniqueCourseIds.length) {
        throw new BadRequestException('One or more selected courses are invalid');
      }
    }

    if (uniqueClassIds.length > 0) {
      const classCount = await this.prisma.class.count({
        where: {
          id: { in: uniqueClassIds },
          institutionId,
          academicYearId,
          isActive: true,
        },
      });
      if (classCount !== uniqueClassIds.length) {
        throw new BadRequestException('One or more selected classes are invalid');
      }
    }
  }

  private parseCsv(value?: string) {
    return value
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;
  }

  private async getAllowedInstitutionIds(currentUser: any) {
    const links = await this.prisma.userInstitution.findMany({
      where: { userId: currentUser.userId, isActive: true },
      select: { institutionId: true },
    });

    return Array.from(
      new Set(
        [
          currentUser.institutionId,
          ...links.map((link) => link.institutionId),
        ].filter((value): value is string => Boolean(value)),
      ),
    );
  }

  private async resolveEffectiveInstitutionIds(
    currentUser: any,
    options?: { institutionId?: string; institutionIds?: string[] },
  ) {
    const requested = Array.from(
      new Set(
        [
          ...(options?.institutionIds ?? []),
          ...(options?.institutionId ? [options.institutionId] : []),
        ].filter(Boolean),
      ),
    );

    if (
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN_GLOBAL
    ) {
      return requested.length > 0 ? requested : null;
    }

    const allowed = await this.getAllowedInstitutionIds(currentUser);

    const effective =
      requested.length > 0
        ? requested.filter((value) => allowed.includes(value))
        : currentUser.institutionId
          ? [currentUser.institutionId]
          : allowed;

    if (effective.length === 0) {
      throw new ForbiddenException(
        'You do not have access to this institution',
      );
    }

    return effective;
  }

  async create(createEventDto: CreateEventDto, currentUser: any) {
    // Verify academic year exists
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: createEventDto.academicYearId },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    await this.ensureInstitutionAccess(academicYear.institutionId, currentUser);

    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (!createEventDto.location?.trim()) {
      throw new BadRequestException('Event location is required');
    }

    const isGeneral = createEventDto.isGeneral ?? true;
    const audienceRoles = createEventDto.audienceRoles?.length
      ? createEventDto.audienceRoles
      : this.defaultAudienceRoles;

    if (!isGeneral && audienceRoles.length === 0) {
      throw new BadRequestException('Select at least one audience');
    }

    await this.validateEventTargets(
      academicYear.institutionId,
      academicYear.id,
      isGeneral ? [] : createEventDto.courseIds ?? [],
      isGeneral ? [] : createEventDto.classIds ?? [],
    );

    return this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        type: createEventDto.type,
        startDate,
        endDate,
        academicYearId: createEventDto.academicYearId,
        location: createEventDto.location.trim(),
        locationType: createEventDto.locationType,
        isAllDay: createEventDto.isAllDay || false,
        color: createEventDto.color,
        isGeneral,
        audienceRoles,
        courseIds: isGeneral ? [] : createEventDto.courseIds ?? [],
        classIds: isGeneral ? [] : createEventDto.classIds ?? [],
        requiresRsvp: createEventDto.requiresRsvp ?? false,
        attachments: createEventDto.attachments?.map((attachment) => ({ ...attachment })) ?? [],
      },
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryEventDto, currentUser: any) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      institutionId,
      institutionIds,
      academicYearId,
      fromDate,
      toDate,
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
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (type) {
      where.type = type;
    }

    // Date range filter
    if (fromDate || toDate) {
      where.OR = [
        // Events that start in the range
        {
          startDate: {
            gte: fromDate ? new Date(fromDate) : undefined,
            lte: toDate ? new Date(toDate) : undefined,
          },
        },
        // Events that end in the range
        {
          endDate: {
            gte: fromDate ? new Date(fromDate) : undefined,
            lte: toDate ? new Date(toDate) : undefined,
          },
        },
        // Events that span the entire range
        {
          AND: [
            { startDate: { lte: fromDate ? new Date(fromDate) : undefined } },
            { endDate: { gte: toDate ? new Date(toDate) : undefined } },
          ],
        },
      ];
    }

    // Filter by academic year
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    // Filter by institution through academicYear
    const effectiveInstitutionIds = await this.resolveEffectiveInstitutionIds(
      currentUser,
      {
        institutionId,
        institutionIds: this.parseCsv(institutionIds),
      },
    );

    if (effectiveInstitutionIds) {
      where.academicYear = {
        institutionId: { in: effectiveInstitutionIds },
      };
    }

    const allEvents = await this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });
    const visibleEvents = await this.filterVisibleEvents(allEvents, currentUser);
    const total = visibleEvents.length;
    const events = visibleEvents.slice(skip, skip + limit);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: any) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check access permissions
    await this.ensureAccessPermission(event, currentUser);
    const visible = await this.filterVisibleEvents([event], currentUser);
    if (visible.length === 0) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return event;
  }

  async getCalendar(query: CalendarQueryDto, currentUser: any) {
    const { year, month, institutionId, institutionIds, type } = query;

    // Calculate start and end of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Build where clause
    const where: any = {
      OR: [
        // Events that start in the month
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Events that end in the month
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Events that span the entire month
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ],
    };

    if (type) {
      where.type = type;
    }

    // Filter by institution through academicYear
    const effectiveInstitutionIds = await this.resolveEffectiveInstitutionIds(
      currentUser,
      {
        institutionId,
        institutionIds: this.parseCsv(institutionIds),
      },
    );

    if (effectiveInstitutionIds) {
      where.academicYear = {
        institutionId: { in: effectiveInstitutionIds },
      };
    }

    const allEvents = await this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });

    const events = await this.filterVisibleEvents(allEvents, currentUser);

    // Group events by day
    const calendar: Record<string, any[]> = {};

    events.forEach((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;

      // Add event to each day it occurs
      const currentDate = new Date(
        Math.max(eventStart.getTime(), startDate.getTime()),
      );
      const lastDate = new Date(
        Math.min(eventEnd.getTime(), endDate.getTime()),
      );

      while (currentDate <= lastDate) {
        const dayKey = currentDate.toISOString().split('T')[0];

        if (!calendar[dayKey]) {
          calendar[dayKey] = [];
        }

        calendar[dayKey].push(event);

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return {
      year,
      month,
      calendar,
      summary: {
        totalEvents: events.length,
        byType: this.groupByType(events),
      },
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto, currentUser: any) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permissions
    await this.ensureEditPermission(event, currentUser);

    // Verify academic year if being updated
    let targetAcademicYear: { id: string; institutionId: string } = event.academicYear;
    if (updateEventDto.academicYearId) {
      const academicYear = await this.prisma.academicYear.findUnique({
        where: { id: updateEventDto.academicYearId },
      });

      if (!academicYear) {
        throw new NotFoundException('Academic year not found');
      }
      await this.ensureInstitutionAccess(academicYear.institutionId, currentUser);
      targetAcademicYear = academicYear;
    }

    // Validate dates if being updated
    if (updateEventDto.startDate && updateEventDto.endDate) {
      const startDate = new Date(updateEventDto.startDate);
      const endDate = new Date(updateEventDto.endDate);

      if (endDate < startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    if (updateEventDto.location !== undefined && !updateEventDto.location.trim()) {
      throw new BadRequestException('Event location is required');
    }

    const nextIsGeneral = updateEventDto.isGeneral ?? event.isGeneral;
    await this.validateEventTargets(
      targetAcademicYear.institutionId,
      targetAcademicYear.id,
      nextIsGeneral ? [] : updateEventDto.courseIds ?? this.jsonStringArray(event.courseIds),
      nextIsGeneral ? [] : updateEventDto.classIds ?? this.jsonStringArray(event.classIds),
    );

    const updateData: any = {
      title: updateEventDto.title,
      description: updateEventDto.description,
      type: updateEventDto.type,
      academicYearId: updateEventDto.academicYearId,
      location: updateEventDto.location?.trim(),
      locationType: updateEventDto.locationType,
      isAllDay: updateEventDto.isAllDay,
      color: updateEventDto.color,
      isGeneral: updateEventDto.isGeneral,
      audienceRoles: updateEventDto.audienceRoles,
      courseIds: updateEventDto.isGeneral === true ? [] : updateEventDto.courseIds,
      classIds: updateEventDto.isGeneral === true ? [] : updateEventDto.classIds,
      requiresRsvp: updateEventDto.requiresRsvp,
      attachments: updateEventDto.attachments?.map((attachment) => ({ ...attachment })),
      startDate: updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : undefined,
      endDate: updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : undefined,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    return this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });
  }

  async remove(id: string, currentUser: any) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permissions
    await this.ensureEditPermission(event, currentUser);

    await this.prisma.event.delete({
      where: { id },
    });

    return { message: 'Event deleted successfully' };
  }

  private async ensureAccessPermission(event: any, currentUser: any) {
    const institutionId = event.academicYear?.institutionId;
    if (!institutionId) {
      throw new ForbiddenException('You do not have access to this event');
    }

    await this.ensureInstitutionAccess(institutionId, currentUser);
  }

  private async ensureInstitutionAccess(
    institutionId: string,
    currentUser: any,
  ) {
    if (
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN_GLOBAL
    ) {
      return;
    }

    const allowed = await this.getAllowedInstitutionIds(currentUser);
    if (!allowed.includes(institutionId)) {
      throw new ForbiddenException('You do not have access to this event');
    }
  }

  private async ensureEditPermission(event: any, currentUser: any) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (
      [
        UserRole.DIRECTOR,
        UserRole.INSTITUTION_ADMIN,
        UserRole.COORDINATOR,
      ].includes(currentUser.role)
    ) {
      await this.ensureAccessPermission(event, currentUser);
      return;
    }

    throw new ForbiddenException('You do not have permission to edit events');
  }

  async findUpcoming(
    days: number,
    currentUser: any,
    options?: { institutionId?: string; institutionIds?: string[] },
  ) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Build where clause
    const where: any = {
      startDate: {
        gte: now,
        lte: futureDate,
      },
    };

    // Filter by institution through academicYear
    const effectiveInstitutionIds = await this.resolveEffectiveInstitutionIds(
      currentUser,
      options,
    );

    if (effectiveInstitutionIds) {
      where.academicYear = {
        institutionId: { in: effectiveInstitutionIds },
      };
    }

    const allEvents = await this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        academicYear: {
          include: {
            institution: true,
          },
        },
      },
    });

    return this.filterVisibleEvents(allEvents, currentUser);
  }

  private groupByType(events: any[]): Record<string, number> {
    return events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
