'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { teacherAttendancesService } from '@/services/teacher-attendances.service';
import { classSchedulesService } from '@/services/class-schedules.service';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTeacherClassSubjects } from '@/hooks/useTeacherClassSubjects';
import {
  DAY_LABELS,
  DAYS_OF_WEEK,
  findScheduleConflicts,
  formatHours,
  getCurrentScheduleItem,
  getDurationInHours,
  getNextScheduleItem,
  sortByTime,
} from '@/lib/schedule-ui';

type EnrichedScheduleItem = {
  classId: string;
  className: string;
  classSubjectId: string;
  subjectName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  color?: string;
  assignmentLabel?: string;
};

export default function ProfessorMySchedulePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const teacherId = user?.teacherProfile?.id;
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');

  const { data: teacherAssignments = [], isLoading: loadingAssignments } = useTeacherClassSubjects();
  const teacherAssignmentIds = useMemo(
    () => teacherAssignments.map((assignment) => assignment.id).sort(),
    [teacherAssignments]
  );

  const { data: rawSchedule = [], isLoading: loadingSchedule } = useQuery({
    queryKey: ['my-teacher-schedule', teacherAssignmentIds],
    queryFn: async () => {
      if (teacherAssignments.length === 0) return [];

      const schedulesByAssignment = await Promise.all(
        teacherAssignments.map(async (assignment) => {
          const schedules = await classSchedulesService.getClassSubjectSchedules(assignment.id);

          return schedules.map((schedule) => ({
            classId: assignment.classId,
            className: assignment.class.name,
            classSubjectId: assignment.id,
            subjectName:
              assignment.subject?.name ||
              schedule.classSubject?.subject?.name ||
              assignment.assignmentLabel ||
              'Disciplina',
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
          }));
        })
      );

      return schedulesByAssignment.flat();
    },
    enabled: Boolean(teacherId) && !loadingAssignments,
  });

  const currentMonth = new Date();
  const { data: monthlyAttendances = [] } = useQuery({
    queryKey: ['my-teacher-attendances', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () =>
      teacherAttendancesService.getMyAttendances({
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
      }),
    enabled: Boolean(teacherId),
  });

  const assignmentByClassSubjectId = useMemo(
    () =>
      new Map(
        teacherAssignments.map((assignment) => [
          assignment.id,
          assignment,
        ])
      ),
    [teacherAssignments]
  );

  const enrichedSchedule = useMemo<EnrichedScheduleItem[]>(
    () =>
      rawSchedule.map((item) => {
        const assignment = assignmentByClassSubjectId.get(item.classSubjectId);
        return {
          ...item,
          color: assignment?.subject?.color,
          assignmentLabel: assignment?.assignmentLabel,
          className: assignment?.class?.name || item.className,
          subjectName: assignment?.subject?.name || item.subjectName,
        };
      }),
    [assignmentByClassSubjectId, rawSchedule]
  );

  const classOptions = useMemo(
    () => [
      { value: '', label: 'Todas as turmas' },
      ...Array.from(
        new Map(
          teacherAssignments.map((assignment) => [
            assignment.classId,
            {
              value: assignment.classId,
              label: assignment.class.name,
            },
          ])
        ).values()
      ).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    ],
    [teacherAssignments]
  );

  const subjectOptions = useMemo(() => {
    const filteredAssignments = selectedClassId
      ? teacherAssignments.filter((assignment) => assignment.classId === selectedClassId)
      : teacherAssignments;

    return [
      { value: '', label: 'Todas as disciplinas' },
      ...filteredAssignments.map((assignment) => ({
        value: assignment.id,
        label: `${assignment.subject?.name || assignment.assignmentLabel} • ${assignment.class.name}`,
      })),
    ];
  }, [selectedClassId, teacherAssignments]);

  const filteredAssignments = useMemo(
    () =>
      teacherAssignments.filter((assignment) => {
        if (selectedClassId && assignment.classId !== selectedClassId) return false;
        if (selectedClassSubjectId && assignment.id !== selectedClassSubjectId) return false;
        return true;
      }),
    [selectedClassId, selectedClassSubjectId, teacherAssignments]
  );

  const filteredSchedule = useMemo(
    () =>
      enrichedSchedule.filter((item) => {
        if (selectedClassId && item.classId !== selectedClassId) return false;
        if (selectedClassSubjectId && item.classSubjectId !== selectedClassSubjectId) return false;
        return true;
      }),
    [enrichedSchedule, selectedClassId, selectedClassSubjectId]
  );

  const totalWeeklyHours = filteredSchedule.reduce(
    (acc, item) => acc + getDurationInHours(item.startTime, item.endTime),
    0
  );
  const currentLesson = getCurrentScheduleItem(filteredSchedule);
  const nextLesson = getNextScheduleItem(filteredSchedule);
  const scheduleConflicts = findScheduleConflicts(
    filteredSchedule.map((item) => ({
      id: `${item.classSubjectId}-${item.dayOfWeek}-${item.startTime}`,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
    }))
  );

  const assignmentsWithoutSchedule = filteredAssignments.filter(
    (assignment) =>
      !filteredSchedule.some((item) => item.classSubjectId === assignment.id)
  );
  const scheduleWithoutRoom = filteredSchedule.filter((item) => !item.room);

  const groupedSchedule = useMemo(
    () =>
      DAYS_OF_WEEK.reduce<Record<string, EnrichedScheduleItem[]>>((acc, day) => {
        acc[day.value] = sortByTime(
          filteredSchedule.filter((item) => item.dayOfWeek === day.value)
        );
        return acc;
      }, {}),
    [filteredSchedule]
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/professor/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Minha Grade
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Acompanhe sua semana letiva, identifique pendências e acesse as ações da aula em um clique.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/professor/attendance')}
            >
              Lançar frequência
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/professor/lesson-contents')}
            >
              Registrar conteúdo
            </Button>
            <Button onClick={() => router.push('/professor/lesson-plans')}>
              Abrir planos
            </Button>
          </div>
        </div>
      </div>

      {loadingAssignments || loadingSchedule ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando sua grade..." />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white shadow-sm">
              <div className="text-sm text-blue-100">Turmas ativas</div>
              <div className="mt-1 text-3xl font-bold">
                {new Set(filteredAssignments.map((item) => item.classId)).size}
              </div>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Disciplinas ativas</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {filteredAssignments.length}
              </div>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Aulas por semana</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {filteredSchedule.length}
              </div>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Carga semanal</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {formatHours(totalWeeklyHours)}
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Select
              label="Turma"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedClassSubjectId('');
              }}
              options={classOptions}
            />
            <Select
              label="Disciplina"
              value={selectedClassSubjectId}
              onChange={(e) => setSelectedClassSubjectId(e.target.value)}
              options={subjectOptions}
            />
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Registros no mês atual</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {monthlyAttendances.length}
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold">Aula Atual</h2>
              </div>
              {currentLesson ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentLesson.subjectName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentLesson.className} • {DAY_LABELS[currentLesson.dayOfWeek]}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentLesson.startTime} - {currentLesson.endTime}
                    {currentLesson.room ? ` • Sala ${currentLesson.room}` : ''}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma aula em andamento neste momento.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <ClockIcon className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold">Próxima Aula</h2>
              </div>
              {nextLesson ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {nextLesson.subjectName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {nextLesson.className} • {DAY_LABELS[nextLesson.dayOfWeek]}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {nextLesson.startTime} - {nextLesson.endTime}
                    {nextLesson.room ? ` • Sala ${nextLesson.room}` : ''}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma aula futura encontrada com os filtros atuais.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="mb-3 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <h2 className="font-semibold">Pendências</h2>
              </div>
              <div className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
                <div>Vínculos sem horário: {assignmentsWithoutSchedule.length}</div>
                <div>Horários sem sala: {scheduleWithoutRoom.length}</div>
                <div>Choques detectados: {scheduleConflicts.size}</div>
              </div>
            </div>
          </div>

          {filteredSchedule.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
              <CalendarDaysIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Nenhum horário encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Ajuste os filtros ou aguarde a coordenação cadastrar os horários das suas disciplinas.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <TableCellsIcon className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Semana Letiva
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayItems = groupedSchedule[day.value] || [];
                    return (
                      <div
                        key={day.value}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {day.shortLabel}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {dayItems.length} {dayItems.length === 1 ? 'aula' : 'aulas'}
                            </div>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                            {day.abbr}
                          </span>
                        </div>

                        {dayItems.length > 0 ? (
                          <div className="space-y-3">
                            {dayItems.map((item) => (
                              <div
                                key={`${item.classSubjectId}-${item.dayOfWeek}-${item.startTime}`}
                                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30"
                              >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      {item.subjectName}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {item.className}
                                    </div>
                                  </div>
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: item.color || '#2563EB' }}
                                  />
                                </div>
                                <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                  {item.startTime} - {item.endTime}
                                  {item.room ? ` • Sala ${item.room}` : ' • Sala pendente'}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      router.push(
                                        `/professor/attendance?classSubjectId=${item.classSubjectId}`
                                      )
                                    }
                                  >
                                    Frequência
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      router.push(
                                        `/professor/lesson-contents?classSubjectId=${item.classSubjectId}`
                                      )
                                    }
                                  >
                                    Conteúdo
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/professor/lesson-plans?classSubjectId=${item.classSubjectId}`
                                      )
                                    }
                                  >
                                    Plano
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            Sem aulas neste dia
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5 text-amber-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Pendências Operacionais
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 font-medium text-gray-900 dark:text-white">
                      Vínculos sem horário
                    </div>
                    {assignmentsWithoutSchedule.length > 0 ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {assignmentsWithoutSchedule.map((assignment) => (
                          <div key={assignment.id}>
                            {assignment.class.name} • {assignment.subject?.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma pendência nesse bloco.
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 font-medium text-gray-900 dark:text-white">
                      Horários sem sala
                    </div>
                    {scheduleWithoutRoom.length > 0 ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {scheduleWithoutRoom.map((item) => (
                          <div key={`${item.classSubjectId}-${item.dayOfWeek}-${item.startTime}`}>
                            {DAY_LABELS[item.dayOfWeek]} • {item.subjectName} • {item.className}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Todas as aulas possuem sala definida.
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 font-medium text-gray-900 dark:text-white">
                      Registros do mês
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Foram encontrados {monthlyAttendances.length} registros de presença no mês atual.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
