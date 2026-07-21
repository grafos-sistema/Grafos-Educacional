'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { usersService, UsersFilterParams } from '@/services/users.service';
import { User, UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { useDebounce } from '@/hooks/useDebounce';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuickApproveModal } from '@/components/users/QuickApproveModal';
import { BulkApproveModal } from '@/components/users/BulkApproveModal';
import { OptimizedImage } from '@/components/performance/OptimizedImage';
import { getUserEditRouteByRole } from '@/lib/user-route-utils';

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  INSTITUTION_ADMIN: 'Admin da Instituição',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
  PARENT: 'Responsável',
};

// Filtrar opções de role para excluir SUPER_ADMIN
const roleOptions = Object.entries(roleLabels)
  .filter(([value]) => value !== UserRole.SUPER_ADMIN)
  .map(([value, label]) => ({
    value,
    label,
  }));

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [filters, setFilters] = useState<UsersFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    role: undefined,
    isActive: undefined,
    institutionId: user?.institutionId,
    hasProfile: undefined, // Filtro para usuários com/sem perfil
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkApproveModal, setBulkApproveModal] = useState(false);

  // Aplicar filtros da URL na montagem do componente
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const isActiveParam = searchParams.get('isActive');
    const searchParam = searchParams.get('search');

    if (roleParam || isActiveParam || searchParam) {
      setFilters((prev) => ({
        ...prev,
        role: roleParam ? (roleParam as UserRole) : undefined,
        isActive: isActiveParam ? isActiveParam === 'true' : undefined,
        search: searchParam || '',
      }));
    }
  }, [searchParams]);

  // Atualizar URL quando os filtros mudarem (exceto na primeira renderização)
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.role) params.set('role', filters.role);
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters.search) params.set('search', filters.search);

    const queryString = params.toString();
    const newUrl = queryString ? `/admin/users?${queryString}` : '/admin/users';

    // Atualizar URL sem recarregar a página
    if (window.location.search !== `?${queryString}`) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [filters.role, filters.isActive, filters.search]);

  // Buscar usuários
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersService.findAll(filters),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleDelete = async (userId: string) => {
    try {
      await usersService.remove(userId);
      refetch();
      setDeleteModal({ isOpen: false, user: null });
      toast.success('Usuário removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast.error(error?.message || 'Erro ao remover usuário');
    }
  };

  // Verificar se um usuário está pendente de aprovação
  const isPendingUser = (user: User) => {
    const hasAnyProfile = user.teacherProfile || user.studentProfile || user.parentProfile;
    return !hasAnyProfile && user.requestedProfileType;
  };

  // Selecionar/desselecionar usuário
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Selecionar/desselecionar todos os usuários pendentes
  const toggleAllPendingUsers = () => {
    if (!data?.data) return;

    const pendingUsers = data.data.filter(isPendingUser);
    const allPendingSelected = pendingUsers.every((user) => selectedUserIds.has(user.id));

    if (allPendingSelected) {
      // Desselecionar todos
      setSelectedUserIds(new Set());
    } else {
      // Selecionar todos os pendentes
      setSelectedUserIds(new Set(pendingUsers.map((user) => user.id)));
    }
  };

  // Obter usuários selecionados
  const selectedUsers = data?.data.filter((user) => selectedUserIds.has(user.id)) || [];

  // Verificar se todos os usuários pendentes estão selecionados
  const allPendingSelected =
    data?.data &&
    data.data.filter(isPendingUser).length > 0 &&
    data.data.filter(isPendingUser).every((user) => selectedUserIds.has(user.id));

  const columns: Column<User>[] = [
    {
      key: 'select',
      label: '',
      render: (user) => {
        const pending = isPendingUser(user);
        if (!pending) return null;

        return (
          <input
            type="checkbox"
            checked={selectedUserIds.has(user.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleUserSelection(user.id);
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        );
      },
    },
    {
      key: 'name',
      label: 'Nome',
      render: (user) => (
        <div className="flex items-center">
          {user.avatar ? (
            <OptimizedImage
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              width={32}
              height={32}
              className="rounded-full mr-3"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 text-gray-600 dark:text-gray-400 text-sm font-medium">
              {user.firstName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="font-medium">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Perfil',
      render: (user) => {
        const hasAnyProfile = user.teacherProfile || user.studentProfile || user.parentProfile;
        const isPending = !hasAnyProfile && user.requestedProfileType;

        return (
          <div className="flex flex-col gap-1">
            <Badge variant="info" size="sm">
              {roleLabels[user.role]}
            </Badge>
            {isPending && (
              <Badge variant="warning" size="sm">
                Pendente de Aprovação
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'cpf',
      label: 'CPF',
      render: (user) => user.cpf || '-',
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: (user) => user.phone || '-',
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
      render: (user) => {
        const hasAnyProfile = user.teacherProfile || user.studentProfile || user.parentProfile;
        const isPending = !hasAnyProfile && user.requestedProfileType;

        return (
          <div className="flex gap-2">
            {isPending && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setApproveModal({ isOpen: true, user });
                }}
                className="text-green-600 hover:text-green-700 dark:text-green-400"
                title="Aprovar Cadastro"
              >
                <CheckCircleIcon className="h-5 w-5" />
              </button>
            )}
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
                router.push(getUserEditRouteByRole(user.id, user.role));
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
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Usuários
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie os usuários da instituição
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={[{ value: '', label: 'Todos os perfis' }, ...roleOptions]}
              value={filters.role || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  role: e.target.value ? (e.target.value as UserRole) : undefined,
                  page: 1,
                })
              }
            />
          </div>
          <div className="w-full sm:w-32">
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
                  page: 1,
                })
              }
            />
          </div>
          <div className="w-full sm:w-36">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Com perfil' },
                { value: 'false', label: 'Pendentes' },
              ]}
              value={filters.hasProfile?.toString() || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  hasProfile: e.target.value ? e.target.value === 'true' : undefined,
                  page: 1,
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
              {data.meta.total} usuário(s) encontrado(s)
            </p>
          )}
          {selectedUserIds.size > 0 && (
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
              {selectedUserIds.size} usuário(s) selecionado(s)
            </p>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedUserIds.size > 0 && (
            <Button
              onClick={() => setBulkApproveModal(true)}
              leftIcon={<CheckCircleIcon className="h-5 w-5" />}
              className="flex-1 sm:flex-none"
              variant="success"
            >
              Aprovar Selecionados ({selectedUserIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyMessage="Nenhum usuário encontrado"
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
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        title="Confirmar remoção"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover o usuário{' '}
            <strong>{deleteModal.user?.firstName} {deleteModal.user?.lastName}</strong>?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Esta ação irá desativar o usuário no sistema.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, user: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteModal.user && handleDelete(deleteModal.user.id)}
            >
              Remover
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de aprovação rápida */}
      {approveModal.user && (
        <QuickApproveModal
          isOpen={approveModal.isOpen}
          onClose={() => {
            setApproveModal({ isOpen: false, user: null });
            refetch();
          }}
          user={approveModal.user}
        />
      )}

      {/* Modal de aprovação em massa */}
      {selectedUsers.length > 0 && (
        <BulkApproveModal
          isOpen={bulkApproveModal}
          onClose={() => {
            setBulkApproveModal(false);
            setSelectedUserIds(new Set());
            refetch();
          }}
          users={selectedUsers}
        />
      )}
    </div>
  );
}
