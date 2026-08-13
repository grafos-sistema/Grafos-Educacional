'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { usersService, UsersFilterParams } from '@/services/users.service';
import { User, UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { useDebounce } from '@/hooks/useDebounce';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { formatCPF, formatPhone } from '@/components/ui/MaskedInput';
import { GlobalAdminInstitutionUnitFilter } from '@/components/users/GlobalAdminInstitutionUnitFilter';

export default function SecretariosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [filters, setFilters] = useState<UsersFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    role: UserRole.INSTITUTION_ADMIN,
    isActive: undefined,
    institutionId: user?.institutionId,
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch,
      page: 1,
    }));
  }, [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ['secretaries', filters],
    queryFn: () => usersService.findAll(filters),
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (secretary) => (
        <div className="flex items-center">
          {secretary.avatar ? (
            <img
              src={secretary.avatar}
              alt={`${secretary.firstName} ${secretary.lastName}`}
              className="h-8 w-8 shrink-0 rounded-full object-cover mr-3 bg-gray-100 dark:bg-gray-700"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              {secretary.firstName?.charAt(0).toUpperCase() || 'S'}
            </div>
          )}
          <div>
            <div className="font-medium">{secretary.firstName} {secretary.lastName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{secretary.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'cpf',
      label: 'CPF',
      render: (secretary) => (secretary.cpf ? formatCPF(secretary.cpf) : '-'),
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: (secretary) => (secretary.phone ? formatPhone(secretary.phone) : '-'),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (secretary) => (
        <Badge variant={secretary.isActive ? 'success' : 'error'} size="sm">
          {secretary.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (secretary) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/users/${secretary.id}`);
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Visualizar"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/users/${secretary.id}/edit`);
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Secretários(as)</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os secretários(as) cadastrados</p>
        </div>
        <Button
          onClick={() => router.push('/admin/secretarios/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          Novo Secretário(a)
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-3">
          <GlobalAdminInstitutionUnitFilter />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    page: 1,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {data && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {data.meta.total} secretário(a)(s) encontrado(s)
        </p>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(secretary) => secretary.id}
          isLoading={isLoading}
          emptyMessage="Nenhum secretário(a) encontrado"
        />
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination meta={data.meta} onPageChange={(page) => setFilters({ ...filters, page })} />
        </div>
      )}
    </div>
  );
}
