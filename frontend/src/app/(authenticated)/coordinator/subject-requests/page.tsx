'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSubjectRequests,
  approveSubjectRequest,
  rejectSubjectRequest,
  ClassSubjectRequest,
} from '@/services/class-subject-requests.service';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/Badge';

export default function CoordinatorSubjectRequestsPage() {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ClassSubjectRequest | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<number | undefined>(undefined);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const queryClient = useQueryClient();

  // Buscar solicitações
  const { data: requests, isLoading } = useQuery({
    queryKey: ['subject-requests', statusFilter],
    queryFn: () =>
      listSubjectRequests({
        status: statusFilter as any,
      }),
  });

  // Aprovar solicitação
  const approveMutation = useMutation({
    mutationFn: ({ id, weeklyHours }: { id: string; weeklyHours?: number }) =>
      approveSubjectRequest(id, weeklyHours ? { weeklyHours } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-requests'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
      toast.success('Solicitação aprovada com sucesso!');
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
      setWeeklyHours(undefined);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erro ao aprovar solicitação'
      );
    },
  });

  // Rejeitar solicitação
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectSubjectRequest(id, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-requests'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Solicitação rejeitada');
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erro ao rejeitar solicitação'
      );
    },
  });

  const handleApprove = (request: ClassSubjectRequest) => {
    setSelectedRequest(request);
    setIsApproveModalOpen(true);
  };

  const handleReject = (request: ClassSubjectRequest) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };

  const confirmApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      weeklyHours,
    });
  };

  const confirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    rejectMutation.mutate({
      id: selectedRequest.id,
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pendente</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Aprovada</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejeitada</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitações de Disciplinas
          </h1>
          <p className="text-gray-600 mt-1">
            Revise e aprove solicitações de professores
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'PENDING' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
        >
          Pendentes
        </Button>
        <Button
          variant={statusFilter === 'APPROVED' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('APPROVED')}
        >
          Aprovadas
        </Button>
        <Button
          variant={statusFilter === 'REJECTED' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejeitadas
        </Button>
        <Button
          variant={!statusFilter ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          Todas
        </Button>
      </div>

      {/* Lista de solicitações */}
      <div className="space-y-4">
        {requests && requests.length > 0 ? (
          requests.map((request: ClassSubjectRequest) => (
            <div
              key={request.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">{getStatusIcon(request.status)}</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.subject.name}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <BuildingLibraryIcon className="h-4 w-4" />
                          <span>
                            Turma: {request.class.name} - {request.class.grade}
                            {request.class.section &&
                              ` (${request.class.section})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>Código: {request.subject.code}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          <span>
                            Professor: {request.teacher.user.firstName}{' '}
                            {request.teacher.user.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span className="truncate">
                            {request.teacher.user.email}
                          </span>
                        </div>
                      </div>

                      {request.message && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Justificativa:</span>{' '}
                            {request.message}
                          </p>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">
                              Motivo da rejeição:
                            </span>{' '}
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Criada em {formatDate(request.createdAt)}</span>
                        {request.reviewedAt && (
                          <>
                            <span>•</span>
                            <span>
                              Revisada em {formatDate(request.reviewedAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(request)}
                        >
                          <CheckCircleIcon className="h-5 w-5 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(request)}
                        >
                          <XCircleIcon className="h-5 w-5 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border rounded-lg p-12 text-center">
            <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma solicitação encontrada
            </h3>
            <p className="text-gray-600">
              Não há solicitações com o status selecionado
            </p>
          </div>
        )}
      </div>

      {/* Modal de aprovar */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setSelectedRequest(null);
          setWeeklyHours(undefined);
        }}
        title="Aprovar Solicitação"
      >
        <form onSubmit={confirmApprove} className="space-y-4">
          {selectedRequest && (
            <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
              <p>
                <span className="font-medium">Professor:</span>{' '}
                {selectedRequest.teacher.user.firstName}{' '}
                {selectedRequest.teacher.user.lastName}
              </p>
              <p>
                <span className="font-medium">Disciplina:</span>{' '}
                {selectedRequest.subject.name}
              </p>
              <p>
                <span className="font-medium">Turma:</span>{' '}
                {selectedRequest.class.name} - {selectedRequest.class.grade}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carga Horária Semanal (opcional)
            </label>
            <input
              type="number"
              value={weeklyHours || ''}
              onChange={(e) =>
                setWeeklyHours(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 4"
              min={1}
            />
            <p className="text-xs text-gray-500 mt-1">
              Número de horas semanais da disciplina
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsApproveModalOpen(false);
                setSelectedRequest(null);
                setWeeklyHours(undefined);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de rejeitar */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title="Rejeitar Solicitação"
      >
        <form onSubmit={confirmReject} className="space-y-4">
          {selectedRequest && (
            <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
              <p>
                <span className="font-medium">Professor:</span>{' '}
                {selectedRequest.teacher.user.firstName}{' '}
                {selectedRequest.teacher.user.lastName}
              </p>
              <p>
                <span className="font-medium">Disciplina:</span>{' '}
                {selectedRequest.subject.name}
              </p>
              <p>
                <span className="font-medium">Turma:</span>{' '}
                {selectedRequest.class.name} - {selectedRequest.class.grade}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da Rejeição *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
              minLength={10}
              placeholder="Explique o motivo da rejeição (mínimo 10 caracteres)..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo de 10 caracteres
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedRequest(null);
                setRejectionReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
