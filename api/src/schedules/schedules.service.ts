import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeOptionalRoom(room?: string | null) {
    const normalized = room?.trim();
    return normalized ? normalized : null;
  }

  private withEffectiveRoom<
    T extends {
      room: string | null;
      class?: { baseRoom: string | null; name: string } | null;
    },
  >(
    schedule: T,
  ) {
    return {
      ...schedule,
      effectiveRoom:
        schedule.room || schedule.class?.baseRoom || schedule.class?.name || null,
    };
  }

  /**
   * Converte horário HH:mm em minutos desde meia-noite
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Valida se há conflito de horário
   */
  private async validateTimeConflict(
    classId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string,
  ): Promise<void> {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // Valida se horário de término é após horário de início
    if (endMinutes <= startMinutes) {
      throw new BadRequestException(
        'Horário de término deve ser posterior ao horário de início',
      );
    }

    // Busca horários existentes para a turma no mesmo dia
    const existingSchedules = await this.prisma.classSchedule.findMany({
      where: {
        classId,
        dayOfWeek: dayOfWeek as any,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      },
    });

    // Verifica conflitos de horário
    for (const schedule of existingSchedules) {
      const existingStart = this.timeToMinutes(schedule.startTime);
      const existingEnd = this.timeToMinutes(schedule.endTime);

      // Verifica se há sobreposição de horários
      const hasOverlap =
        (startMinutes >= existingStart && startMinutes < existingEnd) ||
        (endMinutes > existingStart && endMinutes <= existingEnd) ||
        (startMinutes <= existingStart && endMinutes >= existingEnd);

      if (hasOverlap) {
        throw new ConflictException(
          `Conflito de horário: já existe uma aula agendada de ${schedule.startTime} às ${schedule.endTime} neste dia`,
        );
      }
    }
  }

  /**
   * Cria um novo horário na grade
   */
  async create(createScheduleDto: CreateScheduleDto) {
    const { classId, classSubjectId, dayOfWeek, startTime, endTime, room } =
      createScheduleDto;
    const normalizedRoom = this.normalizeOptionalRoom(room);

    // Verifica se turma existe e está ativa
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (!classEntity.isActive) {
      throw new BadRequestException('Turma não está ativa');
    }

    // Verifica se ClassSubject existe e pertence à turma
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
    });

    if (!classSubject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    if (classSubject.classId !== classId) {
      throw new BadRequestException('Disciplina não pertence à turma');
    }

    // Valida conflitos de horário
    await this.validateTimeConflict(classId, dayOfWeek, startTime, endTime);

    const createdSchedule = await this.prisma.classSchedule.create({
      data: {
        classId,
        classSubjectId,
        dayOfWeek,
        startTime,
        endTime,
        room: normalizedRoom,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            baseRoom: true,
          },
        },
        classSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
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
          },
        },
      },
    });

    return this.withEffectiveRoom(createdSchedule);
  }

  /**
   * Lista horários de uma turma
   */
  async findByClass(classId: string) {
    // Verifica se turma existe
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    const schedules = await this.prisma.classSchedule.findMany({
      where: { classId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            baseRoom: true,
          },
        },
        classSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
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
          },
        },
      },
    });

    // Ordenação customizada por dia da semana e horário
    const dayOrder = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    const sortedSchedules = schedules.sort((a, b) => {
      const dayDiff = dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    return sortedSchedules.map((schedule) => this.withEffectiveRoom(schedule));
  }

  /**
   * Busca um horário por ID
   */
  async findOne(id: string) {
    const schedule = await this.prisma.classSchedule.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            baseRoom: true,
          },
        },
        classSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
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
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Horário não encontrado');
    }

    return this.withEffectiveRoom(schedule);
  }

  /**
   * Atualiza um horário
   */
  async update(id: string, updateScheduleDto: UpdateScheduleDto) {
    // Verifica se horário existe
    const schedule = await this.findOne(id);

    const { dayOfWeek, startTime, endTime, room } = updateScheduleDto;

    // Se dia ou horário foram alterados, valida conflitos
    if (dayOfWeek || startTime || endTime) {
      const finalDayOfWeek = dayOfWeek || schedule.dayOfWeek;
      const finalStartTime = startTime || schedule.startTime;
      const finalEndTime = endTime || schedule.endTime;

      await this.validateTimeConflict(
        schedule.classId,
        finalDayOfWeek,
        finalStartTime,
        finalEndTime,
        id, // Exclui o próprio horário da validação
      );
    }

    const updatedSchedule = await this.prisma.classSchedule.update({
      where: { id },
      data: {
        dayOfWeek,
        startTime,
        endTime,
        room:
          room !== undefined ? this.normalizeOptionalRoom(room) : undefined,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            baseRoom: true,
          },
        },
        classSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
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
          },
        },
      },
    });

    return this.withEffectiveRoom(updatedSchedule);
  }

  /**
   * Remove um horário da grade
   */
  async remove(id: string) {
    // Verifica se horário existe
    await this.findOne(id);

    return this.prisma.classSchedule.delete({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        classSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
}
