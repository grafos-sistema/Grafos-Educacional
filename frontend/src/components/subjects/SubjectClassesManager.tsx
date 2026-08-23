"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { classesService } from "@/services/classes.service";
import { subjectsService } from "@/services/subjects.service";
import { teacherSubjectsService } from "@/services/teacher-subjects.service";
import { teachersService } from "@/services/teachers.service";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@/types/user.types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { formatScheduleLoad } from "@/lib/schedule-load";
import type { Subject } from "@/types/subject.types";

interface SubjectClassesManagerProps {
  subjectId: string;
  institutionId: string;
  subjectName?: string;
}

type SubjectClassLink = NonNullable<Subject["classSubjects"]>[number];

interface TeacherDistributionGroup {
  key: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  links: SubjectClassLink[];
}

export function SubjectClassesManager({
  subjectId,
  institutionId,
  subjectName,
}: SubjectClassesManagerProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const currentRole = user?.activeProfile || user?.role;
  const canManage =
    currentRole === UserRole.DIRECTOR || currentRole === UserRole.COORDINATOR;
  const [teacherId, setTeacherId] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [visibleTeacherCount, setVisibleTeacherCount] = useState(12);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [visibleClassCount, setVisibleClassCount] = useState(7);
  const [removingLinkId, setRemovingLinkId] = useState<string | null>(null);

  const { data: subject, isLoading: loadingSubject } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => subjectsService.findOne(subjectId),
    enabled: Boolean(subjectId),
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes", "subject-class-manager", institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(institutionId),
  });

  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ["subject-class-manager", "teachers", institutionId],
    queryFn: () =>
      teachersService.findAll({
        institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: canManage && Boolean(institutionId),
  });

  const assignedClassIds = useMemo(
    () =>
      new Set(
        (subject?.classSubjects ?? [])
          .filter((link) => Boolean(link.teacher?.id))
          .map((link) => link.class?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    [subject?.classSubjects],
  );

  const availableClasses = useMemo(() => {
    return (classesData?.data ?? []).filter(
      (item) => !assignedClassIds.has(item.id),
    );
  }, [assignedClassIds, classesData?.data]);

  const filteredTeachers = useMemo(() => {
    const normalizedSearch = teacherSearch.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedSearch) return teachersData?.data ?? [];

    return (teachersData?.data ?? []).filter((teacher) => {
      const searchableText = [
        teacher.firstName,
        teacher.lastName,
        teacher.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableText.includes(normalizedSearch);
    });
  }, [teacherSearch, teachersData?.data]);

  const visibleTeachers = filteredTeachers.slice(0, visibleTeacherCount);

  const courseOptions = useMemo(() => {
    const options = new Map<string, string>();
    availableClasses.forEach((item) => {
      const value = item.course?.id || item.course?.name;
      if (value && item.course?.name) options.set(value, item.course.name);
    });

    return [
      { value: "", label: "Todos os cursos" },
      ...Array.from(options, ([value, label]) => ({ value, label })).sort(
        (left, right) => left.label.localeCompare(right.label, "pt-BR"),
      ),
    ];
  }, [availableClasses]);

  const shiftOptions = useMemo(() => {
    const shifts = new Set(
      availableClasses
        .map((item) => item.shift)
        .filter((shift): shift is string => Boolean(shift)),
    );

    return [
      { value: "", label: "Todos os turnos" },
      ...Array.from(shifts)
        .sort((left, right) => left.localeCompare(right, "pt-BR"))
        .map((shift) => ({ value: shift, label: shift })),
    ];
  }, [availableClasses]);

  const filteredAvailableClasses = useMemo(
    () =>
      availableClasses.filter((item) => {
        const matchesCourse =
          !courseFilter ||
          item.course?.id === courseFilter ||
          item.course?.name === courseFilter;
        const matchesShift = !shiftFilter || item.shift === shiftFilter;
        return matchesCourse && matchesShift;
      }),
    [availableClasses, courseFilter, shiftFilter],
  );

  const visibleAvailableClasses = filteredAvailableClasses.slice(
    0,
    visibleClassCount,
  );

  const areAllFilteredClassesSelected =
    filteredAvailableClasses.length > 0 &&
    filteredAvailableClasses.every((item) =>
      selectedClassIds.includes(item.id),
    );

  const resetForm = () => {
    setTeacherId("");
    setSelectedClassIds([]);
  };

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subject", subjectId] }),
      queryClient.invalidateQueries({ queryKey: ["subjects"] }),
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] }),
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] }),
      queryClient.invalidateQueries({ queryKey: ["classes"] }),
      queryClient.invalidateQueries({ queryKey: ["teacher-subjects"] }),
      queryClient.invalidateQueries({ queryKey: ["subject-teachers"] }),
    ]);
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
    );
  };

  const toggleAllFilteredClasses = () => {
    const filteredIds = filteredAvailableClasses.map((item) => item.id);

    setSelectedClassIds((current) => {
      if (filteredIds.every((id) => current.includes(id))) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      return [...new Set([...current, ...filteredIds])];
    });
  };

  const distributeMutation = useMutation({
    mutationFn: () => {
      if (!canManage) {
        throw new Error(
          "Somente a Direção e a Coordenação podem distribuir disciplinas.",
        );
      }
      if (!teacherId) throw new Error("Selecione o professor responsável.");
      if (selectedClassIds.length === 0) {
        throw new Error("Selecione pelo menos uma turma.");
      }

      return teacherSubjectsService.distributeSubject({
        subjectId,
        teacherId,
        classIds: selectedClassIds,
      });
    },
    onSuccess: async (result) => {
      await invalidate();
      resetForm();
      toast.success(result.message || "Distribuição salva com sucesso!");
    },
    onError: (error: any) =>
      toast.error(error?.message || "Não foi possível salvar a distribuição."),
  });

  const removeMutation = useMutation({
    mutationFn: (linkId: string) => {
      if (!canManage) {
        throw new Error(
          "Somente a Direção e a Coordenação podem remover vínculos.",
        );
      }
      return classesService.removeSubject(linkId);
    },
    onSuccess: async () => {
      await invalidate();
      setRemovingLinkId(null);
      toast.success("Vínculo removido da turma.");
    },
    onError: (error: any) =>
      toast.error(error?.message || "Não foi possível remover o vínculo."),
  });

  const isLoading =
    loadingSubject || loadingClasses || (canManage && loadingTeachers);
  const isBusy = distributeMutation.isPending || removeMutation.isPending;
  const links = subject?.classSubjects ?? [];
  const teacherGroups = useMemo<TeacherDistributionGroup[]>(() => {
    const groups = new Map<string, TeacherDistributionGroup>();

    links.forEach((link) => {
      const teacher = link.teacher?.user;
      const key = link.teacher?.id ?? "unassigned";
      const name = teacher
        ? `${teacher.firstName} ${teacher.lastName}`.trim()
        : "Professor não definido";
      const current = groups.get(key);

      if (current) {
        current.links.push(link);
        return;
      }

      groups.set(key, {
        key,
        name,
        email: teacher?.email,
        avatar: teacher?.avatar,
        links: [link],
      });
    });

    return Array.from(groups.values()).sort((left, right) =>
      left.name.localeCompare(right.name, "pt-BR"),
    );
  }, [links]);

  return (
    <>
      <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribuição da disciplina
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {canManage
                ? `Selecione o professor e uma ou várias turmas. O sistema cria automaticamente o vínculo de ${subjectName || "da disciplina"} e evita substituir outro professor já distribuído.`
                : "Consulte as turmas e os professores responsáveis por esta disciplina."}
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {links.length} turma(s)
          </span>
        </div>

        {canManage && (
          <div className="mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Professor responsável
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Escolha o professor que lecionará esta disciplina. A carga
                  semanal será calculada pela grade de horários.
                </p>
              </div>
              <div className="w-full md:max-w-sm">
                <Input
                  value={teacherSearch}
                  onChange={(event) => {
                    setTeacherSearch(event.target.value);
                    setVisibleTeacherCount(12);
                  }}
                  placeholder="Buscar professor por nome ou e-mail"
                  aria-label="Buscar professor por nome ou e-mail"
                  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {visibleTeachers.map((teacher) => {
                const profileId = teacher.teacherProfile!.id;
                const selected = teacherId === profileId;
                const name =
                  `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
                  "Professor";
                return (
                  <label
                    key={profileId}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border bg-white p-2.5 transition-colors dark:bg-gray-900/40 ${
                      selected
                        ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 dark:border-emerald-600 dark:bg-emerald-900/20 dark:ring-emerald-900/40"
                        : "border-gray-200 hover:border-emerald-300 dark:border-gray-700 dark:hover:border-emerald-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subject-teacher"
                      value={profileId}
                      checked={selected}
                      onChange={() => setTeacherId(profileId)}
                      disabled={isLoading || isBusy}
                      className="h-4 w-4 shrink-0 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {teacher.avatar ? (
                      <img
                        src={teacher.avatar}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {teacher.email || "Contato não informado"}
                      </span>
                      <span className="block truncate text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        Carga atual:{" "}
                        {formatScheduleLoad(
                          teacher.scheduledMinutes,
                          teacher.scheduledClassCount,
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {!loadingTeachers && filteredTeachers.length === 0 && (
              <p className="mt-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                {teacherSearch.trim()
                  ? "Nenhum professor corresponde à busca."
                  : "Nenhum professor ativo foi encontrado nesta instituição."}
              </p>
            )}
            {filteredTeachers.length > visibleTeacherCount && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setVisibleTeacherCount((count) => count + 12)}
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mostrar mais
                </button>
              </div>
            )}

            <div className="mt-5">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Turmas que receberão a disciplina
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedClassIds.length} selecionada(s) de{" "}
                    {availableClasses.length} disponível(is)
                  </p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:max-w-lg">
                  <Select
                    value={courseFilter}
                    onChange={(event) => {
                      setCourseFilter(event.target.value);
                      setVisibleClassCount(7);
                    }}
                    options={courseOptions}
                    aria-label="Filtrar turmas por curso"
                  />
                  <Select
                    value={shiftFilter}
                    onChange={(event) => {
                      setShiftFilter(event.target.value);
                      setVisibleClassCount(7);
                    }}
                    options={shiftOptions}
                    aria-label="Filtrar turmas por turno"
                  />
                </div>
              </div>

              {filteredAvailableClasses.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                  {availableClasses.length === 0
                    ? "Todas as turmas ativas já estão distribuídas para esta disciplina."
                    : "Nenhuma turma corresponde aos filtros selecionados."}
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400 md:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)]">
                    <span className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={areAllFilteredClassesSelected}
                        onChange={toggleAllFilteredClasses}
                        disabled={isLoading || isBusy}
                        aria-label="Selecionar todas as turmas filtradas"
                        className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </span>
                    <span>Turma</span>
                    <span className="hidden md:block">Detalhes</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {visibleAvailableClasses.map((item) => {
                      const checked = selectedClassIds.includes(item.id);
                      const details = [
                        item.course?.name,
                        item.grade,
                        item.shift,
                      ]
                        .filter(Boolean)
                        .join(" • ");
                      const label = item.name || "Turma";
                      return (
                        <label
                          key={item.id}
                          className={`grid cursor-pointer grid-cols-[56px_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition-colors md:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] ${
                            checked
                              ? "bg-emerald-50 dark:bg-emerald-900/20"
                              : "bg-white hover:bg-gray-50 dark:bg-gray-900/20 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          <span className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleClass(item.id)}
                              disabled={isBusy}
                              aria-label={`Selecionar ${label}`}
                              className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </span>
                          <span className="min-w-0 text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                          <span className="hidden min-w-0 truncate text-sm text-gray-500 dark:text-gray-400 md:block">
                            {details || "Dados acadêmicos não informados"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {filteredAvailableClasses.length > visibleClassCount && (
                    <div className="flex justify-end border-t border-gray-100 px-4 py-2 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleClassCount((count) => count + 7)
                        }
                        className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Mostrar mais
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => distributeMutation.mutate()}
                isLoading={distributeMutation.isPending}
                disabled={
                  isLoading ||
                  isBusy ||
                  !teacherId ||
                  selectedClassIds.length === 0
                }
              >
                Salvar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" text="Carregando distribuição..." />
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <AcademicCapIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta disciplina ainda não foi distribuída para nenhuma turma.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teacherGroups.map((group) => {
              return (
                <details
                  key={group.key}
                  className="group rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {group.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-900 dark:text-white">
                        {group.name}
                      </span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {group.email || "Contato não informado"}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {group.links.length} turma(s)
                    </span>
                    <span className="text-xs text-gray-500 transition-transform group-open:rotate-180 dark:text-gray-400">
                      ▼
                    </span>
                  </summary>

                  <div className="space-y-2 border-t border-gray-100 p-3 dark:border-gray-700">
                    {group.links.map((link) => {
                      const classInfo = link.class;
                      return (
                        <div
                          key={link.id}
                          className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/30 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {classInfo?.name ?? "Turma"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {[
                                classInfo?.course?.name,
                                classInfo?.grade,
                                classInfo?.shift,
                              ]
                                .filter(Boolean)
                                .join(" • ") ||
                                "Dados acadêmicos não informados"}
                            </p>
                            <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                              Carga semanal:{" "}
                              {formatScheduleLoad(
                                link.scheduledMinutes,
                                link.scheduledClassCount,
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon
                              className="h-5 w-5 text-emerald-600"
                              aria-hidden="true"
                            />
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemovingLinkId(link.id)}
                                leftIcon={<TrashIcon className="h-4 w-4" />}
                                disabled={isBusy}
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(removingLinkId)}
        onClose={() => setRemovingLinkId(null)}
        onConfirm={() =>
          removingLinkId && removeMutation.mutate(removingLinkId)
        }
        title="Remover disciplina da turma"
        message="Este vínculo será removido. Os horários, notas e registros que dependem dele podem precisar de revisão."
        confirmText="Remover"
      />
    </>
  );
}
