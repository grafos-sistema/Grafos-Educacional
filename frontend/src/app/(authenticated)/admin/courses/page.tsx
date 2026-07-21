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
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { coursesService, CoursesFilterParams } from '@/services/courses.service';
import { Course } from '@/types/course.types';
import { useAuthStore } from '@/stores/authStore';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<CoursesFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    institutionId: user?.institutionId,
    isActive: undefined,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    course: Course | null;
  }>({ isOpen: false, course: null });

  // Buscar cursos
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['courses', filters],
    queryFn: () => coursesService.findAll(filters),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleDelete = async (courseId: string) => {
    try {
      await coursesService.remove(courseId);
      refetch();
      setDeleteModal({ isOpen: false, course: null });
      toast.success('Curso removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover curso:', error);
      toast.error(error?.message || 'Erro ao remover curso');
    }
  };

  const columns: Column<Course>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (course) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <AcademicCapIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium">{course.name}</div>
            {course.code && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Código: {course.code}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      label: 'Nível',
      render: (course) => course.level || '-',
    },
    {
      key: 'duration',
      label: 'Duração',
      render: (course) =>
        course.duration ? `${course.duration} ano(s)` : '-',
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (course) => (
        <Badge variant={course.isActive ? 'success' : 'error'} size="sm">
          {course.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (course) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/courses/${course.id}`);
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Visualizar"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/courses/${course.id}/edit`);
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, course });
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
          Cursos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie os cursos oferecidos pela instituição
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
              {data.meta.total} curso(s) encontrado(s)
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push('/admin/courses/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Novo Curso
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <Table
          data={data?.data || []}
          columns={columns}
          keyExtractor={(course) => course.id}
          isLoading={isLoading}
          emptyMessage="Nenhum curso encontrado"
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
        onClose={() => setDeleteModal({ isOpen: false, course: null })}
        title="Confirmar remoção"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover o curso{' '}
            <strong>{deleteModal.course?.name}</strong>?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Esta ação não poderá ser desfeita se houver turmas vinculadas.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, course: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deleteModal.course && handleDelete(deleteModal.course.id)
              }
            >
              Remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
