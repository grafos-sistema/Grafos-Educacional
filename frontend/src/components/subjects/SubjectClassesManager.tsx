"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { classesService } from "@/services/classes.service";
import { subjectsService } from "@/services/subjects.service";
import { teacherSubjectsService } from "@/services/teacher-subjects.service";
import { teachersService } from "@/services/teachers.service";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@/types/user.types";
import { Button } from "@/components/ui/Button";
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
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
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

  const selectAllVisible = () => {
    const visibleIds = availableClasses.map((item) => item.id);
    setSelectedClassIds((current) => [...new Set([...current, ...visibleIds])]);
  };

  const clearVisible = () => {
    const visibleIds = new Set(availableClasses.map((item) => item.id));
    setSelectedClassIds((current) =>
      current.filter((classId) => !visibleIds.has(classId)),
    );
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
          <div className="mb-6 rounded-xl border border-primary-100 bg-primary-50/40 p-4 dark:border-primary-900/40 dark:bg-primary-900/10">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Professor responsável
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Escolha o professor que lecionará esta disciplina. A carga
                semanal será calculada pela grade de horários.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(teachersData?.data ?? []).map((teacher) => {
                  const profileId = teacher.teacherProfile!.id;
                  const selected = teacherId === profileId;
                  const name =
                    `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
                    "Professor";
                  return (
                    <label
                      key={profileId}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition-colors dark:bg-gray-900/40 ${
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
                        className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {teacher.avatar ? (
                        <img
                          src={teacher.avatar}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
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
              {!loadingTeachers && (teachersData?.data ?? []).length === 0 && (
                <p className="mt-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                  Nenhum professor ativo foi encontrado nesta instituição.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-white/80 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/30">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Turmas que receberão a disciplina
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedClassIds.length} selecionada(s) de{" "}
                    {availableClasses.length} disponível(is)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllVisible}
                    disabled={
                      isLoading || isBusy || availableClasses.length === 0
                    }
                  >
                    Selecionar todas
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearVisible}
                    disabled={isBusy || selectedClassIds.length === 0}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              {availableClasses.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Todas as turmas ativas já estão distribuídas para esta
                  disciplina.
                </p>
              ) : (
                <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {availableClasses.map((item) => {
                    const checked = selectedClassIds.includes(item.id);
                    const label = [item.course?.name, item.name, item.shift]
                      .filter(Boolean)
                      .join(" • ");
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          checked
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                            : "border-gray-200 hover:border-emerald-200 dark:border-gray-700 dark:hover:border-emerald-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClass(item.id)}
                          disabled={isBusy}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900 dark:text-white">
                            {label || item.name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {item.grade || "Série não informada"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
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
                Distribuir disciplina
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
