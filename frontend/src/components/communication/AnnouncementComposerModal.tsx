'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  BuildingOffice2Icon,
  ClockIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { announcementsService } from '@/services/announcements.service';
import { authService, type UserInstitutionOption } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { getValidInstitutionIds, isUuid } from '@/lib/institution-filter';
import { AnnouncementPriority, type CreateAnnouncementDto } from '@/types/communication.types';
import { UserRole } from '@/types/user.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';

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
};

const priorityOptions = [
  { value: AnnouncementPriority.NORMAL, label: 'Normal' },
  { value: AnnouncementPriority.LOW, label: 'Baixa' },
  { value: AnnouncementPriority.HIGH, label: 'Alta' },
  { value: AnnouncementPriority.URGENT, label: 'Urgente' },
];

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

function getInitialForm(institutionId = ''): AnnouncementFormState {
  return {
    title: '',
    content: '',
    priority: AnnouncementPriority.NORMAL,
    institutionId,
    scheduledFor: '',
    expiresAt: '',
    targetRoles: [],
  };
}

function formatDate(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AnnouncementComposerModal({
  isOpen,
  onClose,
}: AnnouncementComposerModalProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const institutionFilterAll = useAuthStore((state) => state.institutionFilterAll);
  const institutionFilterIds = useAuthStore((state) => state.institutionFilterIds);
  const currentRole = (user?.activeProfile || user?.role) as UserRole | undefined;
  const isGlobalAdmin =
    currentRole === UserRole.SUPER_ADMIN_GLOBAL || currentRole === UserRole.SUPER_ADMIN;
  const isCoordinator = currentRole === UserRole.COORDINATOR;

  const { data: institutions = [] } = useQuery({
    queryKey: ['auth', 'institutions'],
    queryFn: () => authService.getInstitutions(),
    enabled: isOpen,
  });

  const allowedRoleOptions = useMemo(() => {
    if (isCoordinator) {
      return [UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT];
    }

    if (isGlobalAdmin) {
      return [
        UserRole.INSTITUTION_ADMIN,
        UserRole.COORDINATOR,
        UserRole.TEACHER,
        UserRole.STUDENT,
        UserRole.PARENT,
        UserRole.SUPER_ADMIN,
      ];
    }

    return [
      UserRole.INSTITUTION_ADMIN,
      UserRole.COORDINATOR,
      UserRole.TEACHER,
      UserRole.STUDENT,
      UserRole.PARENT,
    ];
  }, [isCoordinator, isGlobalAdmin]);

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
  }, [institutionFilterAll, institutionFilterIds, institutions, user?.institutionId]);

  const [form, setForm] = useState<AnnouncementFormState>(() => getInitialForm(defaultInstitutionId));
  const [errors, setErrors] = useState<Partial<Record<keyof AnnouncementFormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(getInitialForm(defaultInstitutionId));
    setErrors({});
  }, [defaultInstitutionId, isOpen]);

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

    if (form.expiresAt && form.scheduledFor) {
      const expiresDate = new Date(form.expiresAt);
      const scheduledDate = new Date(form.scheduledFor);
      if (!Number.isNaN(expiresDate.getTime()) && expiresDate.getTime() <= scheduledDate.getTime()) {
        nextErrors.expiresAt = 'A validade precisa ser posterior ao disparo.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
      };

      await announcementsService.create(payload);

      toast.success(
        form.scheduledFor ? 'Comunicado agendado com sucesso.' : 'Comunicado criado com sucesso.'
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['announcements'] }),
        queryClient.invalidateQueries({ queryKey: ['announcements-active'] }),
      ]);

      onClose();
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Não foi possível salvar o comunicado.';
      toast.error(message);
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
      description="Crie um comunicado sem sair da tela. O envio respeita a instituição selecionada e o público escolhido."
      size="xl"
      contentClassName="space-y-5"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
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
            <Select
              label="Prioridade"
              options={priorityOptions}
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as AnnouncementPriority,
                }))
              }
            />

            {isGlobalAdmin ? (
              <Select
                label="Instituição"
                options={institutionOptions}
                value={form.institutionId}
                onChange={(event) => {
                  setForm((current) => ({ ...current, institutionId: event.target.value }));
                  setErrors((current) => ({ ...current, institutionId: undefined }));
                }}
                error={errors.institutionId}
              />
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                  Instituição
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedInstitution?.name || 'Instituição selecionada'}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="datetime-local"
              label="Programar envio"
              value={form.scheduledFor}
              onChange={(event) => {
                setForm((current) => ({ ...current, scheduledFor: event.target.value }));
                setErrors((current) => ({ ...current, scheduledFor: undefined }));
              }}
              error={errors.scheduledFor}
              helperText="Opcional. Se vazio, o comunicado é enviado ao salvar."
            />

            <Input
              type="date"
              label="Validade"
              value={form.expiresAt}
              onChange={(event) => {
                setForm((current) => ({ ...current, expiresAt: event.target.value }));
                setErrors((current) => ({ ...current, expiresAt: undefined }));
              }}
              error={errors.expiresAt}
              helperText="Opcional. Depois dessa data o comunicado deixa de ficar vigente."
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Público-alvo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isCoordinator
                    ? 'Como coordenador, você pode enviar para Coordenação, Professores e Alunos.'
                    : 'Selecione um ou mais públicos para receber este comunicado.'}
                </p>
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
                    className={`rounded-2xl border p-4 text-left transition-colors ${
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
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/60">
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
                <Badge variant="info" size="sm">
                  {priorityOptions.find((option) => option.value === form.priority)?.label || 'Normal'}
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
                <ClockIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                <span>
                  {form.scheduledFor
                    ? `Agendado para ${formatDate(form.scheduledFor)}`
                    : 'Envio imediato ao salvar'}
                </span>
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

          <div className="flex flex-col gap-3">
            <Button variant="secondary" onClick={onClose} className="w-full" disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isSaving}
              leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
              className="w-full"
            >
              {form.scheduledFor ? 'Agendar comunicado' : 'Publicar comunicado'}
            </Button>
            {!form.scheduledFor ? (
              <Button
                variant="ghost"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    scheduledFor: current.scheduledFor || getDefaultScheduledDateTime(),
                  }))
                }
                className="w-full"
              >
                Programar envio
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
