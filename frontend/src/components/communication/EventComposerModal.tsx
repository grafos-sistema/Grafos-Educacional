'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { academicYearsService } from '@/services/academic-years.service';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { eventsService } from '@/services/events.service';
import { Event, CreateEventDto, EventAttachment } from '@/types/communication.types';
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

const SCHOOL_LOCATIONS = ['Sala de aula', 'Auditório', 'Pátio', 'Quadra esportiva', 'Biblioteca', 'Laboratório'];
const AUDIENCE_OPTIONS = [
  { value: 'STUDENTS', label: 'Alunos' },
  { value: 'PARENTS', label: 'Responsáveis' },
  { value: 'TEACHERS', label: 'Professores' },
  { value: 'COLLABORATORS', label: 'Colaboradores' },
] as const;

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
  customSchoolLocation: boolean;
  locationType: 'SCHOOL' | 'EXTERNAL' | 'ONLINE';
  isAllDay: boolean;
  isGeneral: boolean;
  audienceRoles: string[];
  courseIds: string[];
  classIds: string[];
  requiresRsvp: boolean;
  attachments: EventAttachment[];
};

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildInitialForm(): EventFormState {
  const date = toDateInput(new Date());
  return {
    title: '', description: '', type: 'OTHER', startDate: date, startTime: '08:00', endDate: date, endTime: '17:00',
    academicYearId: '', location: '', customSchoolLocation: false, locationType: 'SCHOOL', isAllDay: true, isGeneral: true,
    audienceRoles: AUDIENCE_OPTIONS.map((option) => option.value), courseIds: [], classIds: [], requiresRsvp: false, attachments: [],
  };
}

function toIsoDate(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

interface EventComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  initialDate?: Date | null;
  onCreated?: (event: Event) => void;
}

