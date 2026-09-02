'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, CheckIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { academicPeriodsService } from '@/services/academic-periods.service';
import { evaluationsService } from '@/services/evaluations.service';
import type { AssessmentSlot, EvaluationStatus } from '@/types/evaluation.types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';

const slots: AssessmentSlot[] = ['VA1', 'VA2', 'VA3', 'VA4'];
const types = ['Prova', 'Atividade', 'Trabalho', 'Projeto', 'Seminário', 'Outro'];

export function EvaluationManagementPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [classId, setClassId] = useState('');
  const [classSubjectId, setClassSubjectId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [slot, setSlot] = useState<AssessmentSlot>('VA1');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Prova');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState('');

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['evaluation-classes', user?.institutionId],
    queryFn: () => classesService.findAll({ institutionId: user?.institutionId, limit: 100 }),
    enabled: Boolean(user),
  });

  const selectedClass = classesData?.data.find((item) => item.id === classId);
  const { data: classSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['evaluation-class-subjects', classId],
    queryFn: () => classesService.getClassSubjects(classId),
    enabled: Boolean(classId),
  });

  const { data: periodsData, isLoading: loadingPeriods } = useQuery({
    queryKey: ['evaluation-periods', selectedClass?.academicYearId],
    queryFn: () => academicPeriodsService.findAllFromApi({
      academicYearId: selectedClass?.academicYearId,
      isActive: true,
      limit: 20,
    }),
    enabled: Boolean(selectedClass?.academicYearId),
  });

  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ['evaluation-management', user?.institutionId],
    queryFn: () => evaluationsService.findAll(),
    enabled: Boolean(user),
  });

  const createMutation = useMutation({
    mutationFn: () => evaluationsService.create({
      title: title.trim(),
      type,
      slot,
      classSubjectId,
      academicPeriodId: periodId,
      description: description.trim() || undefined,
      examDate: examDate || undefined,
      maxValue: 10,
      countsTowardsAverage: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-management'] });
      queryClient.invalidateQueries({ queryKey: ['approved-evaluations'] });
      setTitle('');
      setDescription('');
      setExamDate('');
      toast.success('Avaliação cadastrada e liberada para lançamento.');
    },
    onError: (error: any) => toast.error(error?.message || 'Não foi possível cadastrar a avaliação.'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => evaluationsService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-management'] });
      queryClient.invalidateQueries({ queryKey: ['approved-evaluations'] });
      toast.success('Avaliação aprovada.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => evaluationsService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-management'] });
      toast.success('Avaliação devolvida para revisão.');
    },
  });

  const canSubmit = Boolean(title.trim() && classSubjectId && periodId);
  const isExam = type.trim().toLocaleLowerCase('pt-BR') === 'prova';
  const canSubmitEvaluation = Boolean(
    canSubmit && (!isExam || examDate),
  );

  const handleCreateEvaluation = () => {
    if (isExam && !examDate) {
      toast.error('Informe a data da prova para que ela seja divulgada aos alunos.');
      return;
    }

    createMutation.mutate();
  };
  const pending = useMemo(
    () => evaluations.filter((item) => item.status === 'PENDING_APPROVAL'),
    [evaluations],
  );

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push(user?.role === 'COORDINATOR' ? '/coordinator/dashboard' : '/admin/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Avaliações do bimestre</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Cadastre a avaliação que receberá a nota consolidada VA1, VA2, VA3 ou VA4.
        </p>
      </div>

      <section className="rounded-lg border border-[#e3e5e9] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova avaliação</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Direção e coordenação liberam diretamente. Uma avaliação proposta por professor fica pendente até ser aprovada.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Turma"
            value={classId}
            onChange={(event) => { setClassId(event.target.value); setClassSubjectId(''); setPeriodId(''); }}
            options={[{ value: '', label: loadingClasses ? 'Carregando turmas...' : 'Selecione...' }, ...(classesData?.data ?? []).map((item) => ({ value: item.id, label: item.name }))]}
          />
          <Select
            label="Disciplina da turma"
            value={classSubjectId}
            onChange={(event) => setClassSubjectId(event.target.value)}
            disabled={!classId || loadingSubjects}
            options={[{ value: '', label: !classId ? 'Selecione a turma primeiro' : loadingSubjects ? 'Carregando disciplinas...' : 'Selecione...' }, ...classSubjects.map((item) => ({ value: item.id, label: item.subject?.name ?? 'Disciplina' }))]}
          />
          <Select
            label="Período acadêmico"
            value={periodId}
            onChange={(event) => setPeriodId(event.target.value)}
            disabled={!classId || loadingPeriods}
            options={[{ value: '', label: loadingPeriods ? 'Carregando períodos...' : 'Selecione...' }, ...(periodsData?.data ?? []).map((item) => ({ value: item.id, label: item.name }))]}
          />
          <Select
            label="VA"
            value={slot}
            onChange={(event) => setSlot(event.target.value as AssessmentSlot)}
            options={slots.map((item) => ({ value: item, label: item }))}
          />
          <Input label="Título da avaliação" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Prova bimestral" />
          <Select label="Tipo" value={type} onChange={(event) => setType(event.target.value)} options={types.map((item) => ({ value: item, label: item }))} />
          <Input
            label={isExam ? 'Data da prova' : 'Data (opcional)'}
            type="date"
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
            required={isExam}
            helperText={isExam ? 'A data será exibida aos alunos após a liberação.' : undefined}
          />
          <Input label="Descrição (opcional)" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Conteúdos ou orientações" />
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={handleCreateEvaluation} disabled={!canSubmitEvaluation || createMutation.isPending} isLoading={createMutation.isPending}>
            Salvar avaliação
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e3e5e9] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-6 py-4 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Avaliações cadastradas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">As VAs aparecem aqui antes de o professor lançar as notas.</p>
          </div>
          {pending.length > 0 && <span className="inline-flex items-center gap-1 text-sm text-amber-700"><ClockIcon className="h-4 w-4" /> {pending.length} pendente(s)</span>}
        </div>
        {loadingEvaluations ? <div className="p-8"><LoadingSpinner text="Carregando avaliações..." /></div> : evaluations.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">Nenhuma avaliação cadastrada.</p> : (
          <div className="divide-y divide-[#e0e0e0] dark:divide-gray-700">
            {evaluations.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <span>{item.slot}</span><span>·</span><span>{item.title}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600 dark:bg-gray-700 dark:text-gray-300">{item.status === 'APPROVED' ? 'Liberada' : item.status === 'PENDING_APPROVAL' ? 'Aguardando aprovação' : item.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.classSubject?.class?.name} · {item.classSubject?.subject?.name} · {item.academicPeriod?.name} · {item.type}</p>
                </div>
                {item.status === 'PENDING_APPROVAL' && <div className="flex gap-2"><Button variant="secondary" onClick={() => rejectMutation.mutate(item.id)} disabled={rejectMutation.isPending} leftIcon={<XMarkIcon className="h-4 w-4" />}>Devolver</Button><Button onClick={() => approveMutation.mutate(item.id)} disabled={approveMutation.isPending} leftIcon={<CheckIcon className="h-4 w-4" />}>Aprovar</Button></div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
