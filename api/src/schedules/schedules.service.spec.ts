import { ConflictException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';

describe('SchedulesService - conflitos de professor', () => {
  const createPrismaMock = () => ({
    class: {
      findUnique: jest.fn(),
    },
    classSubject: {
      findUnique: jest.fn(),
    },
    classSchedule: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  });

  it('impede o mesmo professor em outra turma quando os horários se sobrepõem', async () => {
    const prisma = createPrismaMock();
    const service = new SchedulesService(prisma as any);

    prisma.class.findUnique.mockResolvedValue({
      id: 'class-a',
      isActive: true,
    });
    prisma.classSubject.findUnique.mockResolvedValue({
      id: 'class-subject-a',
      classId: 'class-a',
      teacherId: 'teacher-1',
    });
    prisma.classSchedule.findMany.mockResolvedValue([
      {
        id: 'schedule-b',
        classId: 'class-b',
        startTime: '08:00',
        endTime: '08:50',
        class: { name: 'Turma B' },
        classSubject: {
          teacherId: 'teacher-1',
          teacher: { user: { firstName: 'Ana', lastName: 'Silva' } },
          subject: { name: 'Matemática' },
        },
      },
    ]);

    await expect(
      service.create({
        classId: 'class-a',
        classSubjectId: 'class-subject-a',
        dayOfWeek: 'MONDAY',
        startTime: '08:49',
        endTime: '09:40',
      }),
    ).rejects.toMatchObject({
      constructor: ConflictException,
      message: expect.stringContaining(
        'Ana Silva já tem aula na turma Turma B',
      ),
    });

    expect(prisma.classSchedule.create).not.toHaveBeenCalled();
  });

  it('permite começar exatamente quando o horário anterior termina', async () => {
    const prisma = createPrismaMock();
    const service = new SchedulesService(prisma as any);

    prisma.class.findUnique.mockResolvedValue({
      id: 'class-a',
      isActive: true,
    });
    prisma.classSubject.findUnique.mockResolvedValue({
      id: 'class-subject-a',
      classId: 'class-a',
      teacherId: 'teacher-1',
    });
    prisma.classSchedule.findMany.mockResolvedValue([
      {
        id: 'schedule-b',
        classId: 'class-b',
        startTime: '08:00',
        endTime: '08:50',
        class: { name: 'Turma B' },
        classSubject: {
          teacherId: 'teacher-1',
          teacher: { user: { firstName: 'Ana', lastName: 'Silva' } },
          subject: { name: 'Matemática' },
        },
      },
    ]);
    prisma.classSchedule.create.mockResolvedValue({
      room: null,
      class: { baseRoom: null, name: 'Turma A' },
    });

    await expect(
      service.create({
        classId: 'class-a',
        classSubjectId: 'class-subject-a',
        dayOfWeek: 'MONDAY',
        startTime: '08:50',
        endTime: '09:40',
      }),
    ).resolves.toMatchObject({ effectiveRoom: 'Turma A' });
  });
});
