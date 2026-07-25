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

const DAYS_OF_WEEK: Record<string, string> = {
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export default function TeacherSchedulesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentRole = user?.activeProfile || user?.role;
  const canManageClassSubjects =
    currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.COORDINATOR;
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [selectedManageClassId, setSelectedManageClassId] = useState('');

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
      { value: '', label: 'Selecione uma turma...' },
      ...availableClasses.map((item) => ({
        value: item.id,
        label: `${item.name} - ${item.shift || 'Sem turno'}`,
      })),
    ],
    [availableClasses]
  );

  const selectedManageClass = useMemo(
    () => availableClasses.find((item) => item.id === selectedManageClassId),
    [availableClasses, selectedManageClassId]
  );

  const classSubjectToSubjectId = useMemo(
    () =>
      new Map(
        teacherClasses
          .filter((item) => item.subject?.id)
          .map((item) => [item.classSubjectId, item.subject!.id])
      ),
    [teacherClasses]
  );

  const filteredAssignments = useMemo(() => {
    if (!selectedSubjectId) return teacherClasses;
    return teacherClasses.filter((item) => item.subject?.id === selectedSubjectId);
  }, [selectedSubjectId, teacherClasses]);

  const filteredSchedule = useMemo(() => {
    if (!selectedSubjectId) return schedule || [];
    return (schedule || []).filter(
      (item) => classSubjectToSubjectId.get(item.classSubjectId) === selectedSubjectId
    );
  }, [classSubjectToSubjectId, schedule, selectedSubjectId]);

  const filteredAttendances = useMemo(() => {
    if (!selectedSubjectId) return attendances || [];
    return (attendances || []).filter(
      (item) => classSubjectToSubjectId.get(item.classSubjectId) === selectedSubjectId
    );
  }, [attendances, classSubjectToSubjectId, selectedSubjectId]);

  // Agrupar horários por dia da semana
  const scheduleByDay = filteredSchedule.reduce((acc, item) => {
    if (!acc[item.dayOfWeek]) {
      acc[item.dayOfWeek] = [];
    }
    acc[item.dayOfWeek].push(item);
    return acc;
  }, {} as Record<string, typeof filteredSchedule>);

  return (
    <div className="p-6">
      {/* Header */}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Grade de Horários
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize vínculos, horários e registros por professor ou disciplina
            </p>
          </div>
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

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Professor"
            value={selectedTeacherId}
            onChange={(e) => {
              setSelectedTeacherId(e.target.value);
              setSelectedSubjectId('');
            }}
            required
            options={teacherOptions}
          />
          <Select
            label="Disciplina"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            options={subjectOptions}
            disabled={!selectedTeacherId}
            helperText="Opcional. Filtra os vínculos e horários pela disciplina escolhida."
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

      {/* Conteúdo */}
      {!selectedTeacherId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Selecione um professor
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Escolha um professor para visualizar seus horários e registros
          </p>
        </div>
      ) : loadingSchedule ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando horários..." />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Vínculos do Professor
            </h2>
            {filteredAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAssignments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AcademicCapIcon className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.class.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.subject?.name || item.assignmentLabel}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.assignmentLabel}
                          {item.weeklyHours ? ` • ${item.weeklyHours} hora(s)/semana` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum vínculo de turma/disciplina encontrado para este professor
              </div>
            )}
          </div>

          {/* Grade Horária */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Grade Horária
            </h2>
            {filteredSchedule.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(DAYS_OF_WEEK).map(([key, label]) => {
                  const daySchedule = scheduleByDay?.[key] || [];
                  return (
                    <div
                      key={key}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold mb-3 text-center text-gray-900 dark:text-white">
                        {label}
                      </h3>
                      {daySchedule.length > 0 ? (
                        <div className="space-y-2">
                          {daySchedule.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.startTime} - {item.endTime}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {item.className}
                              </div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {item.subjectName}
                              </div>
                              {item.room && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Sala: {item.room}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                          Sem aulas
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8 space-y-2">
                <p>Nenhum horário cadastrado para este filtro.</p>
                {filteredAssignments.length > 0 && (
                  <p className="text-sm">
                    O professor já possui vínculos com turma/disciplina, mas ainda não há horários
                    lançados para esses vínculos.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Registros de Presença */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Registros de Presença -{' '}
              {new Date(selectedDate).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            {filteredAttendances.length > 0 ? (
              <div className="space-y-2">
                {filteredAttendances.map((att) => {
                  const scheduleItem = filteredSchedule.find(
                    (s) => s.classSubjectId === att.classSubjectId
                  );
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                            {scheduleItem?.className} - {scheduleItem?.subjectName}
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
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum registro de presença neste período para o filtro selecionado
              </div>
            )}
          </div>
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
            options={classOptions}
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
