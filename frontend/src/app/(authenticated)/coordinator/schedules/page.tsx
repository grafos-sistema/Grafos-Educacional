'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TableCellsIcon,
  ListBulletIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { schedulesService, CreateScheduleDto, Schedule } from '@/services/schedules.service';
import { UserRole } from '@/types/user.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ClassSubjectsManager } from '@/components/classes/ClassSubjectsManager';
import { useToast } from '@/hooks/useToast';
import { presentFriendlyError } from '@/lib/friendly-error';
import {
  DAYS_OF_WEEK,
  DAY_LABELS,
  findScheduleConflicts,
  getUniqueTimeSlots,
  sortByTime,
} from '@/lib/schedule-ui';

type ViewMode = 'table' | 'list';
type CoordinatorTab = 'grade' | 'vinculos' | 'pendencias';

export default function SchedulesManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();
  const currentRole = user?.activeProfile || user?.role;
  const canManageSchedules =
    currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.COORDINATOR;

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState<CoordinatorTab>('grade');
  const [showSubjectsManagerModal, setShowSubjectsManagerModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleConflictMessage, setScheduleConflictMessage] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);

  const [formData, setFormData] = useState({
    classSubjectId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    room: '',
  });

  // Buscar turmas
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return [];
      const response = await classesService.findAll({
        institutionId: user.institutionId,
        isActive: true,
        limit: 200,
      });
      return response.data || [];
    },
    enabled: !!user?.institutionId,
  });

  // Buscar disciplinas da turma selecionada
  const { data: classSubjects = [] } = useQuery({
    queryKey: ['class-subjects', selectedClassId],
    queryFn: () => classesService.getClassSubjects(selectedClassId),
    enabled: !!selectedClassId,
  });

  // Buscar grade de horários
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['schedules', selectedClassId],
    queryFn: () => schedulesService.findByClass(selectedClassId),
    enabled: !!selectedClassId,
  });
  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const selectedClassEffectiveRoom =
    selectedClass?.baseRoom?.trim() || selectedClass?.name?.trim() || '';

  const subjectOptions = [
    { value: '', label: 'Todas as disciplinas' },
    ...classSubjects.map((item: any) => ({
      value: item.id,
      label: item.subject.name,
    })),
  ];

  // Mutation para criar horário
  const createMutation = useMutation({
    mutationFn: (dto: CreateScheduleDto) => schedulesService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Horário cadastrado com sucesso!');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = typeof error?.message === 'string' ? error.message : '';
      if (error?.statusCode === 409 || /já tem aula|conflito de horário/i.test(message)) {
        setScheduleConflictMessage(
          message || 'Este professor já possui uma aula neste dia e horário. Escolha outro horário.',
        );
        return;
      }
      presentFriendlyError(
        error,
        'Não foi possível cadastrar este horário. Revise a turma, a disciplina e os horários informados.',
      );
    },
  });

  // Mutation para atualizar horário
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      schedulesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Horário atualizado com sucesso!');
      setShowEditModal(false);
      setEditingSchedule(null);
      resetForm();
    },
    onError: (error: any) => {
      const message = typeof error?.message === 'string' ? error.message : '';
      if (error?.statusCode === 409 || /já tem aula|conflito de horário/i.test(message)) {
        setScheduleConflictMessage(
          message || 'Este professor já possui uma aula neste dia e horário. Escolha outro horário.',
        );
        return;
      }
      presentFriendlyError(
        error,
        'Não foi possível atualizar este horário. Revise a turma, a disciplina e os horários informados.',
      );
    },
  });

  // Mutation para deletar horário
  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Horário removido com sucesso!');
      setShowDeleteDialog(false);
      setDeletingSchedule(null);
    },
    onError: (error: any) => {
      presentFriendlyError(error, 'Não foi possível remover este horário agora.');
    },
  });

  const resetForm = () => {
    setFormData({
      classSubjectId: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      room: '',
    });
  };

  const buildSchedulePayload = () => {
    const normalizedRoom = formData.room.trim();
    const normalizedBaseRoom = selectedClassEffectiveRoom.trim();

    return {
      ...formData,
      room:
        normalizedRoom && normalizedRoom !== normalizedBaseRoom
          ? normalizedRoom
          : undefined,
    };
  };

  const handleCreate = () => {
    if (!selectedClassId) {
      toast.error('Selecione uma turma');
      return;
    }

    // Validar conflito de horário
    if (
      schedulesService.hasTimeConflict(
        schedules,
        formData.dayOfWeek,
        formData.startTime,
        formData.endTime
      )
    ) {
      presentFriendlyError(
        { message: 'Conflito de horário: já existe outra aula agendada neste dia e horário.' },
        'Escolha outro horário para a turma.',
      );
      return;
    }

    createMutation.mutate({
      classId: selectedClassId,
      ...buildSchedulePayload(),
    });
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      classSubjectId: schedule.classSubjectId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room:
        schedule.room ||
        schedule.effectiveRoom ||
        selectedClassEffectiveRoom ||
        schedule.class?.baseRoom ||
        schedule.class?.name ||
        '',
    });
    setShowEditModal(true);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      room: selectedClassEffectiveRoom,
    }));
    setShowCreateModal(true);
  };

  const handleUpdate = () => {
    if (!editingSchedule) return;

    // Validar conflito de horário
    if (
      schedulesService.hasTimeConflict(
        schedules,
        formData.dayOfWeek,
        formData.startTime,
        formData.endTime,
        editingSchedule.id
      )
    ) {
      presentFriendlyError(
        { message: 'Conflito de horário: já existe outra aula agendada neste dia e horário.' },
        'Escolha outro horário para a turma.',
      );
      return;
    }

    updateMutation.mutate({
      id: editingSchedule.id,
      data: buildSchedulePayload(),
    });
  };

  const handleDelete = (schedule: Schedule) => {
    setDeletingSchedule(schedule);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingSchedule) {
      deleteMutation.mutate(deletingSchedule.id);
    }
  };

  // Criar estrutura de grade para visualização em tabela
  const filteredSchedules = schedules.filter((item) =>
    selectedSubjectId ? item.classSubjectId === selectedSubjectId : true
  );

  const timeSlots = getUniqueTimeSlots(filteredSchedules);

  const getScheduleForSlot = (dayOfWeek: string, startTime: string): Schedule | null => {
    return (
      filteredSchedules.find((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime) || null
    );
  };

  const groupedSchedules = DAYS_OF_WEEK.reduce<Record<string, Schedule[]>>((acc, day) => {
    acc[day.value] = sortByTime(
      filteredSchedules.filter((schedule) => schedule.dayOfWeek === day.value)
    );
    return acc;
  }, {});
  const hasClassSubjects = classSubjects.length > 0;
  const subjectAssignmentsWithoutSchedule = classSubjects.filter(
    (item: any) =>
      !filteredSchedules.some((schedule) => schedule.classSubjectId === item.id) &&
      (!selectedSubjectId || item.id === selectedSubjectId)
  );
  const schedulesWithoutRoom = filteredSchedules.filter(
    (item) => !(item.effectiveRoom || selectedClassEffectiveRoom)
  );
  const scheduleConflicts = findScheduleConflicts(
    filteredSchedules.map((item) => ({
      id: item.id,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
    }))
  );
  const summaryCards = [
    { label: 'Disciplinas vinculadas', value: classSubjects.length },
    { label: 'Horários lançados', value: filteredSchedules.length },
    { label: 'Horários sem local', value: schedulesWithoutRoom.length },
    {
      label: 'Pendências',
      value: subjectAssignmentsWithoutSchedule.length + schedulesWithoutRoom.length + scheduleConflicts.size,
    },
  ];

  const formatRoomLabel = (
    schedule: Pick<Schedule, 'room' | 'effectiveRoom'> & { class?: { name?: string; baseRoom?: string } }
  ) => {
    if (schedule.room) return `Local alternativo: ${schedule.room}`;
    if (schedule.effectiveRoom) return `Sala: ${schedule.effectiveRoom}`;
    if (selectedClassEffectiveRoom) return `Sala: ${selectedClassEffectiveRoom}`;
    if (schedule.class?.baseRoom) return `Sala: ${schedule.class.baseRoom}`;
    if (schedule.class?.name) return `Sala: ${schedule.class.name}`;
    return 'Sala pendente';
  };

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/coordinator/dashboard')}
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
                Visualize a grade da turma, acompanhe pendências e ajuste vínculos apenas quando precisar reorganizar disciplinas e professores.
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
              {canManageSchedules ? (
                <Button
                  onClick={handleOpenCreateModal}
                  leftIcon={<PlusIcon className="h-5 w-5" />}
                  disabled={!selectedClassId || !hasClassSubjects}
                >
                  Novo Horário
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Select
                label="Turma"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId('');
                  setActiveTab('grade');
                }}
                required
                options={[
                  { value: '', label: 'Selecione uma turma...' },
                  ...classes.map((c) => ({
                    value: c.id,
                    label: `${c.name} - ${c.shift || 'Sem turno'}`,
                  })),
                ]}
              />
            </div>
            <Select
              label="Disciplina"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              options={subjectOptions}
              disabled={!selectedClassId || !hasClassSubjects}
            />
            <div className="flex flex-wrap items-end gap-2">
              <Button
                variant={viewMode === 'table' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('table')}
                leftIcon={<TableCellsIcon className="h-5 w-5" />}
                disabled={!selectedClassId}
              >
                Grade
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('list')}
                leftIcon={<ListBulletIcon className="h-5 w-5" />}
                disabled={!selectedClassId}
              >
                Lista
              </Button>
              {canManageSchedules && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowSubjectsManagerModal(true)}
                    leftIcon={<AcademicCapIcon className="h-5 w-5" />}
                    disabled={!selectedClassId}
                  >
                    Gerenciar vínculos
                  </Button>
                </>
              )}
            </div>
          </div>
          {selectedClassId && !hasClassSubjects && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
              <div>
                Esta turma ainda não possui disciplinas vinculadas. O cadastro de horários usa as
                disciplinas já associadas à turma em `class_subjects`, por isso nenhuma opção aparece
                para montar a grade enquanto esse vínculo não existir.
              </div>
              {canManageSchedules && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowSubjectsManagerModal(true)}
                    leftIcon={<AcademicCapIcon className="h-4 w-4" />}
                  >
                    Gerenciar vínculos
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {!selectedClassId ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
            <TableCellsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Selecione uma turma
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Escolha uma turma para visualizar e gerenciar sua grade de horários
            </p>
          </div>
        ) : loadingSchedules ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Carregando grade..." />
          </div>
        ) : !hasClassSubjects ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
            <TableCellsIcon className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma disciplina vinculada à turma
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              A coordenação só consegue definir horários depois que a turma tiver disciplinas
              associadas.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hoje a tela busca as opções diretamente de `class_subjects`.
            </p>
            {canManageSchedules && (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowSubjectsManagerModal(true)}
                  leftIcon={<AcademicCapIcon className="h-5 w-5" />}
                >
                  Gerenciar vínculos
                </Button>
              </div>
            )}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum horário cadastrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Esta turma ainda não possui horários configurados
            </p>
            {canManageSchedules && (
              <Button onClick={handleOpenCreateModal} leftIcon={<PlusIcon className="h-5 w-5" />}>
                Cadastrar Primeiro Horário
              </Button>
            )}
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
                  variant={activeTab === 'vinculos' ? 'primary' : 'secondary'}
                  onClick={() => setActiveTab('vinculos')}
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

            {activeTab === 'grade' && viewMode === 'table' && (
              <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        HORÁRIO
                      </th>
                      {DAYS_OF_WEEK.map((day) => (
                        <th
                          key={day.value}
                          className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white"
                        >
                          <div>{day.abbr}</div>
                          <div className="text-xs font-normal text-gray-600 dark:text-gray-400">
                            {day.shortLabel}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time) => (
                    <tr key={time} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {time}
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const schedule = getScheduleForSlot(day.value, time);
                        return (
                          <td
                            key={day.value}
                            className="border border-gray-300 dark:border-gray-600 px-2 py-2"
                          >
                            {schedule ? (
                              <div
                                className="p-3 rounded-lg text-white text-sm group relative"
                                style={{
                                  backgroundColor: schedule.classSubject?.subject.color || '#3B82F6',
                                }}
                              >
                                <div className="font-semibold mb-1">
                                  {schedule.classSubject?.subject.name}
                                </div>
                                <div className="text-xs opacity-90">
                                  {schedule.startTime} - {schedule.endTime}
                                </div>
                                <div className="text-xs opacity-90">
                                  {formatRoomLabel(schedule)}
                                </div>
                                {schedule.classSubject?.teacher && (
                                  <div className="text-xs opacity-90 mt-1">
                                    Prof. {schedule.classSubject.teacher.user.firstName}{' '}
                                    {schedule.classSubject.teacher.user.lastName}
                                  </div>
                                )}

                                {/* Botões de ação */}
                                {canManageSchedules && (
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                      onClick={() => handleEdit(schedule)}
                                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 rounded"
                                      title="Editar"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(schedule)}
                                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 rounded"
                                      title="Remover"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-20 flex items-center justify-center text-gray-400 dark:text-gray-600">
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {timeSlots.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Nenhum horário cadastrado ainda
              </div>
            )}
            </div>
            )}

            {activeTab === 'grade' && viewMode === 'list' && (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const daySchedules = groupedSchedules[day.value] || [];
                  if (daySchedules.length === 0) return null;

                  return (
                    <div
                      key={day.value}
                      className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
                    >
                      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        {day.label}
                      </h3>
                      <div className="space-y-3">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-12 w-1 rounded"
                                  style={{
                                    backgroundColor: schedule.classSubject?.subject.color || '#3B82F6',
                                  }}
                                />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {schedule.startTime} - {schedule.endTime}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {schedule.classSubject?.subject.name}
                                    {` • ${formatRoomLabel(schedule)}`}
                                  </div>
                                  {schedule.classSubject?.teacher && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Prof. {schedule.classSubject.teacher.user.firstName}{' '}
                                      {schedule.classSubject.teacher.user.lastName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {canManageSchedules && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(schedule)}
                                  leftIcon={<PencilIcon className="h-4 w-4" />}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(schedule)}
                                  leftIcon={<TrashIcon className="h-4 w-4" />}
                                >
                                  Remover
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'vinculos' && (
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Vínculos da Turma
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {classSubjects
                    .filter((item: any) => (selectedSubjectId ? item.id === selectedSubjectId : true))
                    .map((item: any) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.subject.name}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {item.teacher?.user
                            ? `Prof. ${item.teacher.user.firstName} ${item.teacher.user.lastName}`
                            : 'Professor ainda não definido'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {item.weeklyHours ? `${item.weeklyHours} hora(s)/semana` : 'Carga semanal não informada'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'pendencias' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                  <div className="mb-4 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Pendências da Turma
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="mb-2 font-medium text-gray-900 dark:text-white">
                        Disciplinas sem horário
                      </div>
                      {subjectAssignmentsWithoutSchedule.length > 0 ? (
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          {subjectAssignmentsWithoutSchedule.map((item: any) => (
                            <div key={item.id}>{item.subject.name}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Todas as disciplinas filtradas já possuem horário.
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="mb-2 font-medium text-gray-900 dark:text-white">
                        Horários sem local
                      </div>
                      {schedulesWithoutRoom.length > 0 ? (
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          {schedulesWithoutRoom.map((item) => (
                            <div key={item.id}>
                              {DAY_LABELS[item.dayOfWeek]} • {item.classSubject?.subject.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Todas as aulas possuem local definido.
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
                        Revise a grade se houver aulas sobrepostas na mesma turma.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(scheduleConflictMessage)}
        onClose={() => setScheduleConflictMessage(null)}
        title="Conflito de horário"
        size="md"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {scheduleConflictMessage}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setScheduleConflictMessage(null)}>Entendi</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSubjectsManagerModal}
        onClose={() => setShowSubjectsManagerModal(false)}
        title={selectedClass ? `Gerenciar vínculos de ${selectedClass.name}` : 'Gerenciar vínculos'}
        size="4xl"
      >
        {selectedClassId ? (
          <ClassSubjectsManager
            classId={selectedClassId}
            title="Disciplinas da Turma"
            description="Use este espaço apenas quando precisar ajustar os vínculos da turma com suas disciplinas e professores."
            emptyDescription="Assim que você vincular a primeira disciplina, a opção de criar horários já fica disponível para esta turma."
            compact
          />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Selecione uma turma para gerenciar os vínculos.
          </div>
        )}
      </Modal>

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingSchedule(null);
          resetForm();
        }}
        title={editingSchedule ? 'Editar Horário' : 'Novo Horário'}
      >
        <div className="space-y-4">
          <Select
            label="Disciplina"
            value={formData.classSubjectId}
            onChange={(e) => setFormData({ ...formData, classSubjectId: e.target.value })}
            required
            options={[
              { value: '', label: 'Selecione...' },
              ...classSubjects.map((cs) => ({
                value: cs.id,
                label: cs.subject?.name || 'Disciplina',
              })),
            ]}
          />
          {!hasClassSubjects && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
              Nenhuma disciplina foi vinculada a esta turma ainda. Primeiro é preciso criar os
              vínculos da turma com suas disciplinas para depois montar os horários.
            </div>
          )}

          <Select
            label="Dia da Semana"
            value={formData.dayOfWeek}
            onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
            required
            options={[
              { value: '', label: 'Selecione...' },
              ...DAYS_OF_WEEK.map((day) => ({
                value: day.value,
                label: day.label,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label="Horário de Início"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <Input
              type="time"
              label="Horário de Término"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Local da aula
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              O campo já vem preenchido com a turma. Só altere quando esta aula acontecer em outro ambiente.
            </div>
            <div className="mt-4">
              <Input
                label="Local"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder={selectedClassEffectiveRoom || 'Ex: 7º Ano B - Matutino'}
                helpText={
                  selectedClassEffectiveRoom
                    ? `Padrão automático da turma: ${selectedClassEffectiveRoom}`
                    : 'Sem local padrão encontrado para esta turma.'
                }
              />
            </div>
            {selectedClassEffectiveRoom && formData.room.trim() !== selectedClassEffectiveRoom ? (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      room: selectedClassEffectiveRoom,
                    }))
                  }
                >
                  Usar local da turma
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setEditingSchedule(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={editingSchedule ? handleUpdate : handleCreate}
              disabled={
                !formData.classSubjectId ||
                !formData.dayOfWeek ||
                !formData.startTime ||
                !formData.endTime ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : editingSchedule
                ? 'Atualizar'
                : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingSchedule(null);
        }}
        onConfirm={confirmDelete}
        title="Remover Horário"
        message={`Tem certeza que deseja remover o horário de ${deletingSchedule?.classSubject?.subject.name} (${deletingSchedule?.startTime} - ${deletingSchedule?.endTime})?`}
        confirmText="Sim, remover"
        cancelText="Cancelar"
      />
    </>
  );
}
