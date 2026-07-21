'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DocumentCheckIcon,
  CalendarIcon,
  BookOpenIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { attendancesService } from '@/services/attendances.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { classSchedulesService, ClassSchedule } from '@/services/class-schedules.service';
import { AttendanceStatus } from '@/types/attendance.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function AttendancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Helper para formatar data corretamente (evitar problemas de timezone)
  const formatDateLocal = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
  };

  // Estados para aba de histórico
  const [activeTab, setActiveTab] = useState<'register' | 'history' | 'schedule'>('register');
  const [historyFilters, setHistoryFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    classSubjectId: '',
  });

  // Sincronizar filtro do histórico com a seleção da aba de registro
  useEffect(() => {
    if (activeTab === 'history' && selectedClassSubjectId && !historyFilters.classSubjectId) {
      setHistoryFilters(prev => ({
        ...prev,
        classSubjectId: selectedClassSubjectId,
      }));
    }
  }, [activeTab, selectedClassSubjectId, historyFilters.classSubjectId]);

  // Buscar disciplinas configuradas pelo professor
  const { data: myConfiguredSubjects = [] } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: () => teacherSubjectsService.getMySubjects(),
  });

  // Buscar todas as turmas da instituição
  const { data: allClasses = [] } = useQuery({
    queryKey: ['all-classes', user?.institutionId],
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

  // Buscar disciplinas de cada turma e filtrar pelas configuradas
  const configuredSubjectIds = myConfiguredSubjects.map(ts => ts.subjectId).sort().join(',');
  const classIds = allClasses.map(c => c.id).sort().join(',');

  const { data: teacherSubjects = [] } = useQuery({
    queryKey: ['classes-with-subjects-attendance', user?.institutionId, configuredSubjectIds, classIds],
    queryFn: async () => {
      if (!myConfiguredSubjects.length || !allClasses.length) return [];

      const subjectIds = myConfiguredSubjects.map(ts => ts.subjectId);

      const results = await Promise.all(
        allClasses.map(async (classItem) => {
          try {
            const classSubjects = await classesService.getClassSubjects(classItem.id);
            return classSubjects
              .filter(cs => subjectIds.includes(cs.subjectId))
              .map(cs => ({
                ...cs,
                class: classItem,
              }));
          } catch {
            return [];
          }
        })
      );

      return results.flat();
    },
    enabled: myConfiguredSubjects.length > 0 && allClasses.length > 0,
  });

  const selectedSubject = teacherSubjects?.find((s) => s.id === selectedClassSubjectId);

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['class-enrollments-attendance', selectedSubject?.classId],
    queryFn: async () => {
      if (!selectedSubject?.classId) return [];
      return await classesService.getEnrollments(selectedSubject.classId);
    },
    enabled: !!selectedSubject?.classId,
  });

  const { data: existingAttendances } = useQuery({
    queryKey: ['existing-attendances', selectedSubject?.classId, selectedClassSubjectId, selectedDate],
    queryFn: async () => {
      if (!selectedSubject?.classId || !selectedClassSubjectId || !selectedDate) return [];
      const result = await attendancesService.getClassAttendanceByDate(
        selectedSubject.classId,
        selectedClassSubjectId,
        selectedDate
      );
      return result || [];
    },
    enabled: !!selectedSubject?.classId && !!selectedClassSubjectId && !!selectedDate,
  });

  // Query para histórico de frequências
  const { data: historyData, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['attendance-history', historyFilters.classSubjectId, historyFilters.month, historyFilters.year],
    queryFn: async () => {
      if (!historyFilters.classSubjectId) return [];

      // Buscar todas as frequências da disciplina no período
      const startDate = new Date(historyFilters.year, historyFilters.month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(historyFilters.year, historyFilters.month, 0).toISOString().split('T')[0];

      const result = await attendancesService.findAll({
        classSubjectId: historyFilters.classSubjectId,
        startDate,
        endDate,
        limit: 1000,
      });

      // O interceptor do axios já extrai response.data, então result É o array direto
      return Array.isArray(result) ? result : (result.data || []);
    },
    enabled: activeTab === 'history' && !!historyFilters.classSubjectId,
    refetchOnMount: 'always', // Sempre buscar dados atualizados ao montar
  });

  // Query para grade de horários - busca TODOS os horários da turma
  const { data: allClassSchedules = [] } = useQuery({
    queryKey: ['all-class-schedules', selectedSubject?.classId],
    queryFn: async () => {
      if (!selectedSubject?.classId) return [];
      try {
        const schedules = await classSchedulesService.getClassSchedules(selectedSubject.classId);
        // Garantir que sempre retorna um array
        return Array.isArray(schedules) ? schedules : [];
      } catch (error) {
        console.error('Erro ao buscar grade de horários:', error);
        return [];
      }
    },
    enabled: !!selectedSubject?.classId,
  });

  // Filtrar apenas os horários da disciplina selecionada para usar no histórico
  const classSchedules = allClassSchedules.filter(s => s.classSubjectId === selectedClassSubjectId);

  // Preencher dados existentes quando carregados OU pré-marcar todos como PRESENT
  useEffect(() => {
    if (existingAttendances && existingAttendances.length > 0) {
      // Carregar registros existentes
      const data: Record<string, { status: AttendanceStatus; notes: string }> = {};
      existingAttendances.forEach((att: any) => {
        data[att.studentId] = {
          status: att.status,
          notes: att.notes || '',
        };
      });
      setAttendanceData(data);
    } else if (enrollments && enrollments.length > 0) {
      // PRÉ-MARCAR TODOS COMO PRESENT (lógica de exceção)
      const data: Record<string, { status: AttendanceStatus; notes: string }> = {};
      enrollments.forEach((enrollment) => {
        data[enrollment.studentId] = {
          status: AttendanceStatus.PRESENT,
          notes: '',
        };
      });
      setAttendanceData(data);
    } else {
      // Limpar dados quando não há alunos
      setAttendanceData({});
    }
  }, [existingAttendances, enrollments]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject || !user) return;

      const teacherId = user.teacherId || user.teacherProfile?.id;
      if (!teacherId) {
        throw new Error('Perfil de professor não encontrado');
      }

      const attendances = Object.entries(attendanceData).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        notes: data.notes,
      }));

      if (attendances.length === 0) {
        throw new Error('Nenhuma frequência foi marcada');
      }

      await attendancesService.createBulk({
        date: selectedDate,
        classId: selectedSubject.classId,
        classSubjectId: selectedClassSubjectId,
        teacherId,
        attendances,
      });
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a frequências
      queryClient.invalidateQueries({ queryKey: ['existing-attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      queryClient.invalidateQueries({ queryKey: ['class-enrollments-attendance'] });

      const isUpdate = existingAttendances && existingAttendances.length > 0;
      toast.success(isUpdate ? 'Frequências atualizadas com sucesso!' : 'Frequências salvas com sucesso!');
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Erro ao salvar frequências';
      toast.error(message);
      setShowConfirmDialog(false);
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || AttendanceStatus.PRESENT,
        notes,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const data: Record<string, { status: AttendanceStatus; notes: string }> = {};
    enrollments?.forEach((enrollment) => {
      data[enrollment.studentId] = {
        status,
        notes: attendanceData[enrollment.studentId]?.notes || '',
      };
    });
    setAttendanceData(data);
    toast.info(`Todos os alunos marcados como "${getStatusLabel(status)}"`);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300';
      case AttendanceStatus.ABSENT:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300';
      case AttendanceStatus.LATE:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300';
      case AttendanceStatus.EXCUSED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 border-gray-300';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'Presente';
      case AttendanceStatus.ABSENT:
        return 'Ausente';
      case AttendanceStatus.LATE:
        return 'Atrasado';
      case AttendanceStatus.EXCUSED:
        return 'Justificado';
      default:
        return '';
    }
  };

  // Filtrar alunos pela busca
  const filteredEnrollments = enrollments?.filter((enrollment) => {
    if (!searchTerm) return true;
    const fullName = `${enrollment.student?.firstName} ${enrollment.student?.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const stats = {
    present: Object.values(attendanceData).filter((d) => d.status === AttendanceStatus.PRESENT).length,
    absent: Object.values(attendanceData).filter((d) => d.status === AttendanceStatus.ABSENT).length,
    late: Object.values(attendanceData).filter((d) => d.status === AttendanceStatus.LATE).length,
    excused: Object.values(attendanceData).filter((d) => d.status === AttendanceStatus.EXCUSED).length,
  };

  const hasUnsavedChanges = Object.keys(attendanceData).length > 0;

  // Processar dados do histórico - agrupar por data e adicionar horário
  const historyByDate = historyData?.reduce((acc: any, att: any) => {
    const dateKey = new Date(att.date).toLocaleDateString('pt-BR');
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date(att.date).getDay()];

    // Buscar horário da aula na grade
    const scheduleForDay = classSchedules.find(s => s.dayOfWeek === dayOfWeek);

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: att.date,
        dateFormatted: dateKey,
        dayOfWeek,
        schedule: scheduleForDay,
        attendances: [],
        stats: { present: 0, absent: 0, late: 0, excused: 0, total: 0 },
      };
    }
    acc[dateKey].attendances.push(att);
    acc[dateKey].stats[att.status.toLowerCase()]++;
    acc[dateKey].stats.total++;
    return acc;
  }, {});

  const historyDates = historyByDate ? Object.values(historyByDate).sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ) : [];

  // Calcular aulas programadas vs realizadas
  const scheduledClassesCount = classSchedules.length > 0
    ? classSchedulesService.calculateScheduledClasses(
        classSchedules,
        new Date(historyFilters.year, historyFilters.month - 1, 1),
        new Date(historyFilters.year, historyFilters.month, 0)
      )
    : 0;

  const givenClassesCount = historyDates.length;

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/professor/dashboard')}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            className="mb-4"
          >
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Lançar Frequência
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Registre a presença dos alunos na aula
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Registrar Frequência
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Grade de Horários
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Histórico
            </button>
          </div>
        </div>

        {/* Aba: Registrar Frequência */}
        {activeTab === 'register' && (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Turma e Disciplina"
                  value={selectedClassSubjectId}
                  onChange={(e) => {
                    setSelectedClassSubjectId(e.target.value);
                    setAttendanceData({});
                  }}
                  required
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...(teacherSubjects?.map((subject) => ({
                      value: subject.id,
                      label: `${subject.class?.name} - ${subject.subject?.name}`,
                    })) || []),
                  ]}
                />

            <Input
              type="date"
              label="Data da Aula"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              leftIcon={<CalendarIcon className="h-5 w-5" />}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {selectedSubject && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: selectedSubject.subject?.color
                    ? `${selectedSubject.subject.color}20`
                    : '#E5E7EB',
                }}
              >
                <BookOpenIcon
                  className="h-5 w-5"
                  style={{ color: selectedSubject.subject?.color || '#6B7280' }}
                />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {selectedSubject.class?.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedSubject.subject?.name} • {enrollments?.length || 0} alunos
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {!selectedClassSubjectId ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Selecione uma turma
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Escolha a turma e disciplina para lançar a frequência
            </p>
          </div>
        ) : loadingEnrollments ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Carregando alunos..." />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <>
            {/* Aviso de pré-marcação */}
            {enrollments && enrollments.length > 0 && !existingAttendances?.length && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Todos os alunos foram pré-marcados como PRESENTES
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Revise a lista e altere o status dos alunos ausentes, atrasados ou justificados antes de salvar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Presentes</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.present}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ausentes</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absent}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Atrasados</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.late}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Justificados</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.excused}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <Input
                  placeholder="Buscar aluno por nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
                    leftIcon={<CheckIcon className="h-4 w-4" />}
                  >
                    Todos Presentes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
                    leftIcon={<XMarkIcon className="h-4 w-4" />}
                  >
                    Todos Ausentes
                  </Button>
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Aluno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Observações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEnrollments && filteredEnrollments.length > 0 ? (
                      filteredEnrollments.map((enrollment) => {
                        const status = attendanceData[enrollment.studentId]?.status;
                        return (
                          <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                  {enrollment.student?.firstName?.[0]}
                                  {enrollment.student?.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {enrollment.student?.firstName} {enrollment.student?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {enrollment.student?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {Object.values(AttendanceStatus).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => handleStatusChange(enrollment.studentId, s)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                                      status === s
                                        ? getStatusColor(s)
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-transparent hover:border-gray-300'
                                    }`}
                                  >
                                    {getStatusLabel(s)}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Input
                                placeholder="Adicionar observação..."
                                value={attendanceData[enrollment.studentId]?.notes || ''}
                                onChange={(e) => handleNotesChange(enrollment.studentId, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          Nenhum aluno encontrado com "{searchTerm}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end gap-3">
              {hasUnsavedChanges && !saveMutation.isPending && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mr-auto">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span className="text-sm">Alterações não salvas</span>
                </div>
              )}
              {saveMutation.isPending && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mr-auto">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Salvando frequências...</span>
                </div>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setAttendanceData({});
                  toast.info('Frequências limpas');
                }}
                disabled={!hasUnsavedChanges || saveMutation.isPending}
              >
                Limpar
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!hasUnsavedChanges || saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? 'Salvando...'
                  : `Salvar Frequências (${Object.keys(attendanceData).length})`}
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum aluno matriculado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Esta turma não possui alunos matriculados
            </p>
          </div>
        )}
          </>
        )}

        {/* Aba: Grade de Horários */}
        {activeTab === 'schedule' && (
          <>
            {/* Seleção de Turma/Disciplina */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <Select
                label="Turma e Disciplina"
                value={selectedClassSubjectId}
                onChange={(e) => {
                  setSelectedClassSubjectId(e.target.value);
                }}
                required
                options={[
                  { value: '', label: 'Selecione...' },
                  ...(teacherSubjects?.map((subject) => ({
                    value: subject.id,
                    label: `${subject.class?.name} - ${subject.subject?.name}`,
                  })) || []),
                ]}
              />
            </div>

            {/* Grade de Horários */}
            {!selectedClassSubjectId ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Selecione uma turma
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha a turma e disciplina para visualizar a grade de horários
                </p>
              </div>
            ) : allClassSchedules.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Grade de Horários - {selectedSubject?.class?.name}
                </h3>

                <div className="space-y-3">
                  {Object.entries(classSchedulesService.getFormattedSchedules(allClassSchedules)).map(
                    ([day, schedules]) =>
                      schedules.length > 0 && (
                        <div
                          key={day}
                          className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="w-20 flex-shrink-0 pt-1">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {classSchedulesService.getDayAbbreviation(day)}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {classSchedulesService.translateDayOfWeek(day).split('-')[0]}
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            {schedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4"
                                style={{ borderLeftColor: schedule.classSubject?.subject?.color || '#6B7280' }}
                              >
                                <ClockIcon className="h-5 w-5" style={{ color: schedule.classSubject?.subject?.color || '#6B7280' }} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {schedule.startTime} - {schedule.endTime}
                                    </span>
                                    <span
                                      className="px-2 py-0.5 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: schedule.classSubject?.subject?.color ? `${schedule.classSubject.subject.color}20` : '#E5E7EB',
                                        color: schedule.classSubject?.subject?.color || '#6B7280'
                                      }}
                                    >
                                      {schedule.classSubject?.subject?.name}
                                    </span>
                                  </div>
                                  {schedule.room && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Sala: {schedule.room}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                  )}
                </div>

                {/* Estatísticas de aulas */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpenIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-300">
                      Informações das Aulas
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Aulas por semana
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {allClassSchedules.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Disciplinas
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {new Set(allClassSchedules.map(s => s.classSubjectId)).size}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Dias letivos
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {new Set(allClassSchedules.map(s => s.dayOfWeek)).size}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Total horas/semana
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {allClassSchedules.reduce((acc, s) => {
                          const start = s.startTime.split(':').map(Number);
                          const end = s.endTime.split(':').map(Number);
                          const hours = end[0] - start[0] + (end[1] - start[1]) / 60;
                          return acc + hours;
                        }, 0).toFixed(1)}h
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma grade de horários cadastrada
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Esta turma/disciplina ainda não possui horários configurados
                </p>
              </div>
            )}
          </>
        )}

        {/* Aba: Histórico */}
        {activeTab === 'history' && (
          <>
            {/* Filtros de histórico */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Turma e Disciplina"
                  value={historyFilters.classSubjectId}
                  onChange={(e) =>
                    setHistoryFilters({ ...historyFilters, classSubjectId: e.target.value })
                  }
                  required
                  options={[
                    { value: '', label: 'Selecione uma turma' },
                    ...(teacherSubjects?.map((subject) => ({
                      value: subject.id,
                      label: `${subject.class?.name} - ${subject.subject?.name}`,
                    })) || []),
                  ]}
                />
                <Select
                  label="Mês"
                  value={historyFilters.month.toString()}
                  onChange={(e) =>
                    setHistoryFilters({ ...historyFilters, month: parseInt(e.target.value) })
                  }
                  options={[
                    { value: '1', label: 'Janeiro' },
                    { value: '2', label: 'Fevereiro' },
                    { value: '3', label: 'Março' },
                    { value: '4', label: 'Abril' },
                    { value: '5', label: 'Maio' },
                    { value: '6', label: 'Junho' },
                    { value: '7', label: 'Julho' },
                    { value: '8', label: 'Agosto' },
                    { value: '9', label: 'Setembro' },
                    { value: '10', label: 'Outubro' },
                    { value: '11', label: 'Novembro' },
                    { value: '12', label: 'Dezembro' },
                  ]}
                />
                <Input
                  type="number"
                  label="Ano"
                  value={historyFilters.year}
                  onChange={(e) =>
                    setHistoryFilters({ ...historyFilters, year: parseInt(e.target.value) })
                  }
                />
              </div>
              {historyFilters.classSubjectId && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => refetchHistory()}
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? 'Atualizando...' : 'Atualizar Dados'}
                  </Button>
                </div>
              )}
            </div>

            {/* Conteúdo do histórico */}
            {!historyFilters.classSubjectId ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Selecione uma turma
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha a turma e disciplina para visualizar o histórico
                </p>
              </div>
            ) : loadingHistory ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Carregando histórico..." />
              </div>
            ) : historyDates.length > 0 ? (
              <div className="space-y-4">
                {/* Resumo de aulas dadas vs programadas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Resumo do Período
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpenIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                          Aulas Programadas
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {scheduledClassesCount}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckIcon className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-400">
                          Aulas Realizadas
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                        {givenClassesCount}
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-400">
                          Pendentes
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                        {Math.max(0, scheduledClassesCount - givenClassesCount)}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentCheckIcon className="h-5 w-5 text-purple-600" />
                        <span className="text-sm text-purple-700 dark:text-purple-400">
                          Cumprimento
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                        {scheduledClassesCount > 0
                          ? Math.round((givenClassesCount / scheduledClassesCount) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>
                  {scheduledClassesCount > 0 && givenClassesCount < scheduledClassesCount && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800 dark:text-yellow-300">
                          <strong>Atenção:</strong> Há {scheduledClassesCount - givenClassesCount} aula(s) programada(s) sem frequência lançada neste período.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de frequências por data */}
                {historyDates.map((dateData: any) => (
                  <div
                    key={dateData.date}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {dateData.dateFormatted}
                        </h3>
                        {dateData.schedule && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {dateData.schedule.startTime} - {dateData.schedule.endTime}
                            </span>
                            {dateData.schedule.room && (
                              <span className="ml-2">• Sala: {dateData.schedule.room}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{dateData.stats.total} alunos registrados</span>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {dateData.stats.present}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Presentes</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {dateData.stats.absent}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Faltas</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {dateData.stats.late}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Atrasos</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {dateData.stats.excused}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Justificados
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum registro encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Não há registros de frequência para este período
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => saveMutation.mutate()}
        title="Confirmar salvamento"
        message={`Você está prestes a salvar a frequência de ${Object.keys(attendanceData).length} aluno(s) para o dia ${formatDateLocal(selectedDate)}. Deseja continuar?`}
        confirmText="Sim, salvar"
        cancelText="Cancelar"
      />
    </>
  );
}
