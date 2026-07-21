'use client';

import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { academicYearsService, AcademicYearsFilterParams } from '@/services/academic-years.service';
import { AcademicYear, AcademicYearDeleteImpact } from '@/types/academic.types';
import { useAuthStore } from '@/stores/authStore';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { UserRole } from '@/types/user.types';

export default function AcademicYearsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const [filters, setFilters] = useState<AcademicYearsFilterParams>({
    page: 1,
    limit: 20,
    institutionId: user?.institutionId,
    isActive: undefined,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    academicYear: AcademicYear | null;
  }>({ isOpen: false, academicYear: null });
  const [isSoftDeleting, setIsSoftDeleting] = useState(false);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  // Buscar anos letivos
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['academic-years', filters],
    queryFn: () => academicYearsService.findAll(filters),
  });
  const { data: deleteImpact, isLoading: isLoadingDeleteImpact } = useQuery<AcademicYearDeleteImpact>({
    queryKey: ['academic-year-delete-impact', deleteModal.academicYear?.id],
    queryFn: () => academicYearsService.getDeleteImpact(deleteModal.academicYear!.id),
    enabled: isSuperAdmin && deleteModal.isOpen && Boolean(deleteModal.academicYear?.id),
    retry: false,
  });

  const handleDelete = async (academicYearId: string) => {
    try {
      setIsSoftDeleting(true);
      await academicYearsService.remove(academicYearId);
      refetch();
      setDeleteModal({ isOpen: false, academicYear: null });
      toast.success('Ano letivo desativado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover ano letivo:', error);
      toast.error(error?.message || 'Erro ao remover ano letivo');
    } finally {
      setIsSoftDeleting(false);
    }
  };

  const handlePermanentDelete = async (academicYearId: string) => {
    try {
      setIsPermanentDeleting(true);
      await academicYearsService.removePermanently(academicYearId);
      refetch();
      setDeleteModal({ isOpen: false, academicYear: null });
      toast.success('Ano letivo excluído permanentemente com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir ano letivo permanentemente:', error);
      toast.error(error?.message || 'Erro ao excluir ano letivo permanentemente');
    } finally {
      setIsPermanentDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const impactItems = deleteImpact
    ? [
        { label: 'Períodos', value: deleteImpact.directRelations.periods },
        { label: 'Turmas', value: deleteImpact.directRelations.classes },
        { label: 'Eventos', value: deleteImpact.directRelations.events },
        { label: 'Planos de aula', value: deleteImpact.dependentRelations.lessonPlans },
        { label: 'Notas', value: deleteImpact.dependentRelations.grades },
        { label: 'Matrículas', value: deleteImpact.dependentRelations.enrollments },
        { label: 'Horários', value: deleteImpact.dependentRelations.schedules },
        { label: 'Frequências', value: deleteImpact.dependentRelations.attendances },
        { label: 'Atividades', value: deleteImpact.dependentRelations.activities },
        { label: 'Rankings', value: deleteImpact.dependentRelations.rankings },
        { label: 'Provas vinculadas', value: deleteImpact.dependentRelations.examAssignments },
      ]
    : [];

  const columns: Column<AcademicYear>[] = [
    {
      key: 'year',
      label: 'Ano',
      render: (academicYear) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <span className="font-semibold">{academicYear.year}</span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
      render: (academicYear) => (
        <div>
          <div className="font-medium">{academicYear.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(academicYear.startDate)} - {formatDate(academicYear.endDate)}
          </div>
        </div>
      ),
    },
    {
      key: 'periods',
      label: 'Períodos',
      render: (academicYear) => (
        <span className="text-gray-700 dark:text-gray-300">
          {academicYear.periods?.length || 0} período(s)
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (academicYear) => (
        <Badge variant={academicYear.isActive ? 'success' : 'error'} size="sm">
          {academicYear.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (academicYear) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/academic-years/${academicYear.id}`);
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Visualizar"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/academic-years/${academicYear.id}/edit`);
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, academicYear });
            }}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
            title="Remover"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Anos Letivos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie os anos letivos da instituição
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por ano ou nome..."
              value={filters.year?.toString() || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="w-full sm:w-36">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Ativos' },
                { value: 'false', label: 'Inativos' },
              ]}
              value={filters.isActive?.toString() || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isActive: e.target.value ? e.target.value === 'true' : undefined,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Header com botão de criar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          {data && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.meta.total} ano(s) letivo(s) encontrado(s)
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push('/admin/academic-years/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Novo Ano Letivo
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(academicYear) => academicYear.id}
          isLoading={isLoading}
          emptyMessage="Nenhum ano letivo encontrado"
        />
      </div>

      {/* Paginação */}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            meta={data.meta}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, academicYear: null })}
        title="Confirmar remoção"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja desativar o ano letivo{' '}
            <strong>{deleteModal.academicYear?.name}</strong>?
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
            A remoção padrão apenas desativa o ano letivo. Para o super administrador, a exclusão permanente apaga também os vínculos em cascata.
          </div>
          {isSuperAdmin ? (
            isLoadingDeleteImpact ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
                Carregando impacto da exclusão permanente...
              </div>
            ) : deleteImpact ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Exclusão permanente para testes
                  </p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-200">
                    Se você confirmar, o sistema apagará o ano letivo e todos os registros vinculados abaixo.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {impactItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/30"
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                {deleteImpact.samples.periods.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Períodos vinculados
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {deleteImpact.samples.periods.map((period) => (
                        <span
                          key={period.id}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {period.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {deleteImpact.samples.classes.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Turmas vinculadas
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {deleteImpact.samples.classes.map((academicClass) => (
                        <span
                          key={academicClass.id}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {academicClass.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {deleteImpact.samples.events.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Eventos vinculados
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {deleteImpact.samples.events.map((event) => (
                        <span
                          key={event.id}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {event.title} - {formatDate(event.startDate)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400">
              Esta ação desativa o ano letivo e impede novos vínculos ativos.
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, academicYear: null })}
              disabled={isSoftDeleting || isPermanentDeleting}
            >
              Cancelar
            </Button>
            {isSuperAdmin ? (
              <Button
                variant="secondary"
                onClick={() =>
                  deleteModal.academicYear && handleDelete(deleteModal.academicYear.id)
                }
                isLoading={isSoftDeleting}
                disabled={isSoftDeleting || isPermanentDeleting}
              >
                Apenas Desativar
              </Button>
            ) : null}
            <Button
              variant="danger"
              onClick={() => {
                if (!deleteModal.academicYear) return;
                if (isSuperAdmin) {
                  handlePermanentDelete(deleteModal.academicYear.id);
                  return;
                }
                handleDelete(deleteModal.academicYear.id);
              }}
              isLoading={isSuperAdmin ? isPermanentDeleting : isSoftDeleting}
              disabled={isSoftDeleting || isPermanentDeleting}
            >
              {isSuperAdmin ? 'Excluir Permanentemente' : 'Remover'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
