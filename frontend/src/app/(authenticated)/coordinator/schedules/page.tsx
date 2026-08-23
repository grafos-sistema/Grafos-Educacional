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
import { useToast } from '@/hooks/useToast';
import { presentFriendlyError } from '@/lib/friendly-error';
import {
  DAYS_OF_WEEK,
  getUniqueTimeSlots,
  sortByTime,
} from '@/lib/schedule-ui';

type ViewMode = 'table' | 'list';

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
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Select
                label="Turma"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId('');
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
            <div className="flex items-end justify-end gap-2 lg:col-span-2">
              <Button
                variant={viewMode === 'table' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('table')}
                leftIcon={<TableCellsIcon className="h-5 w-5" />}
                disabled={!selectedClassId}
                title="Visualizar grade"
                aria-label="Visualizar grade"
              >
                <span className="sr-only">Grade</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('list')}
                leftIcon={<ListBulletIcon className="h-5 w-5" />}
                disabled={!selectedClassId}
                title="Visualizar lista"
                aria-label="Visualizar lista"
              >
                <span className="sr-only">Lista</span>
              </Button>
              {canManageSchedules && (
                <Button
                  onClick={handleOpenCreateModal}
                  leftIcon={<PlusIcon className="h-5 w-5" />}
                  disabled={!selectedClassId || !hasClassSubjects}
                  className="whitespace-nowrap"
                >
                  Novo Horário
                </Button>
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
              Vincule as disciplinas e os professores pela tela de Disciplinas para liberar a criação
              dos horários.
            </p>
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
            {viewMode === 'table' && (
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

            {viewMode === 'list' && (
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
