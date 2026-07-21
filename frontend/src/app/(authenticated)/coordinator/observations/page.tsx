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
  FunnelIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { observationsService } from '@/services/observations.service';
import { usersService } from '@/services/users.service';
import {
  Observation,
  CreateObservationDto,
  ObservationType,
  ObservationPriority,
} from '@/types/observation.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

const typeLabels: Record<ObservationType, string> = {
  PEDAGOGICAL: 'Pedagógica',
  BEHAVIORAL: 'Comportamental',
  SOCIAL: 'Social',
  HEALTH: 'Saúde',
  OTHER: 'Outra',
};

const priorityLabels: Record<ObservationPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const priorityColors: Record<
  ObservationPriority,
  'default' | 'success' | 'error' | 'warning' | 'info'
> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

export default function CoordinatorObservationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [filters, setFilters] = useState({
    type: '' as ObservationType | '',
    priority: '' as ObservationPriority | '',
    search: '',
  });

  const [formData, setFormData] = useState<CreateObservationDto>({
    studentId: '',
    type: ObservationType.PEDAGOGICAL,
    priority: ObservationPriority.MEDIUM,
    title: '',
    description: '',
    isPrivate: false,
    date: new Date().toISOString().split('T')[0],
  });

  // Buscar alunos
  const { data: studentsData } = useQuery({
    queryKey: ['students-observations', user?.institutionId],
    queryFn: async () => {
      const response = await usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.STUDENT,
        limit: 1000,
      });
      return response;
    },
    enabled: !!user?.institutionId,
  });

  // Buscar observações
  const { data: observationsData, isLoading: loadingObservations } = useQuery({
    queryKey: ['observations', filters.type, filters.priority],
    queryFn: async () => {
      const response = await observationsService.findAll({
        type: filters.type || undefined,
        priority: filters.priority || undefined,
        limit: 100,
      });
      return response;
    },
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: CreateObservationDto) => observationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      toast.success('Observação registrada com sucesso!');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao criar observação';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateObservationDto }) =>
      observationsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      toast.success('Observação atualizada com sucesso!');
      setShowModal(false);
      setSelectedObservation(null);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao atualizar observação';
      toast.error(message);
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => observationsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      toast.success('Observação removida com sucesso!');
      setShowDeleteDialog(false);
      setSelectedObservation(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao remover observação';
      toast.error(message);
    },
  });

  const resetForm = () => {
    setFormData({
      studentId: '',
      type: ObservationType.PEDAGOGICAL,
      priority: ObservationPriority.MEDIUM,
      title: '',
      description: '',
      isPrivate: false,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedObservation) {
      updateMutation.mutate({ id: selectedObservation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (observation: Observation) => {
    setSelectedObservation(observation);
    setFormData({
      studentId: observation.studentId,
      type: observation.type,
      priority: observation.priority,
      title: observation.title,
      description: observation.description,
      isPrivate: observation.isPrivate,
      date: observation.date.split('T')[0],
    });
    setShowModal(true);
  };

  const handleNew = () => {
    resetForm();
    setSelectedObservation(null);
    setShowModal(true);
  };

  const observations = observationsData?.data || [];
  const filteredObservations = observations.filter((obs) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      obs.title.toLowerCase().includes(searchLower) ||
      obs.description.toLowerCase().includes(searchLower) ||
      obs.student?.user?.firstName.toLowerCase().includes(searchLower) ||
      obs.student?.user?.lastName.toLowerCase().includes(searchLower)
    );
  });

  const urgentCount = observations.filter((o) => o.priority === ObservationPriority.URGENT).length;

  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          if (selectedObservation) {
            deleteMutation.mutate(selectedObservation.id);
          }
        }}
        title="Confirmar exclusão"
        message="Tem certeza que deseja remover esta observação? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />

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
              Observações de Alunos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Registre e acompanhe observações sobre os alunos
            </p>
          </div>
          <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />}>
            Nova Observação
          </Button>
        </div>
      </div>

      {/* Stats */}
      {urgentCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300">
                {urgentCount} observações urgentes
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Há observações marcadas como urgentes que necessitam atenção imediata
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar"
            placeholder="Aluno, título ou descrição..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            label="Tipo"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as ObservationType | '' })}
            options={[
              { value: '', label: 'Todos' },
              ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            label="Prioridade"
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value as ObservationPriority | '' })
            }
            options={[
              { value: '', label: 'Todas' },
              ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
      </div>

      {/* Lista de Observações */}
      {loadingObservations ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando observações..." />
        </div>
      ) : filteredObservations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma observação encontrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filters.search || filters.type || filters.priority
              ? 'Tente ajustar os filtros'
              : 'Comece criando uma nova observação'}
          </p>
          <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />}>
            Criar Observação
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredObservations
            .sort((a, b) => {
              // Ordenar por prioridade e depois por data
              const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
              const priorityDiff =
                priorityOrder[a.priority] - priorityOrder[b.priority];
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            })
            .map((observation) => (
              <div
                key={observation.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {observation.title}
                      </h3>
                      <Badge variant={priorityColors[observation.priority]} size="sm">
                        {priorityLabels[observation.priority]}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {typeLabels[observation.type]}
                      </Badge>
                      {observation.isPrivate && (
                        <Badge variant="info" size="sm">
                          Privada
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">
                        {observation.student?.user?.firstName}{' '}
                        {observation.student?.user?.lastName}
                      </span>
                      {' " '}
                      <span>{new Date(observation.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {observation.description}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(observation)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedObservation(observation);
                        setShowDeleteDialog(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {observation.author && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    Registrado por {observation.author.firstName} {observation.author.lastName}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Modal de Formulário */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedObservation(null);
          resetForm();
        }}
        title={selectedObservation ? 'Editar Observação' : 'Nova Observação'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Aluno *"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            required
            options={[
              { value: '', label: 'Selecione um aluno' },
              ...(studentsData?.data.map((student) => ({
                value: student.studentProfile?.id || '',
                label: `${student.firstName} ${student.lastName} - ${student.studentProfile?.registrationNumber || '-'}`,
              })) || []),
            ]}
          />

          <Input
            label="Título *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Ex: Dificuldade em Matemática"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo *"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ObservationType })}
              required
              options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
            />

            <Select
              label="Prioridade *"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as ObservationPriority })
              }
              required
              options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <Input
            label="Data *"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva a observação detalhadamente..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Observação privada (visível apenas para coordenação)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedObservation(null);
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
              {selectedObservation ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
