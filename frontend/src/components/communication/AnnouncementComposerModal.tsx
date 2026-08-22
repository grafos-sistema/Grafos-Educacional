'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  BuildingOffice2Icon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { announcementsService } from '@/services/announcements.service';
import { authService, type UserInstitutionOption } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { getValidInstitutionIds, isUuid } from '@/lib/institution-filter';
import {
  AnnouncementPriority,
  type Announcement,
  type CreateAnnouncementDto,
} from '@/types/communication.types';
import { UserRole } from '@/types/user.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

type AnnouncementFormState = {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  institutionId: string;
  scheduledFor: string;
  expiresAt: string;
  targetRoles: UserRole[];
};

type AnnouncementComposerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: 'immediate' | 'scheduled';
};

const roleOptionMap: Record<
  UserRole,
  { label: string; description: string; variant: 'default' | 'info' | 'warning' | 'success' | 'error' }
> = {
  [UserRole.SUPER_ADMIN_GLOBAL]: {
    label: 'Super Admin Global',
    description: 'Equipe global da plataforma',
    variant: 'default',
  },
  [UserRole.SUPER_ADMIN]: {
    label: 'Super Admin',
    description: 'Equipe global da plataforma',
    variant: 'default',
  },
  [UserRole.DIRECTOR]: {
    label: 'Direção',
    description: 'Diretores da instituição',
    variant: 'info',
  },
  [UserRole.INSTITUTION_ADMIN]: {
    label: 'Administradores',
    description: 'Gestão administrativa da instituição',
    variant: 'info',
  },
  [UserRole.COORDINATOR]: {
    label: 'Coordenação',
    description: 'Equipe pedagógica e coordenação',
    variant: 'warning',
  },
  [UserRole.TEACHER]: {
    label: 'Professores',
    description: 'Docentes da instituição',
    variant: 'success',
  },
  [UserRole.STUDENT]: {
    label: 'Alunos',
    description: 'Estudantes vinculados',
    variant: 'info',
  },
  [UserRole.PARENT]: {
    label: 'Responsáveis',
    description: 'Pais e responsáveis',
    variant: 'default',
  },
};

function getDefaultScheduledDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setSeconds(0, 0);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getInitialForm(institutionId = '', targetRoles: UserRole[] = []): AnnouncementFormState {
  return {
    title: '',
    content: '',
    priority: AnnouncementPriority.NORMAL,
    institutionId,
    scheduledFor: '',
    expiresAt: '',
    targetRoles,
  };
}

