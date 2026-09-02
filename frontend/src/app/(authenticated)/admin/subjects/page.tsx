"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import {
  subjectsService,
  SubjectsFilterParams,
} from "@/services/subjects.service";
import { Subject } from "@/types/subject.types";
import { UserRole } from "@/types/user.types";
import { useAuthStore } from "@/stores/authStore";
import { institutionsService } from "@/services/institutions.service";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";

export default function SubjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isGlobalAdmin = user?.role === UserRole.SUPER_ADMIN_GLOBAL;
  const [globalInstitutionId, setGlobalInstitutionId] = useState("");
  const [globalUnitId, setGlobalUnitId] = useState("");
  const [filters, setFilters] = useState<SubjectsFilterParams>({
    page: 1,
    limit: 20,
    search: "",
    institutionId: user?.institutionId,
    isActive: undefined,
  });
  const { data: institutionsData, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["academic-scope-institutions"],
    queryFn: () => institutionsService.findAll({ page: 1, limit: 200, isActive: true }),
    enabled: isGlobalAdmin,
  });
  const selectedInstitution = institutionsData?.data.find(
    (institution) => institution.id === globalInstitutionId,
  );
  const availableUnits = (selectedInstitution?.units ?? []).filter((unit) => unit.isActive);
  const effectiveFilters: SubjectsFilterParams = isGlobalAdmin
    ? {
        ...filters,
        institutionId: globalInstitutionId || undefined,
        unitId: globalUnitId || undefined,
      }
    : {
        ...filters,
        institutionId: user?.institutionId,
        unitId: undefined,
      };
  const canLoadSubjects = isGlobalAdmin
    ? Boolean(globalInstitutionId && globalUnitId)
    : Boolean(user?.institutionId);

  // Buscar disciplinas
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["subjects", effectiveFilters],
    queryFn: () => subjectsService.findAll(effectiveFilters),
    enabled: canLoadSubjects,
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleGlobalInstitutionChange = (institutionId: string) => {
    setGlobalInstitutionId(institutionId);
    setGlobalUnitId("");
    setFilters({ ...filters, page: 1, institutionId, unitId: undefined });
  };

  const handleGlobalUnitChange = (unitId: string) => {
    setGlobalUnitId(unitId);
    setFilters({ ...filters, page: 1, unitId });
  };

  const columns: Column<Subject>[] = [
    {
      key: "name",
      label: "Nome",
      render: (subject) => (
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: subject.color ? `${subject.color}20` : "#E5E7EB",
            }}
          >
            <BookOpenIcon
              className="h-5 w-5"
              style={{ color: subject.color || "#6B7280" }}
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
      key: "description",
      label: "Descrição",
      render: (subject) => (
        <span className="text-gray-700 dark:text-gray-300">
          {subject.description
            ? subject.description.length > 50
              ? `${subject.description.substring(0, 50)}...`
              : subject.description
            : "-"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (subject) => (
        <Badge variant={subject.isActive ? "success" : "error"} size="sm">
          {subject.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Ações",
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
        {isGlobalAdmin ? (
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full sm:min-w-[250px] sm:flex-1">
              <Select
                label="Instituição"
                options={[
                  { value: "", label: isLoadingInstitutions ? "Carregando instituições..." : "Selecione uma instituição" },
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
                  { value: "", label: "Selecione um anexo" },
                  ...availableUnits.map((unit) => ({ value: unit.id, label: unit.name })),
                ]}
                value={globalUnitId}
                onChange={(e) => handleGlobalUnitChange(e.target.value)}
                disabled={!globalInstitutionId || availableUnits.length === 0}
              />
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Buscar por nome..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
              />
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!canLoadSubjects}
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            >
              Buscar
            </Button>
          </form>
        ) : (
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, código ou descrição..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                leftIcon={
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                }
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: "", label: "Todos" },
                  { value: "true", label: "Ativos" },
                  { value: "false", label: "Inativos" },
                ]}
                value={filters.isActive?.toString() || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    isActive: e.target.value
                      ? e.target.value === "true"
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
        )}
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
          onClick={() => router.push("/admin/subjects/new")}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Nova Disciplina
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {isGlobalAdmin && !canLoadSubjects ? (
          <div className="p-10 text-center text-sm text-gray-600 dark:text-gray-400">
            Selecione uma instituição e um anexo para visualizar as disciplinas.
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não foi possível carregar as disciplinas agora.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <Table
            data={data?.data || []}
            columns={columns}
            keyExtractor={(subject) => subject.id}
            isLoading={isLoading}
            emptyMessage="Nenhuma disciplina encontrada"
          />
        )}
      </div>

      {/* Paginação */}
      {canLoadSubjects && data && data.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            meta={data.meta}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </div>
      )}

    </div>
  );
}
