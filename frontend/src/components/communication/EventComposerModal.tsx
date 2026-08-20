"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { academicYearsService } from "@/services/academic-years.service";
import { classesService } from "@/services/classes.service";
import { coursesService } from "@/services/courses.service";
import { eventsService } from "@/services/events.service";
import {
  Event,
  CreateEventDto,
  EventAttachment,
} from "@/types/communication.types";
import { User } from "@/types/user.types";

const ADD_CUSTOM_EVENT_TYPE = "__ADD_CUSTOM_EVENT_TYPE__";
const EVENT_TYPE_OPTIONS = [
  { value: ADD_CUSTOM_EVENT_TYPE, label: "+ Adicionar tipo de evento" },
  { value: "OTHER", label: "Evento escolar" },
  { value: "MEETING", label: "Reunião" },
  { value: "EXAM", label: "Prova" },
  { value: "HOLIDAY", label: "Feriado" },
  { value: "SCHOOL_BREAK", label: "Recesso escolar" },
  { value: "PARENT_TEACHER_CONFERENCE", label: "Reunião de pais" },
  { value: "SPORTS_EVENT", label: "Evento esportivo" },
  { value: "CULTURAL_EVENT", label: "Evento cultural" },
  { value: "FIELD_TRIP", label: "Passeio escolar" },
  { value: "ENROLLMENT_PERIOD", label: "Período de matrícula" },
  { value: "REPORT_CARD", label: "Entrega de boletins" },
];

