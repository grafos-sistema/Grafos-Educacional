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
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    // Verify academic year exists
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: createEventDto.academicYearId },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        type: createEventDto.type,
        startDate,
        endDate,
        academicYearId: createEventDto.academicYearId,
        location: createEventDto.location,
        isAllDay: createEventDto.isAllDay || false,
        color: createEventDto.color,
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
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.academicYear = {
        institutionId: currentUser.institutionId,
      };
    } else if (institutionId) {
      where.academicYear = {
        institutionId: institutionId,
      };
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          academicYear: {
            include: {
              institution: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

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
    this.checkAccessPermission(event, currentUser);

    return event;
  }

  async getCalendar(query: CalendarQueryDto, currentUser: any) {
    const { year, month, institutionId, type } = query;

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
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.academicYear = {
        institutionId: currentUser.institutionId,
      };
    } else if (institutionId) {
      where.academicYear = {
        institutionId: institutionId,
      };
    }

    const events = await this.prisma.event.findMany({
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

    // Group events by day
    const calendar: Record<string, any[]> = {};

    events.forEach((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;

      // Add event to each day it occurs
      let currentDate = new Date(Math.max(eventStart.getTime(), startDate.getTime()));
      const lastDate = new Date(Math.min(eventEnd.getTime(), endDate.getTime()));

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
    this.checkEditPermission(event, currentUser);

    // Verify academic year if being updated
    if (updateEventDto.academicYearId) {
      const academicYear = await this.prisma.academicYear.findUnique({
        where: { id: updateEventDto.academicYearId },
      });

      if (!academicYear) {
        throw new NotFoundException('Academic year not found');
      }
    }

    // Validate dates if being updated
    if (updateEventDto.startDate && updateEventDto.endDate) {
      const startDate = new Date(updateEventDto.startDate);
      const endDate = new Date(updateEventDto.endDate);

      if (endDate < startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startDate: updateEventDto.startDate ? new Date(updateEventDto.startDate) : undefined,
        endDate: updateEventDto.endDate ? new Date(updateEventDto.endDate) : undefined,
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
    this.checkEditPermission(event, currentUser);

    await this.prisma.event.delete({
      where: { id },
    });

    return { message: 'Event deleted successfully' };
  }

  private checkAccessPermission(event: any, currentUser: any) {
    // SUPER_ADMIN can access everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Check if event is for user's institution through academicYear
    if (
      event.academicYear?.institutionId &&
      event.academicYear.institutionId !== currentUser.institutionId
    ) {
      throw new ForbiddenException('You do not have access to this event');
    }
  }

  private checkEditPermission(event: any, currentUser: any) {
    // SUPER_ADMIN can edit everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // INSTITUTION_ADMIN and COORDINATOR can edit events in their institution
    if (
      [UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR].includes(currentUser.role)
    ) {
      // Check if event is for user's institution through academicYear
      if (
        event.academicYear?.institutionId &&
        event.academicYear.institutionId !== currentUser.institutionId
      ) {
        throw new ForbiddenException('You do not have access to edit this event');
      }
      return;
    }

    // Other roles cannot edit events
    throw new ForbiddenException('You do not have permission to edit events');
  }

  async findUpcoming(days: number, currentUser: any) {
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
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.academicYear = {
        institutionId: currentUser.institutionId,
      };
    }

    const events = await this.prisma.event.findMany({
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

    return events;
  }

  private groupByType(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
