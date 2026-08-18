'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { usersService, UsersFilterParams } from '@/services/users.service';
import { User, UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { formatPhone } from '@/components/ui/MaskedInput';
import { TeacherSubjectsModal } from '@/components/teachers/TeacherSubjectsModal';

export default function CoordinatorTeachersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<UsersFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    role: UserRole.TEACHER,
    isActive: undefined,
  });
  const [teacherForSubjects, setTeacherForSubjects] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-teachers', filters, user?.institutionId],
    queryFn: () =>
      usersService.findAll({
        ...filters,
        institutionId: user?.institutionId,
      }),
    enabled: Boolean(user?.institutionId),
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Professor',
      render: (teacher) => (
        <div className="flex items-center gap-3">
          {teacher.avatar ? (
            <img
              src={teacher.avatar}
              alt={`${teacher.firstName} ${teacher.lastName}`}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {teacher.firstName?.[0]?.toUpperCase() || 'P'}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {teacher.firstName} {teacher.lastName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{teacher.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Especialização',
      render: (teacher) => teacher.teacherProfile?.specialization || '-',
    },
    {
      key: 'registrationNumber',
      label: 'Matrícula',
      render: (teacher) => teacher.teacherProfile?.registrationNumber || '-',
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: (teacher) => (teacher.phone ? formatPhone(teacher.phone) : '-'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (teacher) => (
        <Badge variant={teacher.isActive ? 'success' : 'error'} size="sm">
          {teacher.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-28',
      render: (teacher) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/coordinator/professores/${teacher.id}`);
            }}
            className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
            title="Visualizar dados"
            aria-label={`Visualizar ${teacher.firstName} ${teacher.lastName}`}
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (teacher.teacherProfile?.id) {
                setTeacherForSubjects({
                  id: teacher.teacherProfile.id,
                  name: `${teacher.firstName} ${teacher.lastName}`,
                });
              }
            }}
            disabled={!teacher.teacherProfile?.id}
            className="text-emerald-600 transition-colors hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400"
            title="Definir disciplinas"
            aria-label={`Definir disciplinas de ${teacher.firstName} ${teacher.lastName}`}
          >
            <AcademicCapIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Professores</h1>
        <p className="text-gray-600 dark:text-gray-400">
          A coordenação acompanha o corpo docente sem alterar o cadastro principal.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white shadow-sm">
          <div className="text-sm text-blue-100">Professores encontrados</div>
          <div className="mt-1 text-3xl font-bold">{data?.meta.total || 0}</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Tela da coordenação</div>
          <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            Consulta operacional
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Permissão desta tela</div>
          <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            Sem editar cadastro
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, email ou matrícula..."
              value={filters.search}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  search: e.target.value,
                  page: 1,
                }))
              }
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="w-full lg:w-40">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Ativos' },
                { value: 'false', label: 'Inativos' },
              ]}
              value={filters.isActive?.toString() || ''}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  isActive: e.target.value ? e.target.value === 'true' : undefined,
                  page: 1,
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(teacher) => teacher.id}
          isLoading={isLoading}
          emptyMessage="Nenhum professor encontrado"
        />
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            meta={data.meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </div>
      )}

      <TeacherSubjectsModal
        isOpen={Boolean(teacherForSubjects)}
        onClose={() => setTeacherForSubjects(null)}
        teacherId={teacherForSubjects?.id ?? null}
        teacherName={teacherForSubjects?.name}
      />
    </div>
  );
}