export function EventComposerModal({ isOpen, onClose, user, initialDate, onCreated }: EventComposerModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(buildInitialForm);
  const [customEventTypes, setCustomEventTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [newEventType, setNewEventType] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const pendingAttachmentPaths = useRef(new Set<string>());
  const institutionId = user?.institutionId;

  const { data: academicYearsData, isLoading: loadingAcademicYears } = useQuery({
    queryKey: ['event-academic-years', institutionId],
    queryFn: () => academicYearsService.findAll({ institutionId, isActive: true, limit: 100 }),
    enabled: isOpen && Boolean(institutionId),
  });
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['event-courses', institutionId],
    queryFn: () => coursesService.findAll({ institutionId, isActive: true, limit: 500 }),
    enabled: isOpen && Boolean(institutionId),
  });
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['event-classes', institutionId, form.academicYearId],
    queryFn: () => classesService.findAll({ institutionId, academicYearId: form.academicYearId, isActive: true, limit: 500 }),
    enabled: isOpen && Boolean(institutionId) && Boolean(form.academicYearId),
  });

  const academicYearOptions = useMemo(() => (academicYearsData?.data ?? []).map((year) => ({ value: year.id, label: year.name || String(year.year) })), [academicYearsData?.data]);
  const courses = useMemo(() => coursesData?.data ?? [], [coursesData?.data]);
  const classes = useMemo(() => classesData?.data ?? [], [classesData?.data]);
  const visibleClasses = useMemo(() => form.courseIds.length > 0 ? classes.filter((item) => form.courseIds.includes(item.courseId)) : classes, [classes, form.courseIds]);
  const selectedVisibleClassIds = useMemo(() => form.classIds.filter((classId) => visibleClasses.some((item) => item.id === classId)), [form.classIds, visibleClasses]);
  const eventTypeOptions = useMemo(() => [...EVENT_TYPE_OPTIONS, ...customEventTypes.filter((custom) => !EVENT_TYPE_OPTIONS.some((option) => option.value === custom.value))], [customEventTypes]);

  useEffect(() => {
    if (!isOpen) return;
    const years = academicYearsData?.data ?? [];
    if (years.length > 0 && !form.academicYearId) {
      const preferred = years.find((year) => year.isActive) ?? years[0];
      setForm((current) => ({ ...current, academicYearId: preferred.id }));
    }
  }, [academicYearsData?.data, form.academicYearId, isOpen]);

  useEffect(() => {
    if (!isOpen || !initialDate) return;
    const date = toDateInput(initialDate);
    setForm((current) => ({ ...current, startDate: date, endDate: date }));
  }, [initialDate, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateEventDto) => eventsService.create(data),
    onSuccess: async (event) => {
      pendingAttachmentPaths.current.clear();
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['events-upcoming'] }), queryClient.invalidateQueries({ queryKey: ['events-calendar'] })]);
      toast.success('Evento criado com sucesso.');
      onCreated?.(event);
      setForm(buildInitialForm());
      onClose();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Não foi possível criar o evento.'),
  });

  const updateField = <K extends keyof EventFormState>(field: K, value: EventFormState[K]) => setForm((current) => ({ ...current, [field]: value }));
  const toggleValue = (field: 'audienceRoles' | 'courseIds' | 'classIds', value: string) => setForm((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));

  const addCustomEventType = () => {
    const label = newEventType.trim();
    if (!label) return;
    const value = `CUSTOM_${label.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
    const custom = { value, label };
    setCustomEventTypes((current) => [...current.filter((item) => item.value !== value), custom]);
    updateField('type', value);
    setNewEventType('');
    setIsAddingType(false);
  };

  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!institutionId || files.length === 0) return;
    setIsUploadingAttachment(true);
    try {
      const uploaded: EventAttachment[] = [];
      for (const file of files) {
        const attachment = await eventsService.uploadAttachment(file, institutionId);
        pendingAttachmentPaths.current.add(attachment.path);
        uploaded.push(attachment);
      }
      setForm((current) => ({ ...current, attachments: [...current.attachments, ...uploaded] }));
      toast.success(`${uploaded.length} anexo(s) adicionado(s).`);
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível anexar o arquivo.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const removeAttachment = async (attachment: EventAttachment) => {
    try {
      await eventsService.removeAttachment(attachment.path);
      pendingAttachmentPaths.current.delete(attachment.path);
      setForm((current) => ({ ...current, attachments: current.attachments.filter((item) => item.path !== attachment.path) }));
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível remover o anexo.');
    }
  };

  const cleanupPendingAttachments = () => {
    const paths = Array.from(pendingAttachmentPaths.current);
    pendingAttachmentPaths.current.clear();
    void Promise.all(paths.map((path) => eventsService.removeAttachment(path).catch(() => undefined)));
  };

  const handleClose = () => {
    if (createMutation.isPending || isUploadingAttachment) return;
    cleanupPendingAttachments();
    setForm(buildInitialForm());
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.endDate || !form.academicYearId) { toast.error('Preencha o título, as datas e o ano letivo do evento.'); return; }
    if (!form.location.trim()) { toast.error('Informe o local, endereço ou link do evento.'); return; }
    if (!form.isGeneral && form.audienceRoles.length === 0) { toast.error('Escolha quem poderá visualizar este evento.'); return; }
    const needsStudentSegmentation = !form.isGeneral && form.audienceRoles.some((role) => ['STUDENTS', 'PARENTS'].includes(role));
    if (needsStudentSegmentation && form.courseIds.length === 0 && form.classIds.length === 0) { toast.error('Escolha pelo menos um curso ou uma turma para segmentar o evento.'); return; }

    const startDate = toIsoDate(form.startDate, form.isAllDay ? '00:00' : form.startTime);
    const endDate = toIsoDate(form.endDate, form.isAllDay ? '23:59' : form.endTime);
    if (new Date(endDate) < new Date(startDate)) { toast.error('A data de término deve ser igual ou posterior à data de início.'); return; }

    createMutation.mutate({
      title: form.title.trim(), description: form.description, type: eventTypeOptions.find((option) => option.value === form.type)?.label ?? form.type,
      startDate, endDate, academicYearId: form.academicYearId, location: form.location.trim(), locationType: form.locationType,
      isAllDay: form.isAllDay, isGeneral: form.isGeneral,
      audienceRoles: form.isGeneral ? AUDIENCE_OPTIONS.map((option) => option.value) : form.audienceRoles,
      courseIds: form.isGeneral ? [] : form.courseIds, classIds: form.isGeneral ? [] : selectedVisibleClassIds,
      requiresRsvp: form.requiresRsvp, attachments: form.attachments,
    });
  };

  const allVisibleClassesSelected = visibleClasses.length > 0 && visibleClasses.every((item) => selectedVisibleClassIds.includes(item.id));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Evento" description="Cadastre um evento da instituição, defina o público e anexe autorizações ou roteiros quando necessário." size="3xl" closeOnOverlayClick={!createMutation.isPending && !isUploadingAttachment} footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={handleClose} disabled={createMutation.isPending || isUploadingAttachment}>Cancelar</Button><Button type="submit" form="event-composer-form" isLoading={createMutation.isPending || isUploadingAttachment}>Criar Evento</Button></div>}>
      <form id="event-composer-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]"><Input label="Título" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Ex.: Reunião de pais" required autoFocus /><div><Select label="Tipo" value={form.type} onChange={(event) => updateField('type', event.target.value)} options={eventTypeOptions} required /><button type="button" onClick={() => setIsAddingType((current) => !current)} className="mt-1 text-xs font-medium text-primary-700 hover:underline dark:text-primary-300">+ Adicionar tipo de evento</button>{isAddingType ? <div className="mt-2 flex gap-2"><Input aria-label="Novo tipo de evento" value={newEventType} onChange={(event) => setNewEventType(event.target.value)} placeholder="Ex.: Feira de ciências" /><Button type="button" size="sm" onClick={addCustomEventType}>Adicionar</Button></div> : null}</div></div>
        <div className="grid gap-4 md:grid-cols-2"><Select label="Ano letivo" value={form.academicYearId} onChange={(event) => updateField('academicYearId', event.target.value)} options={academicYearOptions} placeholder={loadingAcademicYears ? 'Carregando anos letivos...' : 'Selecione o ano letivo'} disabled={loadingAcademicYears || academicYearOptions.length === 0} required /><Select label="Localização" value={form.locationType} onChange={(event) => updateField('locationType', event.target.value as EventFormState['locationType'])} options={[{ value: 'SCHOOL', label: 'Na escola' }, { value: 'EXTERNAL', label: 'Externo' }, { value: 'ONLINE', label: 'Online' }]} required /></div>
        {form.locationType === 'SCHOOL' ? <div className="space-y-3"><Select label="Sala ou espaço" value={form.customSchoolLocation ? 'OTHER' : form.location} onChange={(event) => { const value = event.target.value; updateField('customSchoolLocation', value === 'OTHER'); updateField('location', value === 'OTHER' ? '' : value); }} options={[...SCHOOL_LOCATIONS.map((value) => ({ value, label: value })), { value: 'OTHER', label: 'Outro espaço' }]} placeholder="Selecione o local" required />{form.customSchoolLocation ? <Input label="Informe o local" value={form.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Ex.: Sala 12" required /> : null}</div> : <Input label={form.locationType === 'ONLINE' ? 'Link da reunião' : 'Endereço ou link do Google Maps'} value={form.location} onChange={(event) => updateField('location', event.target.value)} placeholder={form.locationType === 'ONLINE' ? 'https://meet.google.com/...' : 'Rua, número ou https://maps.google.com/...'} required />}
        <div className="grid gap-4 md:grid-cols-2"><Input label="Data de início" type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} required /><Input label="Data de término" type="date" value={form.endDate} min={form.startDate} onChange={(event) => updateField('endDate', event.target.value)} required /></div>
        {!form.isAllDay ? <div className="grid gap-4 md:grid-cols-2"><Input label="Horário de início" type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} required /><Input label="Horário de término" type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} required /></div> : null}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"><input type="checkbox" checked={form.isAllDay} onChange={(event) => updateField('isAllDay', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600" /><span><strong className="font-semibold">Evento de dia inteiro</strong><span className="ml-1 text-slate-500">(sem horário específico)</span></span></label>
        <section className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Público e visibilidade</h3><p className="mt-1 text-xs text-slate-500">Defina quem verá o evento e, se necessário, limite-o a cursos ou turmas.</p></div><label className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60"><input type="checkbox" checked={form.isGeneral} onChange={(event) => updateField('isGeneral', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600" /><span><strong className="font-medium">Evento geral para toda a escola</strong><span className="block text-xs text-slate-500">Todos os perfis autorizados poderão visualizar.</span></span></label>{!form.isGeneral ? <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{AUDIENCE_OPTIONS.map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><input type="checkbox" checked={form.audienceRoles.includes(option.value)} onChange={() => toggleValue('audienceRoles', option.value)} className="h-4 w-4 rounded border-slate-300 text-primary-600" />{option.label}</label>)}</div><div className="grid gap-5 lg:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Cursos</p><div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">{loadingCourses ? <p className="text-sm text-slate-500">Carregando cursos...</p> : courses.length === 0 ? <p className="text-sm text-slate-500">Nenhum curso cadastrado.</p> : courses.map((course) => <label key={course.id} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.courseIds.includes(course.id)} onChange={() => toggleValue('courseIds', course.id)} className="h-4 w-4 rounded border-slate-300 text-primary-600" /><span>{course.name}</span></label>)}</div></div><div><div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm font-medium">Turmas</p><button type="button" disabled={visibleClasses.length === 0} onClick={() => setForm((current) => ({ ...current, classIds: allVisibleClassesSelected ? current.classIds.filter((id) => !visibleClasses.some((item) => item.id === id)) : Array.from(new Set([...current.classIds, ...visibleClasses.map((item) => item.id)])) }))} className="text-xs font-medium text-primary-700 hover:underline disabled:opacity-50">{allVisibleClassesSelected ? 'Desmarcar todas' : 'Selecionar todas'}</button></div><div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">{loadingClasses ? <p className="text-sm text-slate-500">Carregando turmas...</p> : visibleClasses.length === 0 ? <p className="text-sm text-slate-500">Nenhuma turma disponível.</p> : visibleClasses.map((item) => <label key={item.id} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.classIds.includes(item.id)} onChange={() => toggleValue('classIds', item.id)} className="h-4 w-4 rounded border-slate-300 text-primary-600" /><span>{item.course?.name ?? courses.find((course) => course.id === item.courseId)?.name ?? 'Curso'} · {item.name} · {item.shift ?? 'Turno não informado'}</span></label>)}</div></div></div></> : null}</section>
        <div><label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Logística e Detalhes</label><RichTextEditor value={form.description} onChange={(value) => updateField('description', value)} /></div>
        <div className="grid gap-4 lg:grid-cols-2"><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"><input type="checkbox" checked={form.requiresRsvp} onChange={(event) => updateField('requiresRsvp', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600" /><span><strong className="font-medium">Exige confirmação de presença (RSVP)</strong><span className="block text-xs text-slate-500">Ajuda a estimar participantes, transporte e alimentação.</span></span></label><div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Anexos (PDF, JPG ou PNG)</label><input type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={handleAttachmentChange} disabled={isUploadingAttachment} className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:font-medium file:text-primary-700" /><p className="mt-1 text-xs text-slate-500">Até 10 MB por arquivo. Ex.: autorização de passeio ou roteiro.</p>{form.attachments.length > 0 ? <ul className="mt-3 space-y-2">{form.attachments.map((attachment) => <li key={attachment.path} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800"><span className="truncate">{attachment.name}</span><button type="button" onClick={() => void removeAttachment(attachment)} className="font-medium text-red-600 hover:underline">Remover</button></li>)}</ul> : null}</div></div>
      </form>
    </Modal>
  );
}
