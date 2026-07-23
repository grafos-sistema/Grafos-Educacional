'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { subjectsService, SubjectsFilterParams } from '@/services/subjects.service';
import { Subject } from '@/types/subject.types';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';

export default function SubjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<SubjectsFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    institutionId: user?.institutionId,
    isActive: undefined,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    subject: Subject | null;
  }>({ isOpen: false, subject: null });

  // Buscar disciplinas
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subjects', filters],
    queryFn: () => subjectsService.findAll(filters),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleDelete = async (subjectId: string) => {
    try {
      await subjectsService.remove(subjectId);
      refetch();
      setDeleteModal({ isOpen: false, subject: null });
      toast.success('Disciplina removida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover disciplina:', error);
      toast.error(error?.message || 'Erro ao remover disciplina');
    }
  };

  const handlePermanentDelete = async (subjectId: string) => {
    try {
      await subjectsService.removePermanently(subjectId);
      refetch();
      setDeleteModal({ isOpen: false, subject: null });
      toast.success('Disciplina excluida permanentemente com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir disciplina permanentemente:', error);
      toast.error(error?.message || 'Erro ao excluir disciplina permanentemente');
    }
  };

  const columns: Column<Subject>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (subject) => (
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: subject.color
                ? `${subject.color}20`
                : '#E5E7EB',
            }}
          >
            <BookOpenIcon
              className="h-5 w-5"
              style={{ color: subject.color || '#6B7280' }}
            />
          </div>
          <div>
            <div className="font-medium">{subject.name}</div>
            {subject.code && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Código: {subject.code}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Descrição',
      render: (subject) => (
        <span className="text-gray-700 dark:text-gray-300">
          {subject.description
            ? subject.description.length > 50
              ? `${subject.description.substring(0, 50)}...`
              : subject.description
            : '-'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (subject) => (
        <Badge variant={subject.isActive ? 'success' : 'error'} size="sm">
          {subject.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (subject) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/subjects/${subject.id}`);
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Visualizar"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/subjects/${subject.id}/edit`);
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, subject });
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
          Disciplinas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as disciplinas oferecidas pela instituição
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, código ou descrição..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
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
                  isActive: e.target.value
                    ? e.target.value === 'true'
                    : undefined,
                })
              }
            />
          </div>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
          >
            Buscar
          </Button>
        </form>
      </div>

      {/* Header com botão de criar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          {data && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.meta.total} disciplina(s) encontrada(s)
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push('/admin/subjects/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Nova Disciplina
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(subject) => subject.id}
          isLoading={isLoading}
          emptyMessage="Nenhuma disciplina encontrada"
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
        onClose={() => setDeleteModal({ isOpen: false, subject: null })}
        title="Remover Disciplina"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover a disciplina{' '}
            <strong>{deleteModal.subject?.name}</strong>?
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p>
              <strong>Desativar</strong> mantém a disciplina no banco, apenas marcando-a como inativa.
            </p>
            {user?.role === UserRole.SUPER_ADMIN && (
              <p className="mt-2">
                <strong>Excluir permanentemente</strong> remove a disciplina de forma definitiva.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, subject: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => deleteModal.subject && handleDelete(deleteModal.subject.id)}
            >
              Apenas desativar
            </Button>
            {user?.role === UserRole.SUPER_ADMIN && (
              <Button
                variant="danger"
                onClick={() =>
                  deleteModal.subject && handlePermanentDelete(deleteModal.subject.id)
                }
              >
                Excluir permanentemente
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
