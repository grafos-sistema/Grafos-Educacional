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
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { classesService, ClassesFilterParams } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { academicYearsService } from '@/services/academic-years.service';
import { Class } from '@/types/class.types';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { institutionsService } from '@/services/institutions.service';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { presentFriendlyError } from '@/lib/friendly-error';

export default function ClassesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentRole = user?.activeProfile || user?.role;
  const isGlobalAdmin = user?.role === UserRole.SUPER_ADMIN_GLOBAL;
  const canRemoveClasses = currentRole !== UserRole.COORDINATOR;
  const [globalInstitutionId, setGlobalInstitutionId] = useState('');
  const [globalUnitId, setGlobalUnitId] = useState('');
  const [filters, setFilters] = useState<ClassesFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    institutionId: user?.institutionId,
    isActive: undefined,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    class: Class | null;
  }>({ isOpen: false, class: null });

  const { data: institutionsData, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ['academic-scope-institutions'],
    queryFn: () => institutionsService.findAll({ page: 1, limit: 200, isActive: true }),
    enabled: isGlobalAdmin,
  });
  const selectedInstitution = institutionsData?.data.find(
    (institution) => institution.id === globalInstitutionId,
  );
  const availableUnits = (selectedInstitution?.units ?? []).filter((unit) => unit.isActive);
  const scopeInstitutionId = isGlobalAdmin ? globalInstitutionId : user?.institutionId;
  const scopeUnitId = isGlobalAdmin ? globalUnitId : undefined;
  const effectiveFilters: ClassesFilterParams = {
    ...filters,
    institutionId: scopeInstitutionId || undefined,
    unitId: scopeUnitId,
  };
  const canLoadClasses = isGlobalAdmin
    ? Boolean(globalInstitutionId && globalUnitId)
    : Boolean(user?.institutionId);

  // Buscar turmas
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['classes', effectiveFilters],
    queryFn: () => classesService.findAll(effectiveFilters),
    enabled: canLoadClasses,
  });

  // Buscar cursos para filtro
  const { data: coursesData } = useQuery({
    queryKey: ['courses', { institutionId: scopeInstitutionId, unitId: scopeUnitId, limit: 100 }],
    queryFn: () =>
      coursesService.findAll({
        institutionId: scopeInstitutionId,
        unitId: scopeUnitId,
        limit: 100,
        isActive: true,
      }),
    enabled: Boolean(scopeInstitutionId) && (!isGlobalAdmin || Boolean(scopeUnitId)),
  });

  // Buscar anos letivos para filtro
  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years', { institutionId: scopeInstitutionId, unitId: scopeUnitId, limit: 100 }],
    queryFn: () =>
      academicYearsService.findAll({
        institutionId: scopeInstitutionId,
        unitId: scopeUnitId,
        limit: 100,
        isActive: true,
      }),
    enabled: Boolean(scopeInstitutionId) && (!isGlobalAdmin || Boolean(scopeUnitId)),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleGlobalInstitutionChange = (institutionId: string) => {
    setGlobalInstitutionId(institutionId);
    setGlobalUnitId('');
    setFilters({
      ...filters,
      page: 1,
      institutionId,
      unitId: undefined,
      courseId: undefined,
      academicYearId: undefined,
    });
  };

  const handleGlobalUnitChange = (unitId: string) => {
    setGlobalUnitId(unitId);
    setFilters({ ...filters, page: 1, unitId, courseId: undefined, academicYearId: undefined });
  };

  const handleDelete = async (classId: string) => {
    try {
      await classesService.remove(classId);
      refetch();
      setDeleteModal({ isOpen: false, class: null });
    } catch (error: any) {
      console.error('Erro ao remover turma:', error);
      presentFriendlyError(error, 'Nao foi possivel remover a turma agora.');
    }
  };

  const handlePermanentDelete = async (classId: string) => {
    try {
      await classesService.removePermanently(classId);
      refetch();
      setDeleteModal({ isOpen: false, class: null });
      toast.success('Turma excluida permanentemente com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir turma permanentemente:', error);
      presentFriendlyError(error, 'Nao foi possivel excluir a turma permanentemente agora.');
    }
  };

  const columns: Column<Class>[] = [
    {
      key: 'name',
      label: 'Turma',
      render: (classItem) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-medium">{classItem.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {classItem.grade}
              {classItem.section && ` - Turma ${classItem.section}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Curso',
      render: (classItem) => classItem.course?.name || '-',
    },
    {
      key: 'academicYear',
      label: 'Ano Letivo',
      render: (classItem) =>
        classItem.academicYear
          ? String(classItem.academicYear.year)
          : '-',
    },
    {
      key: 'shift',
      label: 'Turno',
      render: (classItem) => classItem.shift || '-',
    },
    {
      key: 'baseRoom',
      label: 'Sala',
      render: (classItem) => classItem.baseRoom || '-',
    },
    {
      key: 'students',
      label: 'Alunos',
      render: (classItem) => (
        <div className="text-gray-700 dark:text-gray-300">
          {classItem._count?.enrollments || 0}
          {classItem.maxStudents && ` / ${classItem.maxStudents}`}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (classItem) => (
        <Badge variant={classItem.isActive ? 'success' : 'error'} size="sm">
          {classItem.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (classItem) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/classes/${classItem.id}`);
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Visualizar"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/classes/${classItem.id}`);
            }}
            className="text-violet-600 hover:text-violet-700 dark:text-violet-400"
            title="Gerenciar alunos"
          >
            <UserGroupIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/classes/${classItem.id}/edit`);
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {canRemoveClasses && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, class: classItem });
              }}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
              title="Remover"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Turmas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as turmas da instituição
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {isGlobalAdmin && (
            <>
              <div className="w-full sm:min-w-[250px] sm:flex-1">
                <Select
                  label="Instituição"
                  options={[
                    { value: '', label: isLoadingInstitutions ? 'Carregando instituições...' : 'Selecione uma instituição' },
                    ...(institutionsData?.data.map((institution) => ({
                      value: institution.id,
                      label: institution.name,
                    })) || []),
                  ]}
                  value={globalInstitutionId}
                  onChange={(e) => handleGlobalInstitutionChange(e.target.value)}
                  disabled={isLoadingInstitutions}
                />
              </div>
              <div className="w-full sm:min-w-[220px] sm:flex-1">
                <Select
                  label="Anexo"
                  options={[
                    { value: '', label: 'Selecione um anexo' },
                    ...availableUnits.map((unit) => ({ value: unit.id, label: unit.name })),
                  ]}
                  value={globalUnitId}
                  onChange={(e) => handleGlobalUnitChange(e.target.value)}
                  disabled={!globalInstitutionId || availableUnits.length === 0}
                />
              </div>
            </>
          )}
          <div className={isGlobalAdmin ? 'w-full sm:w-56' : 'flex-1'}>
            <Input
              placeholder="Buscar por nome ou série..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={[
                { value: '', label: 'Todos os cursos' },
                ...(coursesData?.data.map((course) => ({
                  value: course.id,
                  label: course.name,
                })) || []),
              ]}
              value={filters.courseId || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  courseId: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={[
                { value: '', label: 'Todos os anos' },
                ...(academicYearsData?.data.map((year) => ({
                  value: year.id,
                  label: String(year.year),
                })) || []),
              ]}
              value={filters.academicYearId || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  academicYearId: e.target.value || undefined,
                })
              }
            />
          </div>
          {!isGlobalAdmin && <div className="w-full sm:w-32">
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
          </div>}
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
              {data.meta.total} turma(s) encontrada(s)
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push('/admin/classes/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Nova Turma
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {isGlobalAdmin && !canLoadClasses ? (
          <div className="p-10 text-center text-sm text-gray-600 dark:text-gray-400">
            Selecione uma instituição e um anexo para visualizar as turmas.
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não foi possível carregar as turmas agora.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(classItem) => classItem.id}
          isLoading={isLoading}
          emptyMessage="Nenhuma turma encontrada"
        />
        )}
      </div>

      {/* Paginação */}
      {canLoadClasses && data && data.meta.totalPages > 1 && (
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
        onClose={() => setDeleteModal({ isOpen: false, class: null })}
        title="Remover Turma"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover a turma{' '}
            <strong>{deleteModal.class?.name}</strong>?
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p>
              <strong>Desativar</strong> mantém a turma no banco, apenas marcando-a como inativa.
            </p>
            {currentRole === UserRole.SUPER_ADMIN && (
              <p className="mt-2">
                <strong>Excluir permanentemente</strong> remove a turma de forma definitiva.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, class: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => deleteModal.class && handleDelete(deleteModal.class.id)}
            >
              Apenas desativar
            </Button>
            {currentRole === UserRole.SUPER_ADMIN && (
              <Button
                variant="danger"
                onClick={() =>
                  deleteModal.class && handlePermanentDelete(deleteModal.class.id)
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
