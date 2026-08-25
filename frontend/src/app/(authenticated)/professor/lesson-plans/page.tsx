'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BackspaceIcon,
  CalendarDaysIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { lessonPlansService } from '@/services/lesson-plans.service';
import { academicPeriodsService } from '@/services/academic-periods.service';
import {
  LessonPlan,
  CreateLessonPlanDto,
  LessonPlanStatus,
  UpdateLessonPlanDto,
} from '@/types/lesson.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useTeacherClassSubjects } from '@/hooks/useTeacherClassSubjects';

const statusLabels: Record<LessonPlanStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Aguardando Aprovação',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

const statusColors: Record<
  LessonPlanStatus,
  'default' | 'success' | 'error' | 'warning' | 'info'
> = {
  DRAFT: 'default',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

export default function LessonPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');
  const [selectedAcademicPeriodId, setSelectedAcademicPeriodId] = useState('');
  const [statusFilter, setStatusFilter] = useState<LessonPlanStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recentes' | 'inicio' | 'titulo' | 'pendentes'>('recentes');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [viewMode, setViewMode] = useState(false);

  const [formData, setFormData] = useState<CreateLessonPlanDto>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    objectives: '',
    content: '',
    methodology: '',
    resources: '',
    assessment: '',
    observations: '',
    classSubjectId: '',
    academicPeriodId: '',
    teacherId: user?.teacherProfile?.id || '',
    createdById: user?.id || '',
  });

  const { data: teacherSubjects = [], isLoading: loadingSubjects } = useTeacherClassSubjects();
  const classSubjectIdFromUrl = searchParams.get('classSubjectId') || '';
  const { data: academicPeriodsData } = useQuery({
    queryKey: ['academic-periods-lesson-plans', user?.institutionId],
    queryFn: () =>
      academicPeriodsService.findAll({
        isActive: true,
        limit: 100,
        page: 1,
      }),
    enabled: Boolean(user?.institutionId),
  });

  const academicPeriods = academicPeriodsData?.data ?? [];

  useEffect(() => {
    if (!selectedAcademicPeriodId && academicPeriods.length > 0) {
      setSelectedAcademicPeriodId(academicPeriods[0].id);
      setFormData((prev) => ({
        ...prev,
        academicPeriodId: academicPeriods[0].id,
      }));
    }
  }, [academicPeriods, selectedAcademicPeriodId]);

  useEffect(() => {
    if (!classSubjectIdFromUrl || teacherSubjects.length === 0) return;
    const hasMatchingSubject = teacherSubjects.some((subject) => subject.id === classSubjectIdFromUrl);
    if (hasMatchingSubject) {
      const selectedAssignment = teacherSubjects.find((subject) => subject.id === classSubjectIdFromUrl);
      setSelectedClassId(selectedAssignment?.classId || '');
      setSelectedClassSubjectId(classSubjectIdFromUrl);
      setFormData((prev) => ({
        ...prev,
        classSubjectId: classSubjectIdFromUrl,
      }));
    }
  }, [classSubjectIdFromUrl, teacherSubjects]);

  const classOptions = useMemo(
    () => [
      { value: '', label: 'Todas as turmas' },
      ...Array.from(
        new Map(
          teacherSubjects.map((item) => [
            item.classId,
            { value: item.classId, label: item.class?.name || 'Turma' },
          ])
        ).values()
      ),
    ],
    [teacherSubjects]
  );

  const subjectOptions = useMemo(() => {
    const filteredSubjects = selectedClassId
      ? teacherSubjects.filter((item) => item.classId === selectedClassId)
      : teacherSubjects;

    return [
      { value: '', label: 'Todas as disciplinas' },
      ...filteredSubjects.map((item) => ({
        value: item.id,
        label: `${item.subject?.name} • ${item.class?.name}`,
      })),
    ];
  }, [selectedClassId, teacherSubjects]);

  const academicPeriodOptions = useMemo(
    () => [
      { value: '', label: 'Todos os períodos' },
      ...academicPeriods.map((period) => ({
        value: period.id,
        label: period.name,
      })),
    ],
    [academicPeriods]
  );

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: [
      'lesson-plans',
      user?.teacherProfile?.id,
      selectedAcademicPeriodId,
      statusFilter,
      startDateFilter,
      endDateFilter,
    ],
    queryFn: async () => {
      if (!user?.teacherProfile?.id) return [];

      const response = await lessonPlansService.findAll({
        teacherId: user.teacherProfile.id,
        academicPeriodId: selectedAcademicPeriodId || undefined,
        status: statusFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        limit: 100,
      });

      return response.data;
    },
    enabled: Boolean(user?.teacherProfile?.id),
  });

  const plans = useMemo(() => {
    const filteredPlans = (plansData ?? []).filter((plan) => {
      if (selectedClassSubjectId && plan.classSubjectId !== selectedClassSubjectId) return false;
      if (selectedClassId && plan.classSubject?.class?.id !== selectedClassId) return false;
      if (searchTerm.trim()) {
        const search = searchTerm.trim().toLowerCase();
        const haystack = [
          plan.title,
          plan.description,
          plan.classSubject?.class?.name,
          plan.classSubject?.subject?.name,
          plan.academicPeriod?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    return filteredPlans.sort((a, b) => {
      if (sortBy === 'pendentes') {
        if (a.status === LessonPlanStatus.SUBMITTED && b.status !== LessonPlanStatus.SUBMITTED) return -1;
        if (a.status !== LessonPlanStatus.SUBMITTED && b.status === LessonPlanStatus.SUBMITTED) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }

      if (sortBy === 'inicio') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }

      if (sortBy === 'titulo') {
        return a.title.localeCompare(b.title, 'pt-BR');
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [plansData, searchTerm, selectedClassId, selectedClassSubjectId, sortBy]);

  const totalPlans = plans.length;
  const draftCount = plans.filter((plan) => plan.status === LessonPlanStatus.DRAFT).length;
  const submittedCount = plans.filter((plan) => plan.status === LessonPlanStatus.SUBMITTED).length;
  const approvedCount = plans.filter((plan) => plan.status === LessonPlanStatus.APPROVED).length;
  const rejectedCount = plans.filter((plan) => plan.status === LessonPlanStatus.REJECTED).length;

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: CreateLessonPlanDto) => lessonPlansService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Plano criado! O plano de aula foi salvo como rascunho');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível salvar o plano';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonPlanDto }) =>
      lessonPlansService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Plano atualizado! As alterações foram salvas');
      setShowModal(false);
      setSelectedPlan(null);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível atualizar o plano';
      toast.error(message);
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => lessonPlansService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Plano removido! O plano de aula foi excluído');
      setShowDeleteDialog(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível remover o plano';
      toast.error(message);
    },
  });

  // Mutation para submeter
  const submitMutation = useMutation({
    mutationFn: (id: string) => lessonPlansService.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Plano submetido! O plano foi enviado para aprovação');
      setShowSubmitDialog(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível submeter o plano';
      toast.error(message);
    },
  });

  const getDefaultAcademicPeriodId = () =>
    selectedAcademicPeriodId || academicPeriods[0]?.id || '';

  const getDefaultPeriodRange = (periodId: string) => {
    const period = academicPeriods.find((item) => item.id === periodId);
    return {
      startDate: period?.startDate?.split('T')[0] || '',
      endDate: period?.endDate?.split('T')[0] || '',
    };
  };

  const resetForm = () => {
    const nextPeriodId = getDefaultAcademicPeriodId();
    const periodRange = getDefaultPeriodRange(nextPeriodId);

    setFormData({
      title: '',
      description: '',
      startDate: periodRange.startDate,
      endDate: periodRange.endDate,
      objectives: '',
      content: '',
      methodology: '',
      resources: '',
      assessment: '',
      observations: '',
      classSubjectId: selectedClassSubjectId,
      academicPeriodId: nextPeriodId,
      teacherId: user?.teacherProfile?.id || '',
      createdById: user?.id || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan) {
      updateMutation.mutate({
        id: selectedPlan.id,
        data: {
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          objectives: formData.objectives,
          content: formData.content,
          methodology: formData.methodology,
          resources: formData.resources,
          assessment: formData.assessment,
          observations: formData.observations,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (plan: LessonPlan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description,
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate.split('T')[0],
      objectives: plan.objectives,
      content: plan.content,
      methodology: plan.methodology,
      resources: plan.resources,
      assessment: plan.assessment,
      observations: plan.observations || '',
      classSubjectId: plan.classSubjectId,
      academicPeriodId: plan.academicPeriodId || '',
      teacherId: plan.teacherId,
      createdById: plan.createdById || user?.id || '',
    });
    setViewMode(false);
    setShowModal(true);
  };

  const handleView = (plan: LessonPlan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description,
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate.split('T')[0],
      objectives: plan.objectives,
      content: plan.content,
      methodology: plan.methodology,
      resources: plan.resources,
      assessment: plan.assessment,
      observations: plan.observations || '',
      classSubjectId: plan.classSubjectId,
      academicPeriodId: plan.academicPeriodId || '',
      teacherId: plan.teacherId,
      createdById: plan.createdById || user?.id || '',
    });
    setViewMode(true);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (selectedPlan) {
      deleteMutation.mutate(selectedPlan.id);
    }
  };

  const handleSubmitPlan = () => {
    if (selectedPlan) {
      submitMutation.mutate(selectedPlan.id);
    }
  };

  const handleNewPlan = () => {
    if (!selectedClassSubjectId) {
      toast.error('Selecione a disciplina antes de criar um plano.');
      return;
    }
    resetForm();
    setSelectedPlan(null);
    setViewMode(false);
    setShowModal(true);
  };

  const handleDuplicate = (plan: LessonPlan) => {
    setSelectedPlan(null);
    setViewMode(false);
    setFormData({
      title: `${plan.title} - Cópia`,
      description: plan.description,
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate.split('T')[0],
      objectives: plan.objectives,
      content: plan.content,
      methodology: plan.methodology || '',
      resources: plan.resources || '',
      assessment: plan.assessment || '',
      observations: plan.observations || '',
      classSubjectId: plan.classSubjectId,
      academicPeriodId: plan.academicPeriodId || getDefaultAcademicPeriodId(),
      teacherId: user?.teacherProfile?.id || '',
      createdById: user?.id || '',
    });
    setSelectedClassId(plan.classSubject?.class?.id || '');
    setSelectedClassSubjectId(plan.classSubjectId);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        message="Tem certeza que deseja remover este plano de aula? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={handleSubmitPlan}
        title="Submeter para aprovação"
        message="Deseja enviar este plano de aula para aprovação do coordenador? Após o envio, não será possível editar."
        confirmText="Sim, submeter"
        cancelText="Cancelar"
      />

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Planos de Aula
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize seu planejamento por turma, disciplina, período e status, com uma visão mais clara do que já foi enviado, aprovado ou precisa de revisão.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleNewPlan} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Novo Plano
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5 mb-6">
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white shadow-sm">
          <div className="text-sm text-blue-100">Total filtrado</div>
          <div className="mt-1 text-3xl font-bold">{totalPlans}</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Rascunhos</div>
          <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{draftCount}</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Aguardando aprovação</div>
          <div className="mt-1 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{submittedCount}</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Aprovados</div>
          <div className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">{approvedCount}</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Rejeitados</div>
          <div className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
          <Select
            label="Período Letivo"
            value={selectedAcademicPeriodId}
            onChange={(e) => setSelectedAcademicPeriodId(e.target.value)}
            options={academicPeriodOptions}
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LessonPlanStatus | '')}
            options={[
              { value: '', label: 'Todos os status' },
              { value: LessonPlanStatus.DRAFT, label: 'Rascunho' },
              { value: LessonPlanStatus.SUBMITTED, label: 'Aguardando Aprovação' },
              { value: LessonPlanStatus.APPROVED, label: 'Aprovado' },
              { value: LessonPlanStatus.REJECTED, label: 'Rejeitado' },
            ]}
          />
          <Input
            label="Buscar por título"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar plano, turma ou disciplina"
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          />
          <Input
            label="Data inicial"
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            leftIcon={<CalendarIcon className="h-5 w-5" />}
          />
          <Input
            label="Data final"
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            leftIcon={<CalendarIcon className="h-5 w-5" />}
          />
          <div className="xl:col-span-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <Select
              label="Ordenação"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              options={[
                { value: 'recentes', label: 'Atualizados recentemente' },
                { value: 'pendentes', label: 'Pendentes primeiro' },
                { value: 'inicio', label: 'Data de início' },
                { value: 'titulo', label: 'Título A-Z' },
              ]}
            />
            <Button
              variant="secondary"
              aria-label="Limpar filtros"
              title="Limpar filtros"
              className="!min-w-10 !px-0"
              onClick={() => {
                setStatusFilter('');
                setSearchTerm('');
                setStartDateFilter('');
                setEndDateFilter('');
                setSortBy('recentes');
              }}
            >
              <BackspaceIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Limpar filtros</span>
            </Button>
          </div>
        </div>
      </div>

      {loadingSubjects ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando disciplinas..." />
        </div>
      ) : loadingPlans ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando planos..." />
        </div>
      ) : teacherSubjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma disciplina vinculada
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Você precisa ter uma disciplina vinculada para criar e organizar seus planos de aula.
          </p>
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 pr-2">
                    {plan.title}
                  </h3>
                  <Badge variant={statusColors[plan.status]} size="sm">
                    {statusLabels[plan.status]}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {plan.description}
                </p>

                <div className="space-y-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>
                      {new Date(plan.startDate).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(plan.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    <span>
                      {plan.classSubject?.class?.name || 'Turma'} • {plan.classSubject?.subject?.name || 'Disciplina'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      Atualizado em {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {plan.academicPeriod?.name && (
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {plan.academicPeriod.name}
                    </div>
                  )}
                </div>

                {plan.status === LessonPlanStatus.REJECTED && plan.rejectionReason && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      <strong>Motivo da rejeição:</strong> {plan.rejectionReason}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(plan)}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                    title="Visualizar"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleDuplicate(plan)}
                    className="flex-1 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                    title="Duplicar"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                    Duplicar
                  </button>
                  {(plan.status === LessonPlanStatus.DRAFT ||
                    plan.status === LessonPlanStatus.REJECTED) && (
                    <>
                      <button
                        onClick={() => handleEdit(plan)}
                        className="flex-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowSubmitDialog(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                        title="Submeter"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Enviar
                      </button>
                    </>
                  )}
                  {plan.status === LessonPlanStatus.DRAFT && (
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowDeleteDialog(true);
                      }}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum plano encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Ajuste os filtros ou comece criando um plano para a disciplina selecionada.
          </p>
          <Button onClick={handleNewPlan} leftIcon={<PlusIcon className="h-5 w-5" />}>
            Criar Plano de Aula
          </Button>
        </div>
      )}

      {/* Modal de Formulário */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPlan(null);
          setViewMode(false);
          resetForm();
        }}
        title={
          viewMode
            ? 'Visualizar Plano de Aula'
            : selectedPlan
            ? 'Editar Plano de Aula'
            : 'Novo Plano de Aula'
        }
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Turma e Disciplina"
              value={formData.classSubjectId}
              onChange={(e) => setFormData({ ...formData, classSubjectId: e.target.value })}
              options={[
                { value: '', label: 'Selecione...' },
                ...teacherSubjects.map((subject) => ({
                  value: subject.id,
                  label: `${subject.class?.name} • ${subject.subject?.name}`,
                })),
              ]}
              disabled={viewMode || Boolean(selectedPlan)}
            />
            <Select
              label="Período Letivo"
              value={formData.academicPeriodId}
              onChange={(e) => {
                const nextPeriodId = e.target.value;
                const periodRange = getDefaultPeriodRange(nextPeriodId);
                setFormData({
                  ...formData,
                  academicPeriodId: nextPeriodId,
                  startDate: formData.startDate || periodRange.startDate,
                  endDate: formData.endDate || periodRange.endDate,
                });
              }}
              options={academicPeriods.map((period) => ({
                value: period.id,
                label: period.name,
              }))}
              disabled={viewMode || Boolean(selectedPlan)}
            />
          </div>

          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={viewMode}
            placeholder="Ex: Plano Bimestral de Matemática"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={viewMode}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Breve descrição do plano..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              disabled={viewMode}
            />
            <Input
              label="Data de Término"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              disabled={viewMode}
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Objetivos e Conteúdo
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Objetivos de Aprendizagem *
            </label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              required
              disabled={viewMode}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Objetivos que os alunos devem alcançar..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conteúdo Programático *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              disabled={viewMode}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Conteúdos que serão abordados..."
            />
          </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Estratégia Pedagógica
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metodologia *
            </label>
            <textarea
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              required
              disabled={viewMode}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Métodos e estratégias de ensino..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recursos Necessários *
            </label>
            <textarea
              value={formData.resources}
              onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
              required
              disabled={viewMode}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Materiais e recursos necessários..."
            />
          </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Avaliação e Observações
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avaliação *
            </label>
            <textarea
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              required
              disabled={viewMode}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Como os alunos serão avaliados..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              disabled={viewMode}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Observações adicionais..."
            />
          </div>
          </div>

          {!viewMode && (
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedPlan(null);
                  resetForm();
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selectedPlan ? 'Atualizar' : 'Salvar Rascunho'}
              </Button>
            </div>
          )}

          {viewMode && (
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelectedPlan(null);
                  setViewMode(false);
                }}
              >
                Fechar
              </Button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
