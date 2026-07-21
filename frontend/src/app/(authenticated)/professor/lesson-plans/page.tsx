'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { lessonPlansService } from '@/services/lesson-plans.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import {
  LessonPlan,
  CreateLessonPlanDto,
  LessonPlanStatus,
} from '@/types/lesson.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

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
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');
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
    teacherId: user?.teacherProfile?.id || '',
  });

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

  const { data: teacherSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['classes-with-subjects-plans', user?.institutionId, configuredSubjectIds, classIds],
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

      // Deduplica por classSubject id
      const flat = results.flat();
      return flat.filter((item, index, self) =>
        index === self.findIndex(s => s.id === item.id)
      );
    },
    enabled: myConfiguredSubjects.length > 0 && allClasses.length > 0,
  });

  // Buscar planos
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['lesson-plans', selectedClassSubjectId, user?.teacherProfile?.id],
    queryFn: async () => {
      if (!selectedClassSubjectId) return [];
      return await lessonPlansService.findByClassSubject(selectedClassSubjectId);
    },
    enabled: !!selectedClassSubjectId,
  });

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
    mutationFn: ({ id, data }: { id: string; data: CreateLessonPlanDto }) =>
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

  const resetForm = () => {
    setFormData({
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
      classSubjectId: selectedClassSubjectId,
      teacherId: user?.teacherProfile?.id || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan) {
      updateMutation.mutate({ id: selectedPlan.id, data: formData });
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
      teacherId: plan.teacherId,
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
      teacherId: plan.teacherId,
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
    resetForm();
    setSelectedPlan(null);
    setViewMode(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Planos de Aula
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Crie e gerencie seus planos de aula
            </p>
          </div>
          {selectedClassSubjectId && (
            <Button onClick={handleNewPlan} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Novo Plano
            </Button>
          )}
        </div>
      </div>

      {/* Filtro */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <Select
          label="Turma e Disciplina"
          value={selectedClassSubjectId}
          onChange={(e) => setSelectedClassSubjectId(e.target.value)}
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

      {/* Conteúdo */}
      {!selectedClassSubjectId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Selecione uma turma e disciplina
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Escolha a disciplina para visualizar e criar planos de aula
          </p>
        </div>
      ) : loadingPlans ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando planos..." />
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
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

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date(plan.startDate).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(plan.endDate).toLocaleDateString('pt-BR')}
                  </span>
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
            Nenhum plano de aula criado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Comece criando seu primeiro plano de aula
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

          <div className="grid grid-cols-2 gap-4">
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
