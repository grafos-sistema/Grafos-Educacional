'use client';

import { useState, useMemo } from 'react';
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
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Segunda-feira', abbr: 'SEG' },
  { value: 'TUESDAY', label: 'Terça-feira', abbr: 'TER' },
  { value: 'WEDNESDAY', label: 'Quarta-feira', abbr: 'QUA' },
  { value: 'THURSDAY', label: 'Quinta-feira', abbr: 'QUI' },
  { value: 'FRIDAY', label: 'Sexta-feira', abbr: 'SEX' },
  { value: 'SATURDAY', label: 'Sábado', abbr: 'SÁB' },
  { value: 'SUNDAY', label: 'Domingo', abbr: 'DOM' },
];

type ViewMode = 'table' | 'list';

export default function SchedulesManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
      const message = error?.response?.data?.message || 'Erro ao cadastrar horário';
      toast.error(message);
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
      const message = error?.response?.data?.message || 'Erro ao atualizar horário';
      toast.error(message);
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
      const message = error?.response?.data?.message || 'Erro ao remover horário';
      toast.error(message);
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
      toast.error('Conflito de horário detectado! Já existe outra aula neste horário.');
      return;
    }

    createMutation.mutate({
      classId: selectedClassId,
      ...formData,
    });
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      classSubjectId: schedule.classSubjectId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room || '',
    });
    setShowEditModal(true);
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
      toast.error('Conflito de horário detectado! Já existe outra aula neste horário.');
      return;
    }

    updateMutation.mutate({
      id: editingSchedule.id,
      data: formData,
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
  const timeSlots = useMemo(() => {
    if (schedules.length === 0) return [];

    // Extrair todos os horários únicos
    const times = new Set<string>();
    schedules.forEach((s) => {
      times.add(s.startTime);
    });

    // Ordenar horários
    return Array.from(times).sort((a, b) => {
      const [aH, aM] = a.split(':').map(Number);
      const [bH, bM] = b.split(':').map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });
  }, [schedules]);

  const getScheduleForSlot = (dayOfWeek: string, startTime: string): Schedule | null => {
    return schedules.find((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime) || null;
  };

  const sortedSchedules = schedulesService.sortSchedules(schedules);
  const groupedSchedules = schedulesService.groupByDay(sortedSchedules);

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/coordinator/dashboard')}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            className="mb-4"
          >
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Grade de Horários
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure os horários das aulas para cada turma e disciplina
              </p>
            </div>
          </div>
        </div>

        {/* Seleção de Turma e Controles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Select
                label="Turma"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
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
            {selectedClassId && (
              <>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('table')}
                    leftIcon={<TableCellsIcon className="h-5 w-5" />}
                  >
                    Grade
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('list')}
                    leftIcon={<ListBulletIcon className="h-5 w-5" />}
                  >
                    Lista
                  </Button>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<PlusIcon className="h-5 w-5" />}
                >
                  Novo Horário
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        {!selectedClassId ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
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
        ) : schedules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <TableCellsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum horário cadastrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Esta turma ainda não possui horários configurados
            </p>
            <Button onClick={() => setShowCreateModal(true)} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Cadastrar Primeiro Horário
            </Button>
          </div>
        ) : viewMode === 'table' ? (
          /* Visualização em Grade/Tabela */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
                            {day.label}
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
                                {schedule.room && (
                                  <div className="text-xs opacity-90">{schedule.room}</div>
                                )}
                                {schedule.classSubject?.teacher && (
                                  <div className="text-xs opacity-90 mt-1">
                                    Prof. {schedule.classSubject.teacher.user.firstName}{' '}
                                    {schedule.classSubject.teacher.user.lastName}
                                  </div>
                                )}

                                {/* Botões de ação */}
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
        ) : (
          /* Visualização em Lista (original) */
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const daySchedules = groupedSchedules[day.value] || [];
              if (daySchedules.length === 0) return null;

              return (
                <div
                  key={day.value}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {day.label}
                  </h3>
                  <div className="space-y-3">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-1 h-12 rounded"
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
                                {schedule.room && ` • Sala: ${schedule.room}`}
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                label: cs.subject.name,
              })),
            ]}
          />

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

          <Input
            label="Sala (opcional)"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            placeholder="Ex: Sala 101"
          />

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
        variant="danger"
      />
    </>
  );
}