const SCHOOL_LOCATIONS = [
  "Sala de aula",
  "Auditório",
  "Pátio",
  "Quadra esportiva",
  "Biblioteca",
  "Laboratório",
];
const AUDIENCE_OPTIONS = [
  { value: "STUDENTS", label: "Alunos" },
  { value: "PARENTS", label: "Responsáveis" },
  { value: "TEACHERS", label: "Professores" },
  { value: "COLLABORATORS", label: "Colaboradores" },
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
  locationType: "SCHOOL" | "EXTERNAL" | "ONLINE";
  isAllDay: boolean;
  isGeneral: boolean;
  audienceRoles: string[];
  courseIds: string[];
  classIds: string[];
  attachments: EventAttachment[];
};

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildInitialForm(): EventFormState {
  const date = toDateInput(new Date());
  return {
    title: "",
    description: "",
    type: "OTHER",
    startDate: date,
    startTime: "08:00",
    endDate: date,
    endTime: "17:00",
    academicYearId: "",
    location: "",
    customSchoolLocation: false,
    locationType: "SCHOOL",
    isAllDay: true,
    isGeneral: true,
    audienceRoles: AUDIENCE_OPTIONS.map((option) => option.value),
    courseIds: [],
    classIds: [],
    attachments: [],
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

export function EventComposerModal({
  isOpen,
  onClose,
  user,
  initialDate,
  onCreated,
}: EventComposerModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(buildInitialForm);
  const [customEventTypes, setCustomEventTypes] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [newEventType, setNewEventType] = useState("");
  const [isAddingType, setIsAddingType] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const pendingAttachmentPaths = useRef(new Set<string>());
  const institutionId = user?.institutionId;

  const { data: academicYearsData } = useQuery({
    queryKey: ["event-academic-years", institutionId],
    queryFn: () =>
      academicYearsService.findAll({
        institutionId,
        isActive: true,
        limit: 100,
      }),
    enabled: isOpen && Boolean(institutionId),
  });
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["event-courses", institutionId],
    queryFn: () =>
      coursesService.findAll({ institutionId, isActive: true, limit: 500 }),
    enabled: isOpen && Boolean(institutionId),
  });
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["event-classes", institutionId, form.academicYearId],
    queryFn: () =>
      classesService.findAll({
        institutionId,
        academicYearId: form.academicYearId,
        isActive: true,
        limit: 500,
      }),
    enabled: isOpen && Boolean(institutionId) && Boolean(form.academicYearId),
  });

  const courses = useMemo(() => coursesData?.data ?? [], [coursesData?.data]);
  const classes = useMemo(() => classesData?.data ?? [], [classesData?.data]);
  const visibleClasses = useMemo(
    () =>
      form.courseIds.length > 0
        ? classes.filter((item) => form.courseIds.includes(item.courseId))
        : classes,
    [classes, form.courseIds],
  );
  const selectedVisibleClassIds = useMemo(
    () =>
      form.classIds.filter((classId) =>
        visibleClasses.some((item) => item.id === classId),
      ),
    [form.classIds, visibleClasses],
  );
  const eventTypeOptions = useMemo(
    () => [
      ...EVENT_TYPE_OPTIONS,
      ...customEventTypes.filter(
        (custom) =>
          !EVENT_TYPE_OPTIONS.some((option) => option.value === custom.value),
      ),
    ],
    [customEventTypes],
  );
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!isOpen) return;
    const years = academicYearsData?.data ?? [];
    const preferred = years.find((year) => Number(year.year) === currentYear);
    if (preferred && form.academicYearId !== preferred.id) {
      setForm((current) => ({ ...current, academicYearId: preferred.id }));
    }
  }, [academicYearsData?.data, currentYear, form.academicYearId, isOpen]);

  useEffect(() => {
    if (!isOpen || !initialDate) return;
    const date = toDateInput(initialDate);
    setForm((current) => ({ ...current, startDate: date, endDate: date }));
  }, [initialDate, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateEventDto) => eventsService.create(data),
    onSuccess: async (event) => {
      pendingAttachmentPaths.current.clear();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["events-upcoming"] }),
        queryClient.invalidateQueries({ queryKey: ["events-calendar"] }),
      ]);
      toast.success("Evento criado com sucesso.");
      onCreated?.(event);
      setForm(buildInitialForm());
      setNewEventType("");
      setIsAddingType(false);
      onClose();
    },
    onError: (error: any) =>
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Não foi possível criar o evento.",
      ),
  });

  const updateField = <K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K],
  ) => setForm((current) => ({ ...current, [field]: value }));
  const toggleValue = (
    field: "audienceRoles" | "courseIds" | "classIds",
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));

  const addCustomEventType = () => {
    const label = newEventType.trim();
    if (!label) {
      toast.error("Informe o nome do tipo de evento.");
      return;
    }
    const value = `CUSTOM_${label.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
    const custom = { value, label };
    setCustomEventTypes((current) => [
      ...current.filter((item) => item.value !== value),
      custom,
    ]);
    updateField("type", value);
    setNewEventType("");
    setIsAddingType(false);
  };

  const handleAttachmentChange = async (file: File) => {
    if (!institutionId) return;
    if (form.attachments.length > 0) {
      toast.error("Remova o PDF atual antes de anexar outro.");
      return;
    }
    setIsUploadingAttachment(true);
    try {
      const attachment = await eventsService.uploadAttachment(
        file,
        institutionId,
      );
      pendingAttachmentPaths.current.add(attachment.path);
      setForm((current) => ({ ...current, attachments: [attachment] }));
      toast.success("PDF anexado ao evento.");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível anexar o arquivo.");
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const removeAttachment = async (attachment: EventAttachment) => {
    try {
      await eventsService.removeAttachment(attachment.path);
      pendingAttachmentPaths.current.delete(attachment.path);
      setForm((current) => ({
        ...current,
        attachments: current.attachments.filter(
          (item) => item.path !== attachment.path,
        ),
      }));
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível remover o anexo.");
    }
  };

  const cleanupPendingAttachments = () => {
    const paths = Array.from(pendingAttachmentPaths.current);
    pendingAttachmentPaths.current.clear();
    void Promise.all(
      paths.map((path) =>
        eventsService.removeAttachment(path).catch(() => undefined),
      ),
    );
  };

  const handleClose = () => {
    if (createMutation.isPending || isUploadingAttachment) return;
    cleanupPendingAttachments();
    setForm(buildInitialForm());
    setNewEventType("");
    setIsAddingType(false);
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      toast.error("Preencha o título e as datas do evento.");
      return;
    }
    if (!form.academicYearId) {
      toast.error(`Não há um ano letivo ativo para ${currentYear}.`);
      return;
    }
    if (!form.location.trim()) {
      toast.error("Informe o local, endereço ou link do evento.");
      return;
    }
    if (!form.isGeneral && form.audienceRoles.length === 0) {
      toast.error("Escolha quem poderá visualizar este evento.");
      return;
    }
    const needsStudentSegmentation =
      !form.isGeneral &&
      form.audienceRoles.some((role) => ["STUDENTS", "PARENTS"].includes(role));
    if (
      needsStudentSegmentation &&
      form.courseIds.length === 0 &&
      form.classIds.length === 0
    ) {
      toast.error(
        "Escolha pelo menos um curso ou uma turma para segmentar o evento.",
      );
      return;
    }

    const startDate = toIsoDate(
      form.startDate,
      form.isAllDay ? "00:00" : form.startTime,
    );
    const endDate = toIsoDate(
      form.endDate,
      form.isAllDay ? "23:59" : form.endTime,
    );
    if (new Date(endDate) < new Date(startDate)) {
      toast.error(
        "A data de término deve ser igual ou posterior à data de início.",
      );
      return;
    }

    createMutation.mutate({
      title: form.title.trim(),
      description: form.description,
      type:
        eventTypeOptions.find((option) => option.value === form.type)?.label ??
        form.type,
      startDate,
      endDate,
      academicYearId: form.academicYearId,
      location: form.location.trim(),
      locationType: form.locationType,
      isAllDay: form.isAllDay,
      isGeneral: form.isGeneral,
      audienceRoles: form.isGeneral
        ? AUDIENCE_OPTIONS.map((option) => option.value)
        : form.audienceRoles,
      courseIds: form.isGeneral ? [] : form.courseIds,
      classIds: form.isGeneral ? [] : selectedVisibleClassIds,
      attachments: form.attachments,
    });
  };

  const allVisibleClassesSelected =
    visibleClasses.length > 0 &&
    visibleClasses.every((item) => selectedVisibleClassIds.includes(item.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Evento"
      description="Cadastre um evento da instituição e defina o público que poderá visualizá-lo."
      size="3xl"
      closeOnOverlayClick={!createMutation.isPending && !isUploadingAttachment}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={createMutation.isPending || isUploadingAttachment}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="event-composer-form"
            isLoading={createMutation.isPending || isUploadingAttachment}
          >
            Criar Evento
          </Button>
        </div>
      }
    >
      <form
        id="event-composer-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
          <Input
            label="Título"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Ex.: Reunião de pais"
            required
            autoFocus
          />
          <div>
            {isAddingType ? (
              <div className="flex items-end gap-2">
                <Input
                  label="Novo tipo de evento"
                  value={newEventType}
                  onChange={(event) => setNewEventType(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomEventType();
                    }
                  }}
                  placeholder="Ex.: Feira de ciências"
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={addCustomEventType}>
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingType(false);
                      setNewEventType("");
                    }}
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                label="Tipo"
                value={form.type}
                onChange={(event) => {
                  if (event.target.value === ADD_CUSTOM_EVENT_TYPE) {
                    setIsAddingType(true);
                    setNewEventType("");
                    return;
                  }
                  updateField("type", event.target.value);
                }}
                options={eventTypeOptions}
                required
              />
            )}
          </div>
        </div>
        <div>
          <Select
            label="Localização"
            value={form.locationType}
            onChange={(event) =>
              updateField(
                "locationType",
                event.target.value as EventFormState["locationType"],
              )
            }
            options={[
              { value: "SCHOOL", label: "Na escola" },
              { value: "EXTERNAL", label: "Externo" },
              { value: "ONLINE", label: "Online" },
            ]}
            required
          />
        </div>
        {form.locationType === "SCHOOL" ? (
          <div className="space-y-3">
            <Select
              label="Sala ou espaço"
              value={form.customSchoolLocation ? "OTHER" : form.location}
              onChange={(event) => {
                const value = event.target.value;
                updateField("customSchoolLocation", value === "OTHER");
                updateField("location", value === "OTHER" ? "" : value);
              }}
              options={[
                ...SCHOOL_LOCATIONS.map((value) => ({ value, label: value })),
                { value: "OTHER", label: "Outro espaço" },
              ]}
              placeholder="Selecione o local"
              required
            />
            {form.customSchoolLocation ? (
              <Input
                label="Informe o local"
                value={form.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="Ex.: Sala 12"
                required
              />
            ) : null}
          </div>
        ) : (
          <Input
            label={
              form.locationType === "ONLINE"
                ? "Link da reunião"
                : "Endereço ou link do Google Maps"
            }
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder={
              form.locationType === "ONLINE"
                ? "https://meet.google.com/..."
                : "Rua, número ou https://maps.google.com/..."
            }
            required
          />
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Data de início"
            type="date"
            value={form.startDate}
            onChange={(event) => updateField("startDate", event.target.value)}
            required
          />
          <Input
            label="Data de término"
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(event) => updateField("endDate", event.target.value)}
            required
          />
        </div>
        {!form.isAllDay ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Horário de início"
              type="time"
              value={form.startTime}
              onChange={(event) => updateField("startTime", event.target.value)}
              required
            />
            <Input
              label="Horário de término"
              type="time"
              value={form.endTime}
              onChange={(event) => updateField("endTime", event.target.value)}
              required
            />
          </div>
        ) : null}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/60">
          <input
            type="checkbox"
            checked={form.isAllDay}
            onChange={(event) => updateField("isAllDay", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600"
          />
          <span>
            <strong className="font-semibold">Evento de dia inteiro</strong>
            <span className="ml-1 text-slate-500">
              (sem horário específico)
            </span>
          </span>
        </label>
        <section className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Público e visibilidade
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Defina quem verá o evento e, se necessário, limite-o a cursos ou
              turmas.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            <input
              type="checkbox"
              checked={form.isGeneral}
              onChange={(event) =>
                updateField("isGeneral", event.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600"
            />
            <span>
              <strong className="font-medium">
                Evento geral para toda a escola
              </strong>
              <span className="block text-xs text-slate-500">
                Todos os perfis autorizados poderão visualizar.
              </span>
            </span>
          </label>
          {!form.isGeneral ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {AUDIENCE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.audienceRoles.includes(option.value)}
                      onChange={() =>
                        toggleValue("audienceRoles", option.value)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-primary-600"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Cursos</p>
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    {loadingCourses ? (
                      <p className="text-sm text-slate-500">
                        Carregando cursos...
                      </p>
                    ) : courses.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Nenhum curso cadastrado.
                      </p>
                    ) : (
                      courses.map((course) => (
                        <label
                          key={course.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.courseIds.includes(course.id)}
                            onChange={() => toggleValue("courseIds", course.id)}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600"
                          />
                          <span>{course.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Turmas</p>
                    <button
                      type="button"
                      disabled={visibleClasses.length === 0}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          classIds: allVisibleClassesSelected
                            ? current.classIds.filter(
                                (id) =>
                                  !visibleClasses.some(
                                    (item) => item.id === id,
                                  ),
                              )
                            : Array.from(
                                new Set([
                                  ...current.classIds,
                                  ...visibleClasses.map((item) => item.id),
                                ]),
                              ),
                        }))
                      }
                      className="text-xs font-medium text-primary-700 hover:underline disabled:opacity-50"
                    >
                      {allVisibleClassesSelected
                        ? "Desmarcar todas"
                        : "Selecionar todas"}
                    </button>
                  </div>
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    {loadingClasses ? (
                      <p className="text-sm text-slate-500">
                        Carregando turmas...
                      </p>
                    ) : visibleClasses.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Nenhuma turma disponível.
                      </p>
                    ) : (
                      visibleClasses.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.classIds.includes(item.id)}
                            onChange={() => toggleValue("classIds", item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600"
                          />
                          <span>
                            {item.course?.name ??
                              courses.find(
                                (course) => course.id === item.courseId,
                              )?.name ??
                              "Curso"}{" "}
                            · {item.name} ·{" "}
                            {item.shift ?? "Turno não informado"}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Logística e Detalhes
          </label>
          <RichTextEditor
            value={form.description}
            onChange={(value) => updateField("description", value)}
            onAttach={(file) => void handleAttachmentChange(file)}
            isUploadingAttachment={isUploadingAttachment}
          />
          {form.attachments.length > 0 ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  PDF anexado
                </p>
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                  {form.attachments[0].name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void removeAttachment(form.attachments[0])}
                aria-label="Remover PDF anexado"
                title="Remover PDF anexado"
                className="rounded-md p-2 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
