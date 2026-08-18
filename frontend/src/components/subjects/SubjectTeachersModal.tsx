'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usersService } from '@/services/users.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/user.types';

interface SubjectTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string | null;
  subjectName?: string;
}

export function SubjectTeachersModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
}: SubjectTeachersModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());

  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['subject-teachers-modal', 'teachers', user?.institutionId],
    queryFn: () =>
      usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.TEACHER,
        hasTeacherProfile: true,
        isActive: true,
        limit: 1000,
      }),
    enabled: isOpen && Boolean(user?.institutionId),
  });

  const { data: subjectTeachers = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['teacher-subjects', 'subject', subjectId],
    queryFn: () => teacherSubjectsService.getBySubject(subjectId!),
    enabled: isOpen && Boolean(subjectId),
  });

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      return;
    }

    setSelectedTeacherIds(new Set(subjectTeachers.map((item) => item.teacherId)));
  }, [isOpen, subjectId, subjectTeachers]);

  const filteredTeachers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return (teachersData?.data ?? []).filter((teacher) => {
      if (!normalizedSearch) return true;
      return [
        `${teacher.firstName} ${teacher.lastName}`,
        teacher.email,
        teacher.teacherProfile?.registrationNumber,
      ]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch));
    });
  }, [search, teachersData?.data]);

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds((current) => {
      const next = new Set(current);
      if (next.has(teacherId)) next.delete(teacherId);
      else next.add(teacherId);
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!subjectId) throw new Error('Disciplina não encontrada.');
      return teacherSubjectsService.syncSubjectTeachers(
        subjectId,
        Array.from(selectedTeacherIds),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teacher-subjects', 'subject', subjectId] }),
        queryClient.invalidateQueries({ queryKey: ['teacher-subjects'] }),
        queryClient.invalidateQueries({ queryKey: ['coordinator-teacher-subjects'] }),
      ]);
      toast.success('Professores da disciplina atualizados com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível salvar os professores da disciplina.');
    },
  });

  const isLoading = loadingTeachers || loadingLinks;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Professores da disciplina"
      description={subjectName ? `Selecione os professores habilitados para ${subjectName}.` : undefined}
      size="lg"
      footer={(
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedTeacherIds.size} professor(es) selecionado(s)
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={saveMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              disabled={isLoading || !subjectId}
            >
              Salvar professores
            </Button>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        <Input
          placeholder="Buscar por nome, email ou matrícula..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
          disabled={isLoading || saveMutation.isPending}
        />

        {isLoading ? (
          <LoadingSpinner size="md" text="Carregando professores..." />
        ) : filteredTeachers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <UserGroupIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {search ? 'Nenhum professor corresponde à busca.' : 'Nenhum professor ativo foi encontrado.'}
            </p>
          </div>
        ) : (
          <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
            {filteredTeachers.map((teacher) => {
              const teacherId = teacher.teacherProfile?.id;
              if (!teacherId) return null;
              const checked = selectedTeacherIds.has(teacherId);
              return (
                <label
                  key={teacher.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    checked
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : 'border-gray-200 hover:border-emerald-200 dark:border-gray-700 dark:hover:border-emerald-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTeacher(teacherId)}
                    disabled={saveMutation.isPending}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {teacher.avatar ? (
                    <img
                      src={teacher.avatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {teacher.firstName?.[0]?.toUpperCase() || 'P'}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-gray-900 dark:text-white">
                      {teacher.firstName} {teacher.lastName}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {teacher.email}
                      {teacher.teacherProfile?.registrationNumber
                        ? ` • Matrícula ${teacher.teacherProfile.registrationNumber}`
                        : ''}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
