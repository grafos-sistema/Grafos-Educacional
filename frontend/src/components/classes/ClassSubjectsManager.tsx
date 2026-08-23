 'use client';

 import { useMemo, useState } from 'react';
 import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
 import { AcademicCapIcon, TrashIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { subjectsService } from '@/services/subjects.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
 import { useAuthStore } from '@/stores/authStore';
 import { UserRole } from '@/types/user.types';
 import { Button } from '@/components/ui/Button';
 import { Select } from '@/components/ui/Select';
 import { Input } from '@/components/ui/Input';
 import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { useToast } from '@/hooks/useToast';

 interface ClassSubjectsManagerProps {
   classId: string;
   title?: string;
   description?: string;
   emptyTitle?: string;
   emptyDescription?: string;
   compact?: boolean;
 }

 export function ClassSubjectsManager({
   classId,
   title = 'Disciplinas da Turma',
   description = 'Vincule as disciplinas que esta turma irá cursar e, se desejar, já defina o professor responsável por cada uma.',
   emptyTitle = 'Nenhuma disciplina vinculada',
   emptyDescription = 'Adicione a primeira disciplina da turma para destravar horários e organização pedagógica.',
   compact = false,
 }: ClassSubjectsManagerProps) {
   const queryClient = useQueryClient();
   const toast = useToast();
   const { user } = useAuthStore();
   const currentRole = user?.activeProfile || user?.role;
   const canManageClassSubjects =
     currentRole === UserRole.DIRECTOR || currentRole === UserRole.COORDINATOR;

   const [subjectId, setSubjectId] = useState('');
   const [teacherId, setTeacherId] = useState('');
   const [weeklyHours, setWeeklyHours] = useState('');
   const [removingSubjectId, setRemovingSubjectId] = useState<string | null>(null);

   const { data: classSubjects = [], isLoading: loadingClassSubjects } = useQuery({
     queryKey: ['class-subjects', classId],
     queryFn: () => classesService.getClassSubjects(classId),
     enabled: Boolean(classId),
   });

   const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
     queryKey: ['subjects', 'class-subject-manager', user?.institutionId],
     queryFn: () =>
       subjectsService.findAll({
         institutionId: user?.institutionId,
         isActive: true,
         limit: 1000,
       }),
     enabled: Boolean(user?.institutionId),
   });

  const { data: subjectTeachers = [], isLoading: loadingSubjectTeachers } = useQuery({
    queryKey: ['teacher-subjects', 'subject', subjectId],
    queryFn: () => teacherSubjectsService.getBySubject(subjectId),
    enabled: Boolean(subjectId) && canManageClassSubjects,
  });

   const linkedSubjectIds = useMemo(
     () => new Set(classSubjects.map((item) => item.subjectId)),
     [classSubjects]
   );

   const availableSubjectOptions = useMemo(
     () => [
       { value: '', label: 'Selecione uma disciplina' },
       ...((subjectsData?.data ?? [])
         .filter((subject) => !linkedSubjectIds.has(subject.id))
         .map((subject) => ({
           value: subject.id,
           label: subject.code ? `${subject.name} (${subject.code})` : subject.name,
         })) ?? []),
     ],
     [linkedSubjectIds, subjectsData?.data]
   );

  const teacherOptions = useMemo(
    () => [
      {
        value: '',
        label: subjectId
          ? 'Sem professor definido'
          : 'Selecione a disciplina primeiro',
      },
      ...subjectTeachers
        .map((item) => item.teacher)
        .filter((teacher): teacher is NonNullable<typeof teacher> => Boolean(teacher?.id))
        .map((teacher) => ({
          value: teacher.id,
          label: teacher.user
            ? `${teacher.user.firstName} ${teacher.user.lastName}`
            : 'Professor',
        })),
    ],
    [subjectId, subjectTeachers]
  );

   const resetForm = () => {
     setSubjectId('');
     setTeacherId('');
     setWeeklyHours('');
   };

   const invalidateClassSubjectQueries = async () => {
     await Promise.all([
       queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] }),
       queryClient.invalidateQueries({ queryKey: ['schedules', classId] }),
       queryClient.invalidateQueries({ queryKey: ['class', classId] }),
       queryClient.invalidateQueries({ queryKey: ['teacher-classes'] }),
     ]);
   };

   const createMutation = useMutation({
     mutationFn: async () => {
       if (!canManageClassSubjects) {
         throw new Error('Somente a Direção e a Coordenação podem vincular disciplinas às turmas.');
       }

       if (!subjectId) {
         throw new Error('Selecione uma disciplina para continuar.');
       }

       return classesService.addSubject({
         classId,
         subjectId,
         teacherId: teacherId || undefined,
         weeklyHours: weeklyHours ? Number(weeklyHours) : undefined,
       });
     },
     onSuccess: async () => {
       await invalidateClassSubjectQueries();
       toast.success('Disciplina vinculada à turma com sucesso!');
       resetForm();
     },
     onError: (error: any) => {
       toast.error(error?.message || 'Erro ao vincular disciplina à turma.');
     },
   });

   const removeMutation = useMutation({
     mutationFn: (classSubjectId: string) => {
       if (!canManageClassSubjects) {
         throw new Error('Somente a Direção e a Coordenação podem remover vínculos de disciplinas.');
       }

       return classesService.removeSubject(classSubjectId);
     },
     onSuccess: async () => {
       await invalidateClassSubjectQueries();
       toast.success('Disciplina removida da turma com sucesso!');
       setRemovingSubjectId(null);
     },
     onError: (error: any) => {
       toast.error(error?.message || 'Erro ao remover disciplina da turma.');
     },
   });

   const isBusy = createMutation.isPending || removeMutation.isPending;

   return (
     <>
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
         <div className={`${compact ? 'mb-4' : 'mb-6'}`}>
           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
           <p className="text-sm text-gray-600 dark:text-gray-400">
             {currentRole === UserRole.DIRECTOR
               ? 'Consulte as disciplinas, os professores responsáveis e a carga horária desta turma.'
               : description}
           </p>
         </div>

         {canManageClassSubjects ? (
           <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_auto] gap-4 items-end">
             <Select
               label="Disciplina"
               value={subjectId}
               onChange={(event) => setSubjectId(event.target.value)}
               options={availableSubjectOptions}
               disabled={loadingSubjects || isBusy}
             />
             <Select
               label="Professor"
               value={teacherId}
               onChange={(event) => setTeacherId(event.target.value)}
               options={teacherOptions}
               disabled={!subjectId || loadingSubjectTeachers || isBusy}
             />
             <Input
               label="Horas/semana"
               type="number"
               min="1"
               max="40"
               value={weeklyHours}
               onChange={(event) => setWeeklyHours(event.target.value)}
               placeholder="Ex: 4"
               disabled={isBusy}
             />
             <Button
               onClick={() => createMutation.mutate()}
               isLoading={createMutation.isPending}
               disabled={isBusy || !subjectId}
               className="w-full lg:w-auto"
             >
               Vincular
             </Button>
           </div>
         ) : null}

         {(loadingClassSubjects || loadingSubjects || loadingSubjectTeachers) && (
           <div className="flex justify-center py-8">
             <LoadingSpinner size="md" text="Carregando vínculos da turma..." />
           </div>
         )}

         {!loadingClassSubjects && classSubjects.length === 0 && (
           <div className="mt-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
             <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
             <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
               {emptyTitle}
             </h3>
             <p className="text-sm text-gray-500 dark:text-gray-400">{emptyDescription}</p>
           </div>
         )}

         {!loadingClassSubjects && classSubjects.length > 0 && (
           <div className="mt-6 space-y-3">
              {classSubjects.map((item) => (
                <div
                 key={item.id}
                 className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:flex-row md:items-center md:justify-between"
                >
                  {item.teacher?.avatar ? (
                    <img
                      src={item.teacher.avatar}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : item.teacher ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {`${item.teacher.firstName ?? ''} ${item.teacher.lastName ?? ''}`
                        .trim()
                        .charAt(0)
                        .toUpperCase() || 'P'}
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                   <div className="flex items-center gap-2 flex-wrap">
                     <span className="font-medium text-gray-900 dark:text-white">
                       {item.subject?.name ?? 'Disciplina'}
                     </span>
                     {item.subject?.code && (
                       <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                         {item.subject.code}
                       </span>
                     )}
                   </div>
                   <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                     <span>
                       Professor:{' '}
                       {item.teacher
                         ? `${item.teacher.firstName} ${item.teacher.lastName}`
                         : 'Não definido'}
                     </span>
                     <span>
                       Carga semanal: {item.weeklyHours ? `${item.weeklyHours} hora(s)` : 'Não definida'}
                     </span>
                   </div>
                 </div>
                 {canManageClassSubjects ? (
                   <div className="flex justify-end">
                     <Button
                       variant="ghost"
                       onClick={() => setRemovingSubjectId(item.id)}
                       leftIcon={<TrashIcon className="h-4 w-4" />}
                       disabled={isBusy}
                     >
                       Remover
                     </Button>
                   </div>
                 ) : null}
               </div>
             ))}
           </div>
         )}

         {!loadingClassSubjects && classSubjects.length > 0 && (
           <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-700">
             <h3 className="text-base font-semibold text-gray-900 dark:text-white">
               Professores da turma
             </h3>
             <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
               Professores que possuem uma disciplina distribuída nesta turma.
             </p>
             <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
               {Array.from(
                 new Map(
                   classSubjects
                     .filter((item) => item.teacher?.id)
                     .map((item) => [item.teacher!.id, item.teacher!]),
                 ).values(),
               ).map((teacher) => {
                 const name = `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim();
                 return (
                   <div
                     key={teacher.id}
                     className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                   >
                     {teacher.avatar ? (
                       <img
                         src={teacher.avatar}
                         alt=""
                         className="h-9 w-9 rounded-full object-cover"
                       />
                     ) : (
                       <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                         {name.charAt(0).toUpperCase() || 'P'}
                       </span>
                     )}
                     <div className="min-w-0">
                       <p className="truncate font-medium text-gray-900 dark:text-white">
                         {name || 'Professor'}
                       </p>
                       <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                         {teacher.email || 'Contato não informado'}
                       </p>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         )}
       </div>

       <ConfirmDialog
         isOpen={Boolean(removingSubjectId)}
         onClose={() => setRemovingSubjectId(null)}
         onConfirm={() => removingSubjectId && removeMutation.mutate(removingSubjectId)}
         title="Remover disciplina da turma"
         message="Esse vínculo será removido da turma. Os horários relacionados a essa disciplina podem precisar de revisão depois."
         confirmText="Remover"
       />
     </>
   );
 }
