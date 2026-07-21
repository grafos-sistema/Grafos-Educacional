'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CalendarIcon,
  AcademicCapIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { lessonPlansService } from '@/services/lesson-plans.service';
import { LessonPlan, LessonPlanStatus } from '@/types/lesson.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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

export default function CoordinatorLessonPlansPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<LessonPlanStatus | ''>('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Buscar planos de aula
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['lesson-plans-coordinator', statusFilter],
    queryFn: async () => {
      const response = await lessonPlansService.findAll({
        status: statusFilter || undefined,
        limit: 100,
      });
      return response;
    },
  });

  // Mutation para aprovar
  const approveMutation = useMutation({
    mutationFn: (id: string) => lessonPlansService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans-coordinator'] });
      queryClient.invalidateQueries({ queryKey: ['lesson-plans-all'] });
      toast.success('Plano de aula aprovado com sucesso!');
      setShowApproveDialog(false);
      setShowViewModal(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao aprovar plano';
      toast.error(message);
    },
  });

  // Mutation para rejeitar
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      lessonPlansService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans-coordinator'] });
      queryClient.invalidateQueries({ queryKey: ['lesson-plans-all'] });
      toast.success('Plano rejeitado - Professor notificado para revisar');
      setShowRejectDialog(false);
      setShowViewModal(false);
      setSelectedPlan(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao rejeitar plano';
      toast.error(message);
    },
  });

  const handleView = (plan: LessonPlan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const handleApprove = () => {
    if (selectedPlan) {
      approveMutation.mutate(selectedPlan.id);
    }
  };

  const handleReject = () => {
    if (selectedPlan && rejectionReason.trim()) {
      rejectMutation.mutate({ id: selectedPlan.id, reason: rejectionReason });
    }
  };

  const plans = plansData?.data || [];
  const pendingCount = plans.filter((p) => p.status === LessonPlanStatus.SUBMITTED).length;
  const approvedCount = plans.filter((p) => p.status === LessonPlanStatus.APPROVED).length;
  const rejectedCount = plans.filter((p) => p.status === LessonPlanStatus.REJECTED).length;

  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Aprovar plano de aula"
        message="Tem certeza que deseja aprovar este plano de aula? O professor será notificado."
        confirmText="Sim, aprovar"
        cancelText="Cancelar"
      />

      <Modal
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectionReason('');
        }}
        title="Rejeitar plano de aula"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Informe o motivo da rejeição para que o professor possa revisar:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Ex: Os objetivos não estão alinhados com a BNCC..."
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              isLoading={rejectMutation.isPending}
            >
              Rejeitar
            </Button>
          </div>
        </div>
      </Modal>

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
              Aprovação de Planos de Aula
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Revise e aprove os planos de aula submetidos pelos professores
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {plans.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total de Planos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {pendingCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Aguardando Aprovação</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {approvedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Aprovados</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {rejectedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Rejeitados</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LessonPlanStatus | '')}
            options={[
              { value: '', label: 'Todos' },
              { value: LessonPlanStatus.SUBMITTED, label: 'Aguardando Aprovação' },
              { value: LessonPlanStatus.APPROVED, label: 'Aprovados' },
              { value: LessonPlanStatus.REJECTED, label: 'Rejeitados' },
            ]}
          />
        </div>
      </div>

      {/* Lista de Planos */}
      {loadingPlans ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando planos..." />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum plano encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {statusFilter
              ? 'Não há planos com este status'
              : 'Não há planos de aula cadastrados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans
            .sort((a, b) => {
              // Priorizar planos pendentes
              if (a.status === LessonPlanStatus.SUBMITTED && b.status !== LessonPlanStatus.SUBMITTED) return -1;
              if (a.status !== LessonPlanStatus.SUBMITTED && b.status === LessonPlanStatus.SUBMITTED) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map((plan) => (
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
                    <AcademicCapIcon className="h-4 w-4" />
                    <span>
                      {plan.teacher?.user?.firstName} {plan.teacher?.user?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {new Date(plan.startDate).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(plan.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {plan.classSubject && (
                    <div className="text-xs">
                      <span className="font-medium">
                        {plan.classSubject.class?.name} - {plan.classSubject.subject?.name}
                      </span>
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
                  >
                    <EyeIcon className="h-4 w-4" />
                    Visualizar
                  </button>
                  {plan.status === LessonPlanStatus.SUBMITTED && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowApproveDialog(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowRejectDialog(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal de Visualização */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPlan(null);
        }}
        title="Detalhes do Plano de Aula"
        size="xl"
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedPlan.title}
              </h2>
              <Badge variant={statusColors[selectedPlan.status]}>
                {statusLabels[selectedPlan.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Professor</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedPlan.teacher?.user?.firstName}{' '}
                  {selectedPlan.teacher?.user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Turma/Disciplina</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedPlan.classSubject?.class?.name} -{' '}
                  {selectedPlan.classSubject?.subject?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Período</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedPlan.startDate).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(selectedPlan.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Descrição</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedPlan.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Objetivos de Aprendizagem
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedPlan.objectives}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Conteúdo Programático
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedPlan.content}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Metodologia</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedPlan.methodology}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Recursos Necessários
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedPlan.resources}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Avaliação</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedPlan.assessment}
              </p>
            </div>

            {selectedPlan.observations && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Observações</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedPlan.observations}
                </p>
              </div>
            )}

            {selectedPlan.status === LessonPlanStatus.REJECTED &&
              selectedPlan.rejectionReason && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                    Motivo da Rejeição
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    {selectedPlan.rejectionReason}
                  </p>
                </div>
              )}

            <div className="flex justify-end gap-3 pt-4">
              {selectedPlan.status === LessonPlanStatus.SUBMITTED && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowViewModal(false);
                      setShowRejectDialog(true);
                    }}
                    leftIcon={<XCircleIcon className="h-5 w-5" />}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => {
                      setShowViewModal(false);
                      setShowApproveDialog(true);
                    }}
                    leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                  >
                    Aprovar
                  </Button>
                </>
              )}
              {selectedPlan.status !== LessonPlanStatus.SUBMITTED && (
                <Button onClick={() => setShowViewModal(false)}>Fechar</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
