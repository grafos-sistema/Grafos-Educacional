 'use client';

 import { useMemo, useState } from 'react';
 import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
 import { AcademicCapIcon, TrashIcon } from '@heroicons/react/24/outline';
 import { classesService } from '@/services/classes.service';
 import { subjectsService } from '@/services/subjects.service';
 import { usersService } from '@/services/users.service';
 import { useAuthStore } from '@/stores/authStore';
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

   const { data: teachersData, isLoading: loadingTeachers } = useQuery({
     queryKey: ['teachers', 'class-subject-manager', user?.institutionId],
     queryFn: () =>
       usersService.findAll({
         institutionId: user?.institutionId,
         isActive: true,
         hasTeacherProfile: true,
         limit: 1000,
       }),
     enabled: Boolean(user?.institutionId),
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
       { value: '', label: 'Sem professor definido' },
       ...((teachersData?.data ?? [])
         .filter((teacher) => Boolean(teacher.teacherProfile?.id))
         .map((teacher) => ({
           value: teacher.teacherProfile!.id,
           label: `${teacher.firstName} ${teacher.lastName}`,
         })) ?? []),
     ],
     [teachersData?.data]
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
     mutationFn: (classSubjectId: string) => classesService.removeSubject(classSubjectId),
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
           <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_auto] gap-4 items-end">
           <Select
             label="Disciplina"
             value={subjectId}
             onChange={(event) => setSubjectId(event.target.value)}
             options={availableSubjectOptions}
             disabled={loadingSubjects || isBusy}
             helperText={
               availableSubjectOptions.length <= 1
                 ? 'Todas as disciplinas ativas já foram vinculadas a esta turma.'
                 : undefined
             }
           />
           <Select
             label="Professor"
             value={teacherId}
             onChange={(event) => setTeacherId(event.target.value)}
             options={teacherOptions}
             disabled={loadingTeachers || isBusy}
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

         {(loadingClassSubjects || loadingSubjects || loadingTeachers) && (
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
               </div>
             ))}
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
