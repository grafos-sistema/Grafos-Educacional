import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { QueryObservationDto } from './dto/query-observation.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ObservationsService {
  constructor(private prisma: PrismaService) {}

  async create(createObservationDto: CreateObservationDto, userId: string) {
    // Verify the student exists
    const student = await this.prisma.student.findUnique({
      where: { id: createObservationDto.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get the user creating the observation
    const observer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!observer) {
      throw new NotFoundException('Observer user not found');
    }

    // Create the observation
    const observation = await this.prisma.studentObservation.create({
      data: {
        studentId: createObservationDto.studentId,
        teacherId: userId,
        title: createObservationDto.title,
        description: createObservationDto.description,
        type: createObservationDto.type,
        isPrivate: createObservationDto.isPrivate ?? false,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Send notifications to parents if requested
    if (createObservationDto.notifyParents && !createObservationDto.isPrivate) {
      await this.notifyParents(observation.id, student.id);
    }

    return observation;
  }

  async findAll(query: QueryObservationDto, currentUser: any) {
    const { page = 1, limit = 10, studentId, type, classId, institutionId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (type) {
      where.type = type;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.date.lte = new Date(toDate);
      }
    }

    // Filter by institution if not SUPER_ADMIN
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.student = {
        user: {
          institutionId: currentUser.institutionId,
        },
      };
    } else if (institutionId) {
      where.student = {
        user: {
          institutionId,
        },
      };
    }

    // Filter by class if specified
    if (classId) {
      where.student = {
        ...where.student,
        enrollments: {
          some: {
            classId,
            status: 'ACTIVE',
          },
        },
      };
    }

    // Parents should only see non-private observations of their children
    if (currentUser.role === UserRole.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUser.id },
        include: { children: true },
      });

      if (parent) {
        const studentIds = parent.children.map(sp => sp.studentId);
        where.studentId = { in: studentIds };
        where.isPrivate = false;
      } else {
        // If parent has no children linked, return empty
        where.studentId = { in: [] };
      }
    }

    const [observations, total] = await Promise.all([
      this.prisma.studentObservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.studentObservation.count({ where }),
    ]);

    return {
      data: observations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: any) {
    const observation = await this.prisma.studentObservation.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                institutionId: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!observation) {
      throw new NotFoundException('Observation not found');
    }

    // Check access permissions
    this.checkAccessPermission(observation, currentUser);

    return observation;
  }

  async findByStudent(studentId: string, currentUser: any) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Build where clause
    const where: any = { studentId };

    // Parents should only see non-private observations
    if (currentUser.role === UserRole.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUser.id },
        include: { children: true },
      });

      const hasAccess = parent?.children.some(sp => sp.studentId === studentId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this student');
      }

      where.isPrivate = false;
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      // Check institution access
      if (student.user.institutionId !== currentUser.institutionId) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    const observations = await this.prisma.studentObservation.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return observations;
  }

  async update(id: string, updateObservationDto: UpdateObservationDto, currentUser: any) {
    const observation = await this.prisma.studentObservation.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!observation) {
      throw new NotFoundException('Observation not found');
    }

    // Only the observer or admins can update
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.INSTITUTION_ADMIN &&
      observation.teacherId !== currentUser.teacherId
    ) {
      throw new ForbiddenException('You do not have permission to update this observation');
    }

    // Check institution access for non-SUPER_ADMIN
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (observation.student.user.institutionId !== currentUser.institutionId) {
        throw new ForbiddenException('You do not have access to this observation');
      }
    }

    return this.prisma.studentObservation.update({
      where: { id },
      data: updateObservationDto,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, currentUser: any) {
    const observation = await this.prisma.studentObservation.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!observation) {
      throw new NotFoundException('Observation not found');
    }

    // Only the observer or admins can delete
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.INSTITUTION_ADMIN &&
      observation.teacherId !== currentUser.teacherId
    ) {
      throw new ForbiddenException('You do not have permission to delete this observation');
    }

    // Check institution access for non-SUPER_ADMIN
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (observation.student.user.institutionId !== currentUser.institutionId) {
        throw new ForbiddenException('You do not have access to this observation');
      }
    }

    await this.prisma.studentObservation.delete({
      where: { id },
    });

    return { message: 'Observation deleted successfully' };
  }

  private checkAccessPermission(observation: any, currentUser: any) {
    // SUPER_ADMIN can see everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Check institution access
    if (observation.student.user.institutionId !== currentUser.institutionId) {
      throw new ForbiddenException('You do not have access to this observation');
    }

    // Parents can only see non-private observations
    if (currentUser.role === UserRole.PARENT) {
      if (observation.isPrivate) {
        throw new ForbiddenException('This observation is private');
      }
      // TODO: Verify parent has access to this student
    }
  }

  private async notifyParents(observationId: string, studentId: string) {
    // Find all parents of the student
    const parents = await this.prisma.parent.findMany({
      where: {
        children: {
          some: {
            studentId: studentId,
          },
        },
      },
      include: {
        user: true,
      },
    });

    // Create notifications for each parent
    // This is a placeholder - in a real implementation, you would use a notification service
    // or create notification records in the database
    console.log(`Sending notifications to ${parents.length} parents for observation ${observationId}`);

    // TODO: Implement actual notification sending (email, push notification, etc.)
    // For now, we just log the intent
  }
}
