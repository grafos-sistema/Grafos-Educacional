'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { subjectsService } from '@/services/subjects.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { useAuthStore } from '@/stores/authStore';

interface TeacherSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string | null;
  teacherName?: string;
}

export function TeacherSubjectsModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
}: TeacherSubjectsModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['teacher-subjects-modal', 'subjects', user?.institutionId],
    queryFn: () =>
      subjectsService.findAll({
        institutionId: user?.institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: isOpen && Boolean(user?.institutionId),
  });

  const { data: teacherSubjects = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['teacher-subjects', teacherId],
    queryFn: () => teacherSubjectsService.getByTeacher(teacherId!),
    enabled: isOpen && Boolean(teacherId),
  });

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      return;
    }

    setSelectedSubjectIds(new Set(teacherSubjects.map((item) => item.subjectId)));
  }, [isOpen, teacherId, teacherSubjects]);

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return (subjectsData?.data ?? []).filter((subject) => {
      if (!normalizedSearch) return true;
      return [subject.name, subject.code, subject.description]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch));
    });
  }, [search, subjectsData?.data]);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((current) => {
      const next = new Set(current);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!teacherId) throw new Error('Professor não encontrado.');
      return teacherSubjectsService.syncTeacherSubjects(
        teacherId,
        Array.from(selectedSubjectIds),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teacher-subjects', teacherId] }),
        queryClient.invalidateQueries({ queryKey: ['coordinator-teacher-subjects', teacherId] }),
      ]);
      toast.success('Disciplinas do professor atualizadas com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível salvar as disciplinas do professor.');
    },
  });

  const isLoading = loadingSubjects || loadingLinks;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disciplinas do professor"
      description={teacherName ? `Selecione as disciplinas que ${teacherName} pode ministrar.` : undefined}
      size="lg"
      footer={(
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedSubjectIds.size} disciplina(s) selecionada(s)
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={saveMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              disabled={isLoading || !teacherId}
            >
              Salvar disciplinas
            </Button>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        <Input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
          disabled={isLoading || saveMutation.isPending}
        />

        {isLoading ? (
          <LoadingSpinner size="md" text="Carregando disciplinas..." />
        ) : filteredSubjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <AcademicCapIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {search ? 'Nenhuma disciplina corresponde à busca.' : 'Nenhuma disciplina ativa foi encontrada.'}
            </p>
          </div>
        ) : (
          <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
            {filteredSubjects.map((subject) => {
              const checked = selectedSubjectIds.has(subject.id);
              return (
                <label
                  key={subject.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    checked
                      ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-blue-200 dark:border-gray-700 dark:hover:border-blue-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubject(subject.id)}
                    disabled={saveMutation.isPending}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color || '#94a3b8' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-gray-900 dark:text-white">
                      {subject.name}
                    </span>
                    {subject.code ? (
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        Código: {subject.code}
                      </span>
                    ) : null}
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
