'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { academicYearsService } from '@/services/academic-years.service';
import { eventsService } from '@/services/events.service';
import { Event, CreateEventDto } from '@/types/communication.types';
import { User } from '@/types/user.types';

const EVENT_TYPE_OPTIONS = [
  { value: 'OTHER', label: 'Evento escolar' },
  { value: 'MEETING', label: 'Reunião' },
  { value: 'EXAM', label: 'Prova' },
  { value: 'HOLIDAY', label: 'Feriado' },
  { value: 'SCHOOL_BREAK', label: 'Recesso escolar' },
  { value: 'PARENT_TEACHER_CONFERENCE', label: 'Reunião de pais' },
  { value: 'SPORTS_EVENT', label: 'Evento esportivo' },
  { value: 'CULTURAL_EVENT', label: 'Evento cultural' },
  { value: 'FIELD_TRIP', label: 'Passeio escolar' },
  { value: 'ENROLLMENT_PERIOD', label: 'Período de matrícula' },
  { value: 'REPORT_CARD', label: 'Entrega de boletins' },
];

type EventFormState = {
  title: string;
  description: string;
  type: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  academicYearId: string;
  location: string;
  isAllDay: boolean;
};

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildInitialForm(): EventFormState {
  const today = new Date();
  const date = toDateInput(today);

  return {
    title: '',
    description: '',
    type: 'OTHER',
    startDate: date,
    startTime: '08:00',
    endDate: date,
    endTime: '17:00',
    academicYearId: '',
    location: '',
    isAllDay: true,
  };
}

function toIsoDate(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

interface EventComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onCreated?: (event: Event) => void;
}

export function EventComposerModal({ isOpen, onClose, user, onCreated }: EventComposerModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(buildInitialForm);
  const institutionId = user?.institutionId;

  const { data: academicYearsData, isLoading: loadingAcademicYears } = useQuery({
    queryKey: ['event-academic-years', institutionId],
    queryFn: () => academicYearsService.findAll({ institutionId, isActive: true, limit: 100 }),
    enabled: isOpen && Boolean(institutionId),
  });

  const academicYearOptions = useMemo(
    () => (academicYearsData?.data ?? []).map((year) => ({ value: year.id, label: year.name || String(year.year) })),
    [academicYearsData?.data]
  );

  useEffect(() => {
    if (!isOpen) return;

    const years = academicYearsData?.data ?? [];
    if (years.length > 0 && !form.academicYearId) {
      const preferred = years.find((year) => year.isActive) ?? years[0];
      setForm((current) => ({ ...current, academicYearId: preferred.id }));
    }
  }, [academicYearsData?.data, form.academicYearId, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateEventDto) => eventsService.create(data),
    onSuccess: async (event) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events-upcoming'] }),
        queryClient.invalidateQueries({ queryKey: ['events-calendar'] }),
      ]);
      toast.success('Evento cadastrado com sucesso.');
      onCreated?.(event);
      setForm(buildInitialForm());
      onClose();
    },
  });

  const updateField = <K extends keyof EventFormState>(field: K, value: EventFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    setForm(buildInitialForm());
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.startDate || !form.endDate || !form.academicYearId) {
      toast.error('Preencha o título, o período e o ano letivo do evento.');
      return;
    }

    const startTime = form.isAllDay ? '00:00' : form.startTime;
    const endTime = form.isAllDay ? '23:59' : form.endTime;
    const startDate = toIsoDate(form.startDate, startTime);
    const endDate = toIsoDate(form.endDate, endTime);

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('A data de término deve ser igual ou posterior à data de início.');
      return;
    }

    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      startDate,
      endDate,
      academicYearId: form.academicYearId,
      location: form.location.trim() || undefined,
      isAllDay: form.isAllDay,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cadastrar evento"
      description="O evento ficará disponível em Próximos Eventos para os usuários da instituição."
      size="lg"
      closeOnOverlayClick={!createMutation.isPending}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="event-composer-form" isLoading={createMutation.isPending}>
            Cadastrar evento
          </Button>
        </div>
      }
    >
      <form id="event-composer-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
          <Input
            label="Título"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Ex.: Reunião de pais"
            required
            autoFocus
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
            options={EVENT_TYPE_OPTIONS}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Ano letivo"
            value={form.academicYearId}
            onChange={(event) => updateField('academicYearId', event.target.value)}
            options={academicYearOptions}
            placeholder={loadingAcademicYears ? 'Carregando anos letivos...' : 'Selecione o ano letivo'}
            disabled={loadingAcademicYears || academicYearOptions.length === 0}
            required
          />
          <Input
            label="Local (opcional)"
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            placeholder="Ex.: Auditório"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Data de início"
            type="date"
            value={form.startDate}
            onChange={(event) => updateField('startDate', event.target.value)}
            required
          />
          <Input
            label="Data de término"
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(event) => updateField('endDate', event.target.value)}
            required
          />
        </div>

        {!form.isAllDay ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Horário de início" type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} required />
            <Input label="Horário de término" type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} required />
          </div>
        ) : null}

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
          <input
            type="checkbox"
            checked={form.isAllDay}
            onChange={(event) => updateField('isAllDay', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            <strong className="font-semibold">Evento de dia inteiro</strong>
            <span className="ml-1 text-slate-500 dark:text-slate-400">(sem horário específico)</span>
          </span>
        </label>

        <div>
          <label htmlFor="event-description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descrição (opcional)
          </label>
          <textarea
            id="event-description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Inclua orientações ou detalhes importantes."
            rows={4}
            className="block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-900/30"
          />
        </div>
      </form>
    </Modal>
  );
}