export function AnnouncementComposerModal({
  isOpen,
  onClose,
  mode,
}: AnnouncementComposerModalProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const institutionFilterAll = useAuthStore((state) => state.institutionFilterAll);
  const institutionFilterIds = useAuthStore((state) => state.institutionFilterIds);
  const currentRole = (user?.activeProfile || user?.role) as UserRole | undefined;
  const isGlobalAdmin =
    currentRole === UserRole.SUPER_ADMIN_GLOBAL || currentRole === UserRole.SUPER_ADMIN;

  const { data: institutions = [] } = useQuery({
    queryKey: ['auth', 'institutions'],
    queryFn: () => authService.getInstitutions(),
    enabled: isOpen,
  });

  const allowedRoleOptions = useMemo(() => {
    if (currentRole === UserRole.COORDINATOR) {
      return [UserRole.DIRECTOR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
    }

    if (currentRole === UserRole.TEACHER) {
      return [
        UserRole.DIRECTOR,
        UserRole.INSTITUTION_ADMIN,
        UserRole.COORDINATOR,
        UserRole.TEACHER,
        UserRole.STUDENT,
        UserRole.PARENT,
      ];
    }

    if (isGlobalAdmin) {
      return [
        UserRole.INSTITUTION_ADMIN,
        UserRole.DIRECTOR,
        UserRole.COORDINATOR,
        UserRole.TEACHER,
        UserRole.STUDENT,
        UserRole.PARENT,
        UserRole.SUPER_ADMIN,
      ];
    }

    return [
      UserRole.DIRECTOR,
      UserRole.INSTITUTION_ADMIN,
      UserRole.COORDINATOR,
      UserRole.TEACHER,
      UserRole.STUDENT,
      UserRole.PARENT,
    ];
  }, [currentRole, isGlobalAdmin]);

  const defaultTargetRoles = useMemo(() => {
    if (currentRole === UserRole.TEACHER) {
      return [UserRole.STUDENT, UserRole.PARENT];
    }

    return [
      UserRole.DIRECTOR,
      UserRole.INSTITUTION_ADMIN,
      UserRole.COORDINATOR,
      UserRole.TEACHER,
    ];
  }, [currentRole]);

  const defaultInstitutionId = useMemo(() => {
    const filteredIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

    if (filteredIds.length > 0) {
      const filteredInstitution = institutions.find((institution) =>
        filteredIds.includes(institution.id)
      );

      if (filteredInstitution) {
        return filteredInstitution.id;
      }
    }

    if (isUuid(user?.institutionId)) {
      return user.institutionId;
    }

    return institutions.find((institution) => isUuid(institution.id))?.id ?? '';
  }, [institutionFilterAll, institutionFilterIds, institutions, user]);

  const [form, setForm] = useState<AnnouncementFormState>(() =>
    getInitialForm(defaultInstitutionId, defaultTargetRoles),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AnnouncementFormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ...getInitialForm(defaultInstitutionId, defaultTargetRoles),
      scheduledFor: mode === 'scheduled' ? getDefaultScheduledDateTime() : '',
    });
    setErrors({});
  }, [defaultInstitutionId, defaultTargetRoles, isOpen, mode]);

  const selectedInstitution = institutions.find(
    (institution: UserInstitutionOption) => institution.id === form.institutionId
  );

  const institutionOptions = institutions.map((institution) => ({
    value: institution.id,
    label: institution.name,
  }));

  const handleRoleToggle = (role: UserRole) => {
    setErrors((current) => ({ ...current, targetRoles: undefined }));
    setForm((current) => ({
      ...current,
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((item) => item !== role)
        : [...current.targetRoles, role],
    }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof AnnouncementFormState, string>> = {};

    if (!form.title.trim()) nextErrors.title = 'Informe um título para o comunicado.';
    if (!form.content.trim()) nextErrors.content = 'Escreva a mensagem do comunicado.';
    if (!isUuid(form.institutionId)) {
      nextErrors.institutionId = 'Selecione uma instituição válida.';
    }
    if (form.targetRoles.length === 0) {
      nextErrors.targetRoles = 'Selecione pelo menos um público.';
    }

    if (form.scheduledFor) {
      const scheduledDate = new Date(form.scheduledFor);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        nextErrors.scheduledFor = 'Defina uma data futura para agendar o envio.';
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.values(nextErrors).find(Boolean);
      if (firstError) {
        toast.error(firstError);
      }
    }

    return Object.keys(nextErrors).length === 0;
  };

  const extractErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return 'Não foi possível salvar o comunicado.';
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const payload: CreateAnnouncementDto = {
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        institutionId: form.institutionId,
        targetRoles: form.targetRoles,
        ...(form.scheduledFor ? { scheduledFor: new Date(form.scheduledFor).toISOString() } : {}),
      };

      const createdAnnouncement = await announcementsService.create(payload);

      if (form.scheduledFor) {
        toast.success('Comunicado agendado com sucesso. Ele aparecerá na listagem no horário programado.');
      } else {
        queryClient.setQueryData<Announcement[] | undefined>(
          ['announcements-active'],
          (current) => {
            if (!current) {
              return [createdAnnouncement];
            }

            const alreadyExists = current.some((item) => item.id === createdAnnouncement.id);
            return alreadyExists ? current : [createdAnnouncement, ...current];
          }
        );

        toast.success('Comunicado enviado com sucesso.');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['announcements'] }),
        queryClient.invalidateQueries({ queryKey: ['announcements-active'] }),
      ]);

      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title="Novo comunicado"
      size="2xl"
      className="w-[90vw] max-w-[90vw]"
      contentClassName="space-y-5"
      footer={
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
            className="min-w-[240px] rounded-lg bg-primary-600 px-5 py-2.5 text-white hover:bg-primary-700"
          >
            {mode === 'scheduled' ? 'Programar comunicado' : 'Enviar comunicado'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div>
            <Badge variant={mode === 'scheduled' ? 'warning' : 'info'} size="sm">
              {mode === 'scheduled' ? 'Comunicado programado' : 'Envio imediato'}
            </Badge>
          </div>

          <Input
            label="Título"
            value={form.title}
            onChange={(event) => {
              setForm((current) => ({ ...current, title: event.target.value }));
              setErrors((current) => ({ ...current, title: undefined }));
            }}
            error={errors.title}
            placeholder="Ex.: Reunião pedagógica da semana"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {isGlobalAdmin ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Instituição
                </label>
                <select
                  value={form.institutionId}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, institutionId: event.target.value }));
                    setErrors((current) => ({ ...current, institutionId: undefined }));
                  }}
                  className={`block w-full rounded-lg border bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none dark:bg-gray-800 dark:text-white ${
                    errors.institutionId
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-primary-500 dark:border-gray-600'
                  }`}
                >
                  <option value="">Selecione a instituição</option>
                  {institutionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.institutionId ? (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.institutionId}</p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                  Instituição
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedInstitution?.name || 'Instituição selecionada'}
                </p>
              </div>
            )}
            {mode === 'scheduled' ? (
              <Input
                type="datetime-local"
                label="Data e hora do envio"
                value={form.scheduledFor}
                onChange={(event) => {
                  setForm((current) => ({ ...current, scheduledFor: event.target.value }));
                  setErrors((current) => ({ ...current, scheduledFor: undefined }));
                }}
                error={errors.scheduledFor}
              />
            ) : (
              <div />
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Público-alvo</p>
              </div>
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {allowedRoleOptions.map((role) => {
                const roleData = roleOptionMap[role];
                const selected = form.targetRoles.includes(role);

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                        : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {roleData.label}
                      </span>
                      {selected ? <Badge variant={roleData.variant} size="sm">Selecionado</Badge> : null}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{roleData.description}</p>
                  </button>
                );
              })}
            </div>

            {errors.targetRoles ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.targetRoles}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mensagem
            </label>
            <textarea
              value={form.content}
              onChange={(event) => {
                setForm((current) => ({ ...current, content: event.target.value }));
                setErrors((current) => ({ ...current, content: undefined }));
              }}
              rows={8}
              className={`block w-full rounded-lg border-2 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:outline-none dark:bg-gray-800 dark:text-white ${
                errors.content
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                  : 'border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-gray-600 dark:focus:ring-primary-900/30'
              }`}
              placeholder="Escreva aqui a mensagem que será exibida para o público selecionado."
            />
            {errors.content ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.content}</p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/60">
            <div className="mb-3 flex items-center gap-2">
              <MegaphoneIcon className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resumo</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {form.title.trim() || 'Seu título aparecerá aqui'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={mode === 'scheduled' ? 'warning' : 'info'} size="sm">
                  {mode === 'scheduled' ? 'Programado' : 'Envio imediato'}
                </Badge>
                <Badge variant="default" size="sm">
                  {form.targetRoles.length} público(s)
                </Badge>
              </div>
              <div className="flex items-start gap-2">
                <BuildingOffice2Icon className="mt-0.5 h-4 w-4 text-gray-400" />
                <span>{selectedInstitution?.name || 'Sem instituição'}</span>
              </div>
              <div className="flex items-start gap-2">
                <PaperAirplaneIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                <span>{mode === 'scheduled' ? 'Envio agendado' : 'Envio imediato'}</span>
              </div>
              <div className="flex items-start gap-2">
                <UserGroupIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                <span>
                  {form.targetRoles.length > 0
                    ? form.targetRoles.map((role) => roleOptionMap[role]?.label || role).join(', ')
                    : 'Nenhum público selecionado'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
