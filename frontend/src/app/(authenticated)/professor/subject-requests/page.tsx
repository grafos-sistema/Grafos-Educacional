'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSubjectRequests,
  createSubjectRequest,
  cancelSubjectRequest,
  ClassSubjectRequest,
} from '@/services/class-subject-requests.service';
import { classesService } from '@/services/classes.service';
import { subjectsService } from '@/services/subjects.service';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/Badge';

export default function SubjectRequestsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  // Buscar solicitações
  const { data: requests, isLoading } = useQuery({
    queryKey: ['subject-requests'],
    queryFn: () => listSubjectRequests(),
  });

  // Buscar turmas
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.findAll(),
  });

  // Buscar disciplinas
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsService.findAll(),
  });

  // Criar solicitação
  const createMutation = useMutation({
    mutationFn: createSubjectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-requests'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
      toast.success('Solicitação criada com sucesso!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erro ao criar solicitação'
      );
    },
  });

  // Cancelar solicitação
  const cancelMutation = useMutation({
    mutationFn: cancelSubjectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-requests'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Solicitação cancelada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erro ao cancelar solicitação'
      );
    },
  });

  const resetForm = () => {
    setSelectedClassId('');
    setSelectedSubjectId('');
    setMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId) {
      toast.error('Selecione uma turma e uma disciplina');
      return;
    }
    createMutation.mutate({
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      message: message || undefined,
    });
  };

  const handleCancel = (id: string) => {
    if (confirm('Tem certeza que deseja cancelar esta solicitação?')) {
      cancelMutation.mutate(id);
    }
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
            Solicite lecionar disciplinas em turmas
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nova Solicitação
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
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">{getStatusIcon(request.status)}</div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.subject.name}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <BuildingLibraryIcon className="h-4 w-4" />
                            <span>
                              {request.class.name} - {request.class.grade}
                              {request.class.section &&
                                ` (${request.class.section})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AcademicCapIcon className="h-4 w-4" />
                            <span>Código: {request.subject.code}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.message && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Mensagem:</span>{' '}
                          {request.message}
                        </p>
                      </div>
                    )}

                    {request.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Motivo da rejeição:</span>{' '}
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Criada em {formatDate(request.createdAt)}</span>
                      {request.reviewedAt && (
                        <span>
                          Revisada em {formatDate(request.reviewedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {request.status === 'PENDING' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(request.id)}
                    disabled={cancelMutation.isPending}
                  >
                    <TrashIcon className="h-5 w-5 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border rounded-lg p-12 text-center">
            <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma solicitação encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Comece solicitando uma disciplina para lecionar
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Nova Solicitação
            </Button>
          </div>
        )}
      </div>

      {/* Modal de criar solicitação */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Nova Solicitação de Disciplina"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turma *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione uma turma</option>
              {classesData?.data?.map((classItem: any) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.grade}
                  {classItem.section && ` (${classItem.section})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disciplina *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione uma disciplina</option>
              {subjectsData?.data?.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Justifique sua solicitação..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Solicitação'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
