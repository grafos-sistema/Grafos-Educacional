'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { usersService, UsersFilterParams } from '@/services/users.service';
import { User, UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { formatCPF, formatPhone } from '@/components/ui/MaskedInput';
import { presentFriendlyError } from '@/lib/friendly-error';
import { GlobalAdminInstitutionUnitFilter } from '@/components/users/GlobalAdminInstitutionUnitFilter';
import { BulkUserImportModal } from '@/components/users/BulkUserImportModal';

export default function AlunosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const activeRole = user?.activeProfile ?? user?.role;
  const [filters, setFilters] = useState<UsersFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    role: UserRole.STUDENT,
    isActive: undefined,
    institutionId: user?.institutionId,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });
  const [bulkImportModal, setBulkImportModal] = useState(false);

  // Buscar alunos
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => usersService.findAll(filters),
  });

  const handleDelete = async (userId: string) => {
    try {
      await usersService.remove(userId);
      refetch();
      setDeleteModal({ isOpen: false, user: null });
      toast.success('Aluno desativado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover aluno:', error);
      presentFriendlyError(error, 'Nao foi possivel remover o aluno agora.');
    }
  };

  const handlePermanentDelete = async (userId: string) => {
    try {
      await usersService.removePermanently(userId);
      refetch();
      setDeleteModal({ isOpen: false, user: null });
      toast.success('Aluno excluído permanentemente com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir aluno permanentemente:', error);
      presentFriendlyError(
        error,
        'Nao foi possivel excluir o aluno permanentemente agora.',
      );
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (user) => (
        <div className="flex items-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="h-8 w-8 shrink-0 rounded-full object-cover mr-3 bg-gray-100 dark:bg-gray-700"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 text-green-600 dark:text-green-400 text-sm font-medium">
              {user.firstName?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium">
                {user.firstName} {user.lastName}
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'registrationNumber',
      label: 'Matrícula',
      render: (user) => user.studentProfile?.registrationNumber || '-',
    },
    {
      key: 'cpf',
      label: 'CPF',
      render: (user) => (user.cpf ? formatCPF(user.cpf) : '-'),
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: (user) => (user.phone ? formatPhone(user.phone) : '-'),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'error'} size="sm">
          {user.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (user) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/users/${user.id}`);
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Visualizar"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/alunos/${user.id}/edit`);
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, user });
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
          Alunos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie os alunos da instituição
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-3">
          <GlobalAdminInstitutionUnitFilter />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email ou matrícula..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                leftIcon={
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                }
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
                    page: 1,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Header com botão de criar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          {data && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.meta.total} aluno(s) encontrado(s)
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {activeRole === UserRole.SUPER_ADMIN_GLOBAL ? (
            <Button
              variant="secondary"
              onClick={() => setBulkImportModal(true)}
              leftIcon={<ArrowUpTrayIcon className="h-5 w-5" />}
            >
              Importar em massa
            </Button>
          ) : null}
          <Button
            onClick={() => router.push('/admin/alunos/new')}
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            Novo Aluno
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyMessage="Nenhum aluno encontrado"
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

      <BulkUserImportModal
        isOpen={bulkImportModal}
        onClose={() => setBulkImportModal(false)}
        onComplete={() => refetch()}
        defaultMode="STUDENTS"
        lockMode
      />

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        title="Remover Aluno"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover o aluno{' '}
            <strong>
              {deleteModal.user?.firstName} {deleteModal.user?.lastName}
            </strong>
            ?
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p>
              <strong>Desativar</strong> mantém o aluno no banco, apenas
              marcando-o como inativo.
            </p>
            {user?.role === UserRole.SUPER_ADMIN && (
              <p className="mt-2">
                <strong>Excluir permanentemente</strong> remove o aluno de forma
                definitiva.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, user: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                deleteModal.user && handleDelete(deleteModal.user.id)
              }
            >
              Apenas desativar
            </Button>
            {user?.role === UserRole.SUPER_ADMIN && (
              <Button
                variant="danger"
                onClick={() =>
                  deleteModal.user && handlePermanentDelete(deleteModal.user.id)
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
