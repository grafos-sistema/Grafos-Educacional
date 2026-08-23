'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  PrinterIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { teacherAttendancesService } from '@/services/teacher-attendances.service';
import { teachersService } from '@/services/teachers.service';
import { classesService } from '@/services/classes.service';
import { UserRole } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { ClassSubjectsManager } from '@/components/classes/ClassSubjectsManager';
import { formatScheduleLoad } from '@/lib/schedule-load';
import {
  DAY_LABELS,
  DAYS_OF_WEEK,
  findScheduleConflicts,
  formatMonthYear,
  getUniqueTimeSlots,
  sortByTime,
} from '@/lib/schedule-ui';

type AdminScheduleTab = 'grade' | 'links' | 'pendencias';
type AdminGradeView = 'cards' | 'table';

export default function TeacherSchedulesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentRole = user?.activeProfile || user?.role;
  const canManageClassSubjects =
    currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.COORDINATOR;
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [selectedManageClassId, setSelectedManageClassId] = useState('');
  const [activeTab, setActiveTab] = useState<AdminScheduleTab>('grade');
  const [gradeView, setGradeView] = useState<AdminGradeView>('cards');

  // Buscar professores
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-list', user?.institutionId],
    queryFn: async () => {
      const response = await usersService.findAll({
        hasTeacherProfile: true,
        isActive: true,
        institutionId: user?.institutionId,
        limit: 200,
      });
      return response;
    },
    enabled: !!user?.institutionId,
  });

  const teachers = teachersData?.data || [];
  const { data: classesResponse } = useQuery({
    queryKey: ['classes', 'teacher-schedules', user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return { data: [] as any[] };
      return classesService.findAll({
        institutionId: user.institutionId,
        isActive: true,
        limit: 200,
      });
    },
    enabled: Boolean(user?.institutionId),
  });

  const availableClasses = classesResponse?.data || [];
  const teacherOptions = useMemo(
    () => [
      { value: '', label: 'Selecione um professor...' },
      ...teachers
        .filter((teacher) => Boolean(teacher.teacherProfile?.id))
        .map((teacher) => ({
          value: teacher.teacherProfile!.id,
          label: `${teacher.firstName} ${teacher.lastName}`,
        })),
    ],
    [teachers]
  );

  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['teacher-classes', selectedTeacherId],
    queryFn: () => teachersService.getTeacherClasses(selectedTeacherId),
    enabled: !!selectedTeacherId,
  });

  // Buscar horários do professor selecionado
  const { data: schedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['teacher-schedule', selectedTeacherId],
    queryFn: () => teacherAttendancesService.getTeacherSchedule(selectedTeacherId),
    enabled: !!selectedTeacherId,
  });

  // Buscar registros de presença
  const { data: attendances } = useQuery({
    queryKey: ['teacher-attendances', selectedTeacherId, selectedDate],
    queryFn: async () => {
      const [year, month] = selectedDate.split('-');
      return await teacherAttendancesService.getTeacherAttendances(
        selectedTeacherId,
        { month: parseInt(month), year: parseInt(year) }
      );
    },
    enabled: !!selectedTeacherId,
  });

  const subjectOptions = useMemo(() => {
    const uniqueSubjects = new Map<string, string>();

    for (const item of teacherClasses) {
      if (item.subject?.id && item.subject?.name) {
        uniqueSubjects.set(item.subject.id, item.subject.name);
      }
    }

    return [
      { value: '', label: 'Todas as disciplinas' },
      ...Array.from(uniqueSubjects.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [teacherClasses]);

  const classOptions = useMemo(
    () => [
      { value: '', label: 'Todas as turmas' },
      ...Array.from(
        new Map(
          teacherClasses.map((item) => [
            item.class.id,
            {
              value: item.class.id,
              label: `${item.class.name} - ${item.class.shift || 'Sem turno'}`,
            },
          ])
        ).values()
      ),
    ],
    [teacherClasses]
  );

  const selectedManageClass = useMemo(
    () => availableClasses.find((item) => item.id === selectedManageClassId),
    [availableClasses, selectedManageClassId]
  );

  const manageClassOptions = useMemo(
    () => [
      { value: '', label: 'Selecione uma turma...' },
      ...availableClasses.map((item) => ({
        value: item.id,
        label: `${item.name} - ${item.shift || 'Sem turno'}`,
      })),
    ],
    [availableClasses]
  );

  const classSubjectToSubjectId = useMemo(
    () =>
      new Map(
        teacherClasses
          .filter((item) => item.subject?.id)
            .map((item) => [item.id, item.subject!.id])
      ),
    [teacherClasses]
  );

  const filteredAssignments = useMemo(() => {
    return teacherClasses.filter((item) => {
      if (selectedSubjectId && item.subject?.id !== selectedSubjectId) return false;
      if (selectedClassId && item.class.id !== selectedClassId) return false;
      return true;
    });
  }, [selectedClassId, selectedSubjectId, teacherClasses]);

  const filteredSchedule = useMemo(() => {
    return (schedule || []).filter((item) => {
      if (selectedSubjectId && classSubjectToSubjectId.get(item.classSubjectId) !== selectedSubjectId) {
        return false;
      }

      if (selectedClassId && item.classId !== selectedClassId) {
        return false;
      }

      return true;
    });
  }, [classSubjectToSubjectId, schedule, selectedClassId, selectedSubjectId]);

  const filteredAttendances = useMemo(() => {
    return (attendances || []).filter((item) => {
      if (selectedSubjectId && classSubjectToSubjectId.get(item.classSubjectId) !== selectedSubjectId) {
        return false;
      }

      const assignment = teacherClasses.find((teacherClass) => teacherClass.id === item.classSubjectId);
      if (selectedClassId && assignment?.class.id !== selectedClassId) {
        return false;
      }

      return true;
    });
  }, [attendances, classSubjectToSubjectId, selectedClassId, selectedSubjectId, teacherClasses]);

  const scheduleByDay = useMemo(
    () =>
      DAYS_OF_WEEK.reduce<Record<string, typeof filteredSchedule>>((acc, day) => {
        acc[day.value] = sortByTime(
          filteredSchedule.filter((item) => item.dayOfWeek === day.value)
        );
        return acc;
      }, {}),
    [filteredSchedule]
  );

  const timeSlots = useMemo(() => getUniqueTimeSlots(filteredSchedule), [filteredSchedule]);

  const assignmentsWithoutSchedule = useMemo(
    () =>
      filteredAssignments.filter(
        (item) => !filteredSchedule.some((scheduleItem) => scheduleItem.classSubjectId === item.id)
      ),
    [filteredAssignments, filteredSchedule]
  );

  const schedulesWithoutRoom = useMemo(
    () => filteredSchedule.filter((item) => !item.effectiveRoom),
    [filteredSchedule]
  );

  const formatRoomLabel = (item: { room?: string; effectiveRoom?: string }) => {
    if (item.room) return `Local alternativo: ${item.room}`;
    if (item.effectiveRoom) return `Sala: ${item.effectiveRoom}`;
    return 'Sala pendente';
  };

  const attendanceClassSubjectIds = useMemo(
    () => new Set(filteredAttendances.map((item) => item.classSubjectId)),
    [filteredAttendances]
  );

  const assignmentsWithoutAttendance = useMemo(
    () =>
      filteredAssignments.filter((item) => {
        const hasSchedule = filteredSchedule.some((scheduleItem) => scheduleItem.classSubjectId === item.id);
        return hasSchedule && !attendanceClassSubjectIds.has(item.id);
      }),
    [attendanceClassSubjectIds, filteredAssignments, filteredSchedule]
  );

  const scheduleConflicts = useMemo(
    () =>
      findScheduleConflicts(
        filteredSchedule.map((item) => ({
          id: `${item.classSubjectId}-${item.dayOfWeek}-${item.startTime}`,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
        }))
      ),
    [filteredSchedule]
  );

  const summaryCards = [
    {
      label: 'Vínculos ativos',
      value: filteredAssignments.length,
    },
    {
      label: 'Turmas filtradas',
      value: new Set(filteredAssignments.map((item) => item.class.id)).size,
    },
    {
      label: 'Horários lançados',
      value: filteredSchedule.length,
    },
    {
      label: 'Pendências',
      value:
        assignmentsWithoutSchedule.length +
        schedulesWithoutRoom.length +
        assignmentsWithoutAttendance.length +
        scheduleConflicts.size,
    },
  ];

  const getScheduleForSlot = (dayOfWeek: string, startTime: string) =>
    filteredSchedule.find(
      (item) => item.dayOfWeek === dayOfWeek && item.startTime === startTime
    ) || null;

  const selectedTeacher = teachers.find((teacher) => teacher.teacherProfile?.id === selectedTeacherId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Grade de Horários
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Acompanhe a operação por professor, visualize pendências e abra os vínculos apenas quando precisar ajustar a estrutura.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => window.print()}
              leftIcon={<PrinterIcon className="h-5 w-5" />}
            >
              Imprimir grade
            </Button>
            {canManageClassSubjects && (
              <Button
                variant="secondary"
                onClick={() => setShowLinksModal(true)}
                leftIcon={<AcademicCapIcon className="h-5 w-5" />}
              >
                Gerenciar vínculos
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select
            label="Professor"
            value={selectedTeacherId}
            onChange={(e) => {
              setSelectedTeacherId(e.target.value);
              setSelectedSubjectId('');
              setSelectedClassId('');
              setActiveTab('grade');
            }}
            required
            options={teacherOptions}
          />
          <Select
            label="Turma"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={classOptions}
            disabled={!selectedTeacherId}
          />
          <Select
            label="Disciplina"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            options={subjectOptions}
            disabled={!selectedTeacherId}
          />
          <Input
            type="month"
            label="Mês/Ano"
            value={selectedDate.substring(0, 7)}
            onChange={(e) => setSelectedDate(e.target.value + '-01')}
            leftIcon={<CalendarIcon className="h-5 w-5" />}
          />
        </div>
      </div>

      {!selectedTeacherId ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
          <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Selecione um professor
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Escolha um professor para abrir a visão da grade, dos vínculos e das pendências.
          </p>
        </div>
      ) : loadingSchedule ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando horários..." />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800"
              >
                <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
                <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTab === 'grade' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('grade')}
                leftIcon={<TableCellsIcon className="h-5 w-5" />}
              >
                Visão da Grade
              </Button>
              <Button
                variant={activeTab === 'links' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('links')}
                leftIcon={<AcademicCapIcon className="h-5 w-5" />}
              >
                Vínculos
              </Button>
              <Button
                variant={activeTab === 'pendencias' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('pendencias')}
                leftIcon={<ExclamationTriangleIcon className="h-5 w-5" />}
              >
                Pendências
              </Button>
            </div>
          </div>

          {activeTab === 'grade' && (
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Grade semanal de {selectedTeacher?.firstName} {selectedTeacher?.lastName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Período de presença: {formatMonthYear(selectedDate)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={gradeView === 'cards' ? 'primary' : 'secondary'}
                    onClick={() => setGradeView('cards')}
                    leftIcon={<ListBulletIcon className="h-5 w-5" />}
                  >
                    Cards
                  </Button>
                  <Button
                    variant={gradeView === 'table' ? 'primary' : 'secondary'}
                    onClick={() => setGradeView('table')}
                    leftIcon={<TableCellsIcon className="h-5 w-5" />}
                  >
                    Grade
                  </Button>
                </div>
              </div>

              {filteredSchedule.length > 0 ? (
                gradeView === 'cards' ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {DAYS_OF_WEEK.map((day) => {
                      const daySchedule = scheduleByDay[day.value] || [];
                      return (
                        <div
                          key={day.value}
                          className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {day.shortLabel}
                            </div>
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                              {day.abbr}
                            </span>
                          </div>
                          {daySchedule.length > 0 ? (
                            <div className="space-y-3">
                              {daySchedule.map((item) => (
                                <div
                                  key={`${item.classSubjectId}-${item.dayOfWeek}-${item.startTime}`}
                                  className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
                                >
                                  <div className="mb-1 flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {item.startTime} - {item.endTime}
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.subjectName}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.className}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formatRoomLabel(item)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              Sem aulas
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                            Horário
                          </th>
                          {DAYS_OF_WEEK.map((day) => (
                            <th
                              key={day.value}
                              className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:border-gray-600 dark:text-white"
                            >
                              <div>{day.abbr}</div>
                              <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                {day.shortLabel}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((time) => (
                          <tr key={time}>
                            <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-600 dark:text-white">
                              {time}
                            </td>
                            {DAYS_OF_WEEK.map((day) => {
                              const item = getScheduleForSlot(day.value, time);
                              return (
                                <td
                                  key={`${day.value}-${time}`}
                                  className="border border-gray-200 px-2 py-2 align-top dark:border-gray-600"
                                >
                                  {item ? (
                                    <div className="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                                      <div className="font-semibold text-gray-900 dark:text-white">
                                        {item.subjectName}
                                      </div>
                                      <div className="text-gray-600 dark:text-gray-300">
                                        {item.className}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.startTime} - {item.endTime}
                                        {` • ${formatRoomLabel(item)}`}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="space-y-2 py-8 text-center text-gray-500 dark:text-gray-400">
                  <p>Nenhum horário cadastrado para este filtro.</p>
                  {filteredAssignments.length > 0 && (
                    <p className="text-sm">
                      Há vínculos ativos para este professor, mas os horários ainda não foram lançados.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'links' && (
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Vínculos do Professor
              </h2>
              {filteredAssignments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredAssignments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <AcademicCapIcon className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.class.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.subject?.name || item.assignmentLabel}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {item.assignmentLabel} • {formatScheduleLoad(item.scheduledMinutes, item.scheduledClassCount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhum vínculo encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          )}

          {activeTab === 'pendencias' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Pendências de operação
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 font-medium text-gray-900 dark:text-white">
                      Vínculos sem horário
                    </div>
                    {assignmentsWithoutSchedule.length > 0 ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {assignmentsWithoutSchedule.map((item) => (
                          <div key={item.id}>
                            {item.class.name} • {item.subject?.name || item.assignmentLabel}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma pendência nessa categoria.
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 font-medium text-gray-900 dark:text-white">
                      Horários sem sala
                    </div>
                    {schedulesWithoutRoom.length > 0 ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {schedulesWithoutRoom.map((item) => (
                          <div key={`${item.classSubjectId}-${item.dayOfWeek}-${item.startTime}`}>
                            {DAY_LABELS[item.dayOfWeek]} • {item.subjectName} • {item.className}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Todas as aulas possuem sala informada.
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 font-medium text-gray-900 dark:text-white">
                      Sem presença no período
                    </div>
                    {assignmentsWithoutAttendance.length > 0 ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {assignmentsWithoutAttendance.map((item) => (
                          <div key={item.id}>
                            {item.class.name} • {item.subject?.name || item.assignmentLabel}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Todos os vínculos com horário já possuem registros no mês.
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 font-medium text-gray-900 dark:text-white">
                      Choques de horário
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {scheduleConflicts.size}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Revise os lançamentos se houver aulas sobrepostas para o mesmo professor.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Registros de Presença - {formatMonthYear(selectedDate)}
                </h2>
                {filteredAttendances.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAttendances.map((att) => {
                      const scheduleItem = filteredSchedule.find(
                        (item) => item.classSubjectId === att.classSubjectId
                      );

                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-4">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {new Date(att.date).toLocaleDateString('pt-BR', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {scheduleItem?.className || 'Turma'} - {scheduleItem?.subjectName || 'Disciplina'}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(att.checkInTime).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum registro de presença encontrado no período filtrado.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showLinksModal}
        onClose={() => setShowLinksModal(false)}
        title={
          selectedManageClass
            ? `Gerenciar vínculos de ${selectedManageClass.name}`
            : 'Gerenciar vínculos'
        }
        size="4xl"
      >
        <div className="space-y-4">
          <Select
            label="Turma"
            value={selectedManageClassId}
            onChange={(e) => setSelectedManageClassId(e.target.value)}
            options={manageClassOptions}
          />

          {selectedManageClassId ? (
            <ClassSubjectsManager
              classId={selectedManageClassId}
              title="Disciplinas da Turma"
              description="Abra esta ação apenas quando precisar ajustar os vínculos da turma com suas disciplinas e professores."
              emptyDescription="Assim que a primeira disciplina for vinculada, a grade da turma já pode receber horários."
              compact
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Selecione uma turma para visualizar e gerenciar os vínculos.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
