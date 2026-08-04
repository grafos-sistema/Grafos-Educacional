'use client';

import { toast } from 'react-hot-toast';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { institutionsService } from '@/services/institutions.service';
import { Institution, InstitutionFilterParams } from '@/types/institution.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';

export default function InstitutionsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<InstitutionFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    isActive: undefined,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    institution: Institution | null;
  }>({ isOpen: false, institution: null });
  const [expandedInstitutionIds, setExpandedInstitutionIds] = useState<string[]>([]);

  // Buscar instituições
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['institutions', filters],
    queryFn: () => institutionsService.findAll(filters),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleDelete = async (id: string) => {
    try {
      await institutionsService.remove(id);
      refetch();
      setDeleteModal({ isOpen: false, institution: null });
      toast.success('Instituição removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover instituição:', error);
      toast.error('Erro ao remover instituição');
    }
  };

  const toggleInstitutionExpansion = (institutionId: string) => {
    setExpandedInstitutionIds((current) =>
      current.includes(institutionId)
        ? current.filter((id) => id !== institutionId)
        : [...current, institutionId]
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Instituições
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as escolas e instituições do sistema
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, slug, ou cidade..."
              value={filters.search || ''}
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
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isActive: e.target.value ? e.target.value === 'true' : undefined,
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
              {data.meta.total} instituição(ões) encontrada(s)
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push('/super-admin/institutions/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Nova Instituição
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-4">
            <div className="h-12 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-100 dark:bg-gray-800 mb-2" />
            ))}
          </div>
        ) : !data?.data?.length ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Nenhuma instituição encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-14 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Anexos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {data.data.map((inst) => {
                  const isExpanded = expandedInstitutionIds.includes(inst.id);
                  const annexes = inst.units ?? [];

                  return (
                    <Fragment key={inst.id}>
                      <tr
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleInstitutionExpansion(inst.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                            aria-label={isExpanded ? 'Ocultar anexos' : 'Mostrar anexos'}
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="h-5 w-5" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="font-medium">{inst.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{inst.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {inst.city ? `${inst.city} - ${inst.state}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={inst.isActive ? 'success' : 'error'} size="sm">
                            {inst.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/super-admin/institutions/${inst.id}/edit`);
                              }}
                              className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                              title="Editar"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ isOpen: true, institution: inst });
                              }}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                              title="Remover"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="bg-gray-50/70 dark:bg-gray-800/40">
                          <td colSpan={5} className="px-6 py-4">
                            {annexes.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                Nenhum anexo cadastrado para esta instituição.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {annexes.map((unit) => (
                                  <div
                                    key={unit.id}
                                    className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {unit.name}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Diretor: {unit.managerName?.trim() || 'Não vinculado'}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {unit.city ? `${unit.city} - ${unit.state}` : 'Localização não informada'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
        onClose={() => setDeleteModal({ isOpen: false, institution: null })}
        title="Confirmar remoção"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover a instituição{' '}
            <strong>{deleteModal.institution?.name}</strong>?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Esta ação irá desativar a instituição no sistema e pode afetar os usuários vinculados a ela.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, institution: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteModal.institution && handleDelete(deleteModal.institution.id)}
            >
              Remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
