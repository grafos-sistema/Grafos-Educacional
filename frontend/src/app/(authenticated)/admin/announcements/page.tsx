'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { announcementsService } from '@/services/announcements.service';
import { institutionsService } from '@/services/institutions.service';
import { usersService } from '@/services/users.service';
import {
  Announcement,
  AnnouncementFilters,
  AnnouncementPriority,
} from '@/types/communication.types';
import { User, UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';

type AnnouncementFormState = {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetRoles: UserRole[];
  institutionId: string;
  scheduledFor: string;
  expiresAt: string;
  attachmentsText: string;
};

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: UserRole.INSTITUTION_ADMIN,
    label: 'Administradores',
    description: 'Diretores e administradores da instituição',
  },
  {
    value: UserRole.COORDINATOR,
    label: 'Coordenação',
    description: 'Equipe pedagógica e coordenação',
  },
  {
    value: UserRole.TEACHER,
    label: 'Professores',
    description: 'Docentes da instituição',
  },
  {
    value: UserRole.STUDENT,
    label: 'Alunos',
    description: 'Estudantes vinculados',
  },
  {
    value: UserRole.PARENT,
    label: 'Responsáveis',
    description: 'Pais e responsáveis',
  },
  {
    value: UserRole.SUPER_ADMIN,
    label: 'Super Admin',
    description: 'Equipe global da plataforma',
  },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas as prioridades' },
  { value: AnnouncementPriority.LOW, label: 'Baixa' },
  { value: AnnouncementPriority.NORMAL, label: 'Normal' },
  { value: AnnouncementPriority.HIGH, label: 'Alta' },
  { value: AnnouncementPriority.URGENT, label: 'Urgente' },
];

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos os públicos' },
  ...ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label })),
];

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const roleLabels: Record<string, string> = ROLE_OPTIONS.reduce<Record<string, string>>(
  (acc, role) => {
    acc[role.value] = role.label;
    return acc;
  },
  {}
);

const priorityOrder: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function parseAttachments(value?: string): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readStoredAttachments(value?: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatDate(value?: string, includeTime = false): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function toInputDate(value?: string): string {
  if (!value) {
    return '';
  }

  return value.includes('T') ? value.split('T')[0] : value;
}

function toInputDateTimeLocal(value?: string | Date): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultScheduledDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setSeconds(0, 0);
  return toInputDateTimeLocal(date);
}

function getUserDisplayName(user: User) {
  return `${user.firstName} ${user.lastName}`.trim();
}

function isUuid(value?: string) {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isAnnouncementActive(announcement: Announcement): boolean {
  if (!announcement.expiresAt) {
    return true;
  }

  return new Date(announcement.expiresAt).getTime() > Date.now();
}

function isScheduledAnnouncement(announcement: Announcement): boolean {
  return Boolean(
    announcement.isPublished &&
      announcement.publishedAt &&
      new Date(announcement.publishedAt).getTime() > Date.now()
  );
}

function getPriorityVariant(priority: string) {
  switch (priority?.toUpperCase()) {
    case 'URGENT':
      return 'error' as const;
    case 'HIGH':
      return 'warning' as const;
    case 'NORMAL':
      return 'info' as const;
    default:
      return 'default' as const;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function getInitialFilters(userRole?: UserRole, institutionId?: string): AnnouncementFilters {
  return {
    page: 1,
    limit: 9,
    institutionId: userRole === UserRole.SUPER_ADMIN ? undefined : institutionId,
    onlyPublished: false,
    onlyActive: false,
  };
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const [filters, setFilters] = useState<AnnouncementFilters>(() =>
    getInitialFilters(user?.role, user?.institutionId)
  );
  const [searchValue, setSearchValue] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionAnnouncementId, setActionAnnouncementId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AnnouncementFormState, string>>>({});
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const [selectedParents, setSelectedParents] = useState<User[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
  const [debouncedParentSearch, setDebouncedParentSearch] = useState('');
  const [isHydratingRecipients, setIsHydratingRecipients] = useState(false);
  const [openRoleMenu, setOpenRoleMenu] = useState<UserRole.STUDENT | UserRole.PARENT | null>(null);
  const [expandedSpecificAudience, setExpandedSpecificAudience] = useState<
    UserRole.STUDENT | UserRole.PARENT | null
  >(null);
  const [form, setForm] = useState<AnnouncementFormState>({
    title: '',
    content: '',
    priority: AnnouncementPriority.NORMAL,
    targetRoles: [],
    institutionId: '',
    scheduledFor: '',
    expiresAt: '',
    attachmentsText: '',
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedStudentSearch(studentSearch.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [studentSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedParentSearch(parentSearch.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [parentSearch]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFilters((current) => ({
      ...current,
      institutionId:
        user.role === UserRole.SUPER_ADMIN ? current.institutionId : user.institutionId,
    }));
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters((current) => ({
        ...current,
        search: searchValue.trim() || undefined,
        page: 1,
      }));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchValue]);

  const { data: institutionsResponse } = useQuery({
    queryKey: ['announcement-institutions', user?.id],
    queryFn: () => institutionsService.findAll({ page: 1, limit: 200, isActive: true }),
    enabled: Boolean(user && isSuperAdmin),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements', filters],
    queryFn: () => announcementsService.findAll(filters),
    enabled: Boolean(user),
  });

  const recipientInstitutionId =
    form.institutionId || (isSuperAdmin ? filters.institutionId : user?.institutionId) || '';

  const { data: studentRecipientsResponse, isFetching: isFetchingStudentRecipients } = useQuery({
    queryKey: [
      'announcement-student-recipients',
      recipientInstitutionId,
      debouncedStudentSearch,
      expandedSpecificAudience,
    ],
    queryFn: () =>
      usersService.findAll({
        page: 1,
        limit: 8,
        search: debouncedStudentSearch || undefined,
        institutionId: recipientInstitutionId,
        role: UserRole.STUDENT,
        isActive: true,
      }),
    enabled: Boolean(
      isFormModalOpen &&
        recipientInstitutionId &&
        expandedSpecificAudience === UserRole.STUDENT
    ),
  });

  const { data: parentRecipientsResponse, isFetching: isFetchingParentRecipients } = useQuery({
    queryKey: [
      'announcement-parent-recipients',
      recipientInstitutionId,
      debouncedParentSearch,
      expandedSpecificAudience,
    ],
    queryFn: () =>
      usersService.findAll({
        page: 1,
        limit: 8,
        search: debouncedParentSearch || undefined,
        institutionId: recipientInstitutionId,
        role: UserRole.PARENT,
        isActive: true,
      }),
    enabled: Boolean(
      isFormModalOpen &&
        recipientInstitutionId &&
        expandedSpecificAudience === UserRole.PARENT
    ),
  });

  const institutions = useMemo(() => institutionsResponse?.data ?? [], [institutionsResponse?.data]);
  const institutionOptions = useMemo(
    () => [
      { value: '', label: 'Todas as instituições' },
      ...institutions.map((institution) => ({
        value: institution.id,
        label: institution.name,
      })),
    ],
    [institutions]
  );

  const studentRecipientOptions = useMemo(() => {
    const selectedIds = new Set(selectedStudents.map((student) => student.id));
    return (studentRecipientsResponse?.data ?? []).filter(
      (student) => !selectedIds.has(student.id)
    );
  }, [selectedStudents, studentRecipientsResponse?.data]);

  const parentRecipientOptions = useMemo(() => {
    const selectedIds = new Set(selectedParents.map((parent) => parent.id));
    return (parentRecipientsResponse?.data ?? []).filter(
      (parent) => !selectedIds.has(parent.id)
    );
  }, [selectedParents, parentRecipientsResponse?.data]);

  const announcements = useMemo(() => {
    const items = [...(data?.data ?? [])];
    return items.sort((a, b) => {
      const byPriority =
        (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);

      if (byPriority !== 0) {
        return byPriority;
      }

      return (
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
      );
    });
  }, [data?.data]);

  const summary = useMemo(() => {
    const currentData = announcements;
    const urgentCount = currentData.filter(
      (announcement) => announcement.priority?.toUpperCase() === AnnouncementPriority.URGENT
    ).length;
    const publishedCount = currentData.filter((announcement) => announcement.isPublished).length;
    const activeCount = currentData.filter(isAnnouncementActive).length;
    const audienceCount = new Set(currentData.flatMap((announcement) => announcement.targetRoles ?? []))
      .size;

    return {
      total: data?.meta.total ?? currentData.length,
      urgentCount,
      publishedCount,
      activeCount,
      audienceCount,
    };
  }, [announcements, data?.meta.total]);

  const selectedInstitutionLabel = useMemo(() => {
    if (!form.institutionId) {
      return isSuperAdmin ? 'Nenhuma instituição selecionada' : 'Instituição atual';
    }

    const selectedInstitution = institutions.find((institution) => institution.id === form.institutionId);
    return selectedInstitution?.name ?? 'Instituição selecionada';
  }, [form.institutionId, institutions, isSuperAdmin]);

  const buildFormState = (announcement?: Announcement): AnnouncementFormState => {
    if (announcement) {
      return {
        title: announcement.title ?? '',
        content: announcement.content ?? '',
        priority: (announcement.priority?.toUpperCase() as AnnouncementPriority) ?? AnnouncementPriority.NORMAL,
        targetRoles: (announcement.targetRoles ?? []) as UserRole[],
        institutionId:
          announcement.institutionId ??
          (user?.role === UserRole.SUPER_ADMIN ? filters.institutionId ?? '' : user?.institutionId ?? ''),
        scheduledFor: isScheduledAnnouncement(announcement)
          ? toInputDateTimeLocal(announcement.publishedAt)
          : '',
        expiresAt: toInputDate(announcement.expiresAt),
        attachmentsText: readStoredAttachments(announcement.attachments).join('\n'),
      };
    }

    return {
      title: '',
      content: '',
      priority: AnnouncementPriority.NORMAL,
      targetRoles: [],
      institutionId:
        user?.role === UserRole.SUPER_ADMIN ? filters.institutionId ?? '' : user?.institutionId ?? '',
      scheduledFor: '',
      expiresAt: '',
      attachmentsText: '',
    };
  };

  const loadUsersByIds = async (ids: string[]) => {
    if (ids.length === 0) {
      return [] as User[];
    }

    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          return await usersService.findOne(id);
        } catch {
          return null;
        }
      })
    );

    return results.filter((item): item is User => Boolean(item));
  };

  const hydrateSpecificRecipients = async (announcement?: Announcement) => {
    if (!announcement) {
      setSelectedStudents([]);
      setSelectedParents([]);
      return;
    }

    try {
      setIsHydratingRecipients(true);
      const [students, parents] = await Promise.all([
        loadUsersByIds(announcement.targetStudentIds ?? []),
        loadUsersByIds(announcement.targetParentIds ?? []),
      ]);

      setSelectedStudents(students.filter((item) => item.role === UserRole.STUDENT));
      setSelectedParents(parents.filter((item) => item.role === UserRole.PARENT));
    } finally {
      setIsHydratingRecipients(false);
    }
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormErrors({});
    setSelectedStudents([]);
    setSelectedParents([]);
    setStudentSearch('');
    setParentSearch('');
    setForm(buildFormState());
    setIsFormModalOpen(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormErrors({});
    setStudentSearch('');
    setParentSearch('');
    setForm(buildFormState(announcement));
    void hydrateSpecificRecipients(announcement);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }

    setIsFormModalOpen(false);
    setEditingAnnouncement(null);
    setFormErrors({});
    setSelectedStudents([]);
    setSelectedParents([]);
    setStudentSearch('');
    setParentSearch('');
  };

  const handleRoleToggle = (role: UserRole) => {
    setFormErrors((current) => ({ ...current, targetRoles: undefined }));
    setForm((current) => ({
      ...current,
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((item) => item !== role)
        : [...current.targetRoles, role],
    }));
  };

  const handleToggleSpecificAudience = (role: UserRole.STUDENT | UserRole.PARENT) => {
    setExpandedSpecificAudience((current) => (current === role ? null : role));
    setOpenRoleMenu(null);

    if (role === UserRole.STUDENT) {
      setStudentSearch('');
      setDebouncedStudentSearch('');
    }

    if (role === UserRole.PARENT) {
      setParentSearch('');
      setDebouncedParentSearch('');
    }
  };

  const handleAddSpecificStudent = (selectedUser: User) => {
    setSelectedStudents((current) =>
      current.some((userItem) => userItem.id === selectedUser.id)
        ? current
        : [...current, selectedUser]
    );
    setFormErrors((current) => ({ ...current, targetRoles: undefined }));
    setStudentSearch('');
  };

  const handleRemoveSpecificStudent = (userId: string) => {
    setSelectedStudents((current) => current.filter((student) => student.id !== userId));
  };

  const handleAddSpecificParent = (selectedUser: User) => {
    setSelectedParents((current) =>
      current.some((userItem) => userItem.id === selectedUser.id)
        ? current
        : [...current, selectedUser]
    );
    setFormErrors((current) => ({ ...current, targetRoles: undefined }));
    setParentSearch('');
  };

  const handleRemoveSpecificParent = (userId: string) => {
    setSelectedParents((current) => current.filter((parent) => parent.id !== userId));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof AnnouncementFormState, string>> = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Informe um título claro para o comunicado.';
    }

    if (!form.content.trim()) {
      nextErrors.content = 'Descreva a mensagem que será exibida para o público.';
    }

    if (
      form.targetRoles.length === 0 &&
      selectedStudents.length === 0 &&
      selectedParents.length === 0
    ) {
      nextErrors.targetRoles =
        'Selecione ao menos um público geral ou escolha destinatários específicos.';
    }

    if (!form.institutionId.trim()) {
      nextErrors.institutionId = 'Selecione a instituição do comunicado.';
    } else if (!isUuid(form.institutionId.trim())) {
      nextErrors.institutionId = 'Selecione uma instituição válida.';
    }

    if (form.scheduledFor) {
      const scheduledFor = new Date(form.scheduledFor);
      if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
        nextErrors.scheduledFor = 'Escolha uma data futura para agendar a publicação.';
      }
    }

    if (form.expiresAt) {
      const expiresAt = new Date(form.expiresAt);
      const publishReference = form.scheduledFor ? new Date(form.scheduledFor) : new Date();

      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= publishReference.getTime()) {
        nextErrors.expiresAt = 'A validade precisa ficar depois da data de publicação.';
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      priority: form.priority,
      targetRoles: form.targetRoles,
      institutionId: form.institutionId,
      scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
      expiresAt: form.expiresAt || undefined,
      attachments: parseAttachments(form.attachmentsText),
      ...(selectedStudents.length > 0
        ? { targetStudentIds: selectedStudents.map((student) => student.id) }
        : {}),
      ...(selectedParents.length > 0
        ? { targetParentIds: selectedParents.map((parent) => parent.id) }
        : {}),
    };

    const shouldPublishImmediatelyAfterUpdate =
      Boolean(editingAnnouncement) &&
      isScheduledAnnouncement(editingAnnouncement as Announcement) &&
      !form.scheduledFor;

    try {
      setIsSaving(true);

      if (editingAnnouncement) {
        await announcementsService.update(editingAnnouncement.id, payload);
        if (shouldPublishImmediatelyAfterUpdate) {
          await announcementsService.publish(editingAnnouncement.id);
        }
        toast.success('Comunicado atualizado com sucesso.');
      } else {
        await announcementsService.create(payload);
        toast.success(
          form.scheduledFor
            ? 'Comunicado agendado com sucesso.'
            : 'Comunicado criado e publicado com sucesso.'
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setIsFormModalOpen(false);
      setEditingAnnouncement(null);
      setFormErrors({});
      setSelectedStudents([]);
      setSelectedParents([]);
      setStudentSearch('');
      setParentSearch('');
    } catch (error: unknown) {
      console.error('Erro ao salvar comunicado:', error);
      const errorMessages =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string | string[] }).message
          : undefined;

      if (
        Array.isArray(errorMessages) &&
        errorMessages.some((message) => message.includes('targetStudentIds should not exist'))
      ) {
        toast.error(
          'A API publicada ainda nao suporta destinatarios especificos. E preciso subir a atualizacao do backend para usar essa funcao.'
        );
      } else if (
        Array.isArray(errorMessages) &&
        errorMessages.some((message) => message.includes('institutionId must be a UUID'))
      ) {
        toast.error('Selecione uma instituicao valida antes de enviar o comunicado.');
      } else {
        toast.error(getErrorMessage(error, 'Nao foi possivel salvar o comunicado.'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublication = async (announcement: Announcement) => {
    try {
      setActionAnnouncementId(announcement.id);
      const isScheduled = isScheduledAnnouncement(announcement);

      if (isScheduled) {
        await announcementsService.publish(announcement.id);
        toast.success('Comunicado publicado imediatamente.');
      } else if (announcement.isPublished) {
        await announcementsService.unpublish(announcement.id);
        toast.success('Comunicado ocultado com sucesso.');
      } else {
        await announcementsService.publish(announcement.id);
        toast.success('Comunicado publicado com sucesso.');
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    } catch (error: unknown) {
      console.error('Erro ao alterar publicacao do comunicado:', error);
      toast.error(getErrorMessage(error, 'Nao foi possivel atualizar o status do comunicado.'));
    } finally {
      setActionAnnouncementId(null);
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await announcementsService.remove(announcementToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Comunicado removido com sucesso.');
      setAnnouncementToDelete(null);
    } catch (error: unknown) {
      console.error('Erro ao remover comunicado:', error);
      toast.error(getErrorMessage(error, 'Nao foi possivel remover o comunicado.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Comunicados
          </h1>
          <p className="max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            Centralize avisos pedagógicos, institucionais e operacionais em um fluxo simples:
            defina o público, escreva a mensagem e publique com clareza.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full lg:w-auto"
        >
          Novo comunicado
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
        <div className="flex items-start gap-3">
          <SparklesIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Fluxo pensado para agilizar a criação
            </p>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
              O comunicado nasce publicado automaticamente. Se precisar pausar a exibição, use a
              ação de ocultar sem perder o histórico da mensagem.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Comunicados encontrados',
            value: summary.total,
            caption: 'Total conforme filtros aplicados',
            icon: <MegaphoneIcon className="h-5 w-5" />,
          },
          {
            title: 'Publicados agora',
            value: summary.publishedCount,
            caption: 'Visiveis para o publico selecionado',
            icon: <PaperAirplaneIcon className="h-5 w-5" />,
          },
          {
            title: 'Urgentes',
            value: summary.urgentCount,
            caption: 'Mensagens que exigem atencao imediata',
            icon: <EyeIcon className="h-5 w-5" />,
          },
          {
            title: 'Publicos cobertos',
            value: summary.audienceCount,
            caption: 'Perfis diferentes nas mensagens desta lista',
            icon: <UserGroupIcon className="h-5 w-5" />,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-xl bg-gray-100 p-2 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                {item.icon}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Resumo
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.caption}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
        <div className="flex flex-wrap items-end gap-3 xl:flex-nowrap">
          <div className="min-w-[280px] flex-[2.2_1_340px]">
            <Input
              placeholder="Buscar por titulo ou conteudo..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          {isSuperAdmin && (
            <div className="min-w-[200px] flex-[1_1_220px]">
              <Select
                options={institutionOptions}
                value={filters.institutionId ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    institutionId: event.target.value || undefined,
                    page: 1,
                  }))
                }
                placeholder="Instituição"
              />
            </div>
          )}
          <div className="min-w-[180px] flex-[1_1_190px]">
            <Select
              options={PRIORITY_OPTIONS}
              value={filters.priority ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  priority: event.target.value || undefined,
                  page: 1,
                }))
              }
              placeholder="Prioridade"
            />
          </div>
          <div className="min-w-[180px] flex-[1_1_190px]">
            <Select
              options={ROLE_FILTER_OPTIONS}
              value={filters.targetRole ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  targetRole: event.target.value || undefined,
                  page: 1,
                }))
              }
              placeholder="Público"
            />
          </div>
          <div className="flex min-w-[170px] flex-[0_0_auto] items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  onlyPublished: !current.onlyPublished,
                  page: 1,
                }))
              }
              className={`inline-flex h-12 items-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                filters.onlyPublished
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-200'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-primary-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {filters.onlyPublished ? 'Publicados' : 'Todos os status'}
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  onlyActive: !current.onlyActive,
                  page: 1,
                }))
              }
              className={`inline-flex h-12 items-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                filters.onlyActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {filters.onlyActive ? 'Vigentes' : 'Histórico'}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data?.meta.total ?? 0} comunicado(s) na listagem
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Edite rapidamente, publique novamente ou encerre a exibicao quando necessario.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <EmptyState
            icon={<MegaphoneIcon className="h-14 w-14" />}
            title="Nenhum comunicado encontrado"
            description="Ajuste os filtros ou crie o primeiro comunicado para começar a comunicar a instituicao."
            actionLabel="Criar comunicado"
            onAction={openCreateModal}
          />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {announcements.map((announcement) => {
            const attachments = readStoredAttachments(announcement.attachments);
            const isActive = isAnnouncementActive(announcement);
            const isBusy = actionAnnouncementId === announcement.id;
            const isScheduled = isScheduledAnnouncement(announcement);

            return (
              <div
                key={announcement.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={getPriorityVariant(announcement.priority)} size="sm">
                        {priorityLabels[announcement.priority] ?? announcement.priority}
                      </Badge>
                      <Badge
                        variant={
                          isScheduled ? 'warning' : announcement.isPublished ? 'success' : 'default'
                        }
                        size="sm"
                      >
                        {isScheduled
                          ? 'Agendado'
                          : announcement.isPublished
                            ? 'Publicado'
                            : 'Oculto'}
                      </Badge>
                      <Badge variant={isActive ? 'info' : 'warning'} size="sm">
                        {isActive ? 'Vigente' : 'Expirado'}
                      </Badge>
                    </div>
                    <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(announcement)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    title="Editar comunicado"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                </div>

                <p className="mb-4 line-clamp-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {announcement.content}
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {(announcement.targetRoles ?? []).map((role) => (
                    <Badge key={role} variant="default" size="sm">
                      {roleLabels[role] ?? role}
                    </Badge>
                  ))}
                  {(announcement.targetStudentIds?.length ?? 0) > 0 && (
                    <Badge variant="info" size="sm">
                      {announcement.targetStudentIds?.length} aluno(s) específico(s)
                    </Badge>
                  )}
                  {(announcement.targetParentIds?.length ?? 0) > 0 && (
                    <Badge variant="warning" size="sm">
                      {announcement.targetParentIds?.length} responsável(is) específico(s)
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900/60 dark:text-gray-300 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                    <span>{announcement.institution?.name ?? 'Instituicao atual'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                    <span>
                      {isScheduled
                        ? `Programado para ${formatDate(announcement.publishedAt ?? announcement.createdAt, true)}`
                        : `Publicado em ${formatDate(announcement.publishedAt ?? announcement.createdAt, true)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                    <span>
                      {announcement.expiresAt
                        ? `Valido ate ${formatDate(announcement.expiresAt)}`
                        : 'Sem data limite'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaperClipIcon className="h-4 w-4 text-gray-400" />
                    <span>
                      {attachments.length > 0
                        ? `${attachments.length} anexo(s) em link`
                        : 'Sem anexos'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublication(announcement)}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:border-primary-400 dark:hover:text-primary-300"
                  >
                    {announcement.isPublished && !isScheduled ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                    {isScheduled
                      ? 'Publicar agora'
                      : announcement.isPublished
                        ? 'Ocultar'
                        : 'Publicar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementToDelete(announcement)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 shadow-sm dark:border-gray-700">
          <Pagination
            meta={data.meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </div>
      )}

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editingAnnouncement ? 'Editar comunicado' : 'Novo comunicado'}
        description="Defina o publico, escreva a mensagem e revise antes de publicar."
        size="full"
        panelClassName="mx-auto w-[90vw] !max-w-[90vw] p-6 sm:p-8"
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,68%)_minmax(380px,32%)]">
          <div className="min-w-0 space-y-5">
            <Input
              label="Título"
              placeholder="Ex.: Reuniao pedagógica do 3o bimestre"
              value={form.title}
              onChange={(event) => {
                setForm((current) => ({ ...current, title: event.target.value }));
                setFormErrors((current) => ({ ...current, title: undefined }));
              }}
              error={formErrors.title}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Prioridade"
                options={PRIORITY_OPTIONS.filter((option) => option.value)}
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as AnnouncementPriority,
                  }))
                }
              />
              <Input
                type="date"
                label="Validade"
                value={form.expiresAt}
                onChange={(event) => {
                  setForm((current) => ({ ...current, expiresAt: event.target.value }));
                  setFormErrors((current) => ({ ...current, expiresAt: undefined }));
                }}
                error={formErrors.expiresAt}
                helperText="Opcional. Depois dessa data o comunicado deixa de aparecer como vigente."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isSuperAdmin ? (
                <Select
                  label="Instituição"
                  options={institutionOptions}
                  value={form.institutionId}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, institutionId: event.target.value }));
                    setFormErrors((current) => ({ ...current, institutionId: undefined }));
                  }}
                  error={formErrors.institutionId}
                />
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                    Instituição
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedInstitutionLabel}</p>
                </div>
              )}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Disparo do comunicado
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Escolha se o aviso sai agora ou em uma data e hora futuras.
                    </p>
                  </div>
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((current) => ({ ...current, scheduledFor: '' }));
                      setFormErrors((current) => ({ ...current, scheduledFor: undefined }));
                    }}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      !form.scheduledFor
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                        : 'border-gray-200 bg-gray-50 hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Enviar ao salvar
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Disparo em {formatDate(new Date().toISOString(), true)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        scheduledFor: current.scheduledFor || getDefaultScheduledDateTime(),
                      }));
                      setFormErrors((current) => ({ ...current, scheduledFor: undefined }));
                    }}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      form.scheduledFor
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-900/30'
                        : 'border-gray-200 bg-gray-50 hover:border-amber-300 dark:border-gray-700 dark:bg-gray-900/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Programar envio
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Defina um dia e horário exatos para o disparo.
                    </p>
                  </button>
                </div>
                {form.scheduledFor && (
                  <div className="mt-4">
                    <Input
                      type="datetime-local"
                      label="Data e hora do disparo"
                      value={form.scheduledFor}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, scheduledFor: event.target.value }));
                        setFormErrors((current) => ({ ...current, scheduledFor: undefined }));
                      }}
                      error={formErrors.scheduledFor}
                      helperText="O comunicado ficará visível somente após este horário."
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Público-alvo
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Selecione um ou mais perfis
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ROLE_OPTIONS.map((role) => {
                  const selected = form.targetRoles.includes(role.value);
                  const supportsSpecificSelection =
                    role.value === UserRole.STUDENT || role.value === UserRole.PARENT;
                  const specificCount =
                    role.value === UserRole.STUDENT
                      ? selectedStudents.length
                      : role.value === UserRole.PARENT
                        ? selectedParents.length
                        : 0;
                  const isSpecificPanelOpen = expandedSpecificAudience === role.value;

                  return (
                    <div
                      key={role.value}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                          : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-800'
                      }`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(role.value)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {role.label}
                            </span>
                            {selected && (
                              <Badge variant="info" size="sm">
                                Selecionado
                              </Badge>
                            )}
                            {specificCount > 0 && (
                              <Badge
                                variant={role.value === UserRole.STUDENT ? 'info' : 'warning'}
                                size="sm"
                              >
                                {specificCount} específico(s)
                              </Badge>
                            )}
                          </div>
                        </button>
                        {supportsSpecificSelection && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenRoleMenu((current) =>
                                  current === role.value ? null : (role.value as UserRole.STUDENT | UserRole.PARENT)
                                )
                              }
                              className={`rounded-xl border p-2 transition-colors ${
                                openRoleMenu === role.value || isSpecificPanelOpen
                                  ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-200'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                              aria-label={`Mais opções para ${role.label}`}
                            >
                              <EllipsisHorizontalIcon className="h-5 w-5" />
                            </button>
                            {openRoleMenu === role.value && (
                              <div className="absolute right-0 top-12 z-10 w-48 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleSpecificAudience(
                                      role.value as UserRole.STUDENT | UserRole.PARENT
                                    )
                                  }
                                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                                >
                                  {role.value === UserRole.STUDENT
                                    ? 'Alunos específicos'
                                    : 'Responsáveis específicos'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                    </div>
                  );
                })}
              </div>
              {formErrors.targetRoles && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{formErrors.targetRoles}</p>
              )}
            </div>

            {expandedSpecificAudience && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {expandedSpecificAudience === UserRole.STUDENT
                        ? 'Alunos específicos'
                        : 'Responsáveis específicos'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {expandedSpecificAudience === UserRole.STUDENT
                        ? 'Selecione alunos específicos. Os responsáveis vinculados recebem automaticamente esse comunicado.'
                        : 'Selecione apenas os responsáveis que devem receber este comunicado.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={expandedSpecificAudience === UserRole.STUDENT ? 'info' : 'warning'}
                      size="sm"
                    >
                      {expandedSpecificAudience === UserRole.STUDENT
                        ? `${selectedStudents.length} selecionado(s)`
                        : `${selectedParents.length} selecionado(s)`}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setExpandedSpecificAudience(null)}
                      className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/60"
                      aria-label="Fechar seleção específica"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {!recipientInstitutionId && (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                    Selecione primeiro a instituição para buscar destinatários específicos.
                  </div>
                )}

                {recipientInstitutionId && expandedSpecificAudience === UserRole.STUDENT && (
                  <>
                    <Input
                      placeholder="Buscar aluno por nome, email ou CPF..."
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
                    />
                    <div className="mt-3 space-y-2">
                      {isHydratingRecipients && (
                        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Carregando alunos específicos deste comunicado...
                        </div>
                      )}
                      {isFetchingStudentRecipients && (
                        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Buscando alunos...
                        </div>
                      )}
                      {!isFetchingStudentRecipients &&
                        studentRecipientOptions.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleAddSpecificStudent(student)}
                            className="flex w-full items-start justify-between rounded-xl border border-gray-200 px-3 py-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/60 dark:border-gray-700 dark:hover:border-primary-400 dark:hover:bg-primary-900/20"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {getUserDisplayName(student)}
                              </p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {student.email}
                              </p>
                            </div>
                            <span className="ml-3 text-xs font-medium text-primary-600 dark:text-primary-300">
                              Adicionar
                            </span>
                          </button>
                        ))}
                      {!isFetchingStudentRecipients && studentRecipientOptions.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          {debouncedStudentSearch
                            ? 'Nenhum aluno encontrado com esse filtro.'
                            : 'Digite para buscar alunos específicos.'}
                        </div>
                      )}
                    </div>
                    {selectedStudents.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedStudents.map((student) => (
                          <span
                            key={student.id}
                            className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-200"
                          >
                            {getUserDisplayName(student)}
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecificStudent(student.id)}
                              className="rounded-full text-primary-600 transition-colors hover:text-primary-800 dark:text-primary-300"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {recipientInstitutionId && expandedSpecificAudience === UserRole.PARENT && (
                  <>
                    <Input
                      placeholder="Buscar responsável por nome, email ou CPF..."
                      value={parentSearch}
                      onChange={(event) => setParentSearch(event.target.value)}
                      leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
                    />
                    <div className="mt-3 space-y-2">
                      {isHydratingRecipients && (
                        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Carregando responsáveis específicos deste comunicado...
                        </div>
                      )}
                      {isFetchingParentRecipients && (
                        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Buscando responsáveis...
                        </div>
                      )}
                      {!isFetchingParentRecipients &&
                        parentRecipientOptions.map((parent) => (
                          <button
                            key={parent.id}
                            type="button"
                            onClick={() => handleAddSpecificParent(parent)}
                            className="flex w-full items-start justify-between rounded-xl border border-gray-200 px-3 py-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-50/60 dark:border-gray-700 dark:hover:border-amber-400 dark:hover:bg-amber-900/20"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {getUserDisplayName(parent)}
                              </p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {parent.email}
                              </p>
                            </div>
                            <span className="ml-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                              Adicionar
                            </span>
                          </button>
                        ))}
                      {!isFetchingParentRecipients && parentRecipientOptions.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          {debouncedParentSearch
                            ? 'Nenhum responsável encontrado com esse filtro.'
                            : 'Digite para buscar responsáveis específicos.'}
                        </div>
                      )}
                    </div>
                    {selectedParents.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedParents.map((parent) => (
                          <span
                            key={parent.id}
                            className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          >
                            {getUserDisplayName(parent)}
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecificParent(parent.id)}
                              className="rounded-full text-amber-700 transition-colors hover:text-amber-900 dark:text-amber-300"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mensagem
              </label>
              <textarea
                value={form.content}
                onChange={(event) => {
                  setForm((current) => ({ ...current, content: event.target.value }));
                  setFormErrors((current) => ({ ...current, content: undefined }));
                }}
                rows={8}
                className={`block w-full rounded-lg border-2 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:outline-none dark:bg-gray-800 dark:text-white ${
                  formErrors.content
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                    : 'border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-gray-600 dark:focus:ring-primary-900/30'
                }`}
                placeholder="Escreva aqui a mensagem que sera exibida para o publico selecionado."
              />
              {formErrors.content && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{formErrors.content}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Links de anexos
              </label>
              <textarea
                value={form.attachmentsText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, attachmentsText: event.target.value }))
                }
                rows={4}
                className="block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 hover:border-primary-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-900/30"
                placeholder="Um link por linha. Ex.: https://minhaescola.com/arquivo.pdf"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Use quando quiser anexar PDF, regulamento ou documento externo.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 dark:border-gray-700 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={closeFormModal} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={isSaving}
                leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
                className="w-full sm:w-auto"
              >
                {editingAnnouncement
                  ? 'Salvar alterações'
                  : form.scheduledFor
                    ? 'Agendar comunicado'
                    : 'Publicar comunicado'}
              </Button>
            </div>
          </div>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/60">
              <div className="mb-3 flex items-center gap-2">
                <MegaphoneIcon className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pré-visualização</h3>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getPriorityVariant(form.priority)} size="sm">
                    {priorityLabels[form.priority]}
                  </Badge>
                  {form.scheduledFor && (
                    <Badge variant="warning" size="sm">
                      Agendado
                    </Badge>
                  )}
                  <Badge variant="default" size="sm">
                    {form.targetRoles.length || 0} público(s)
                  </Badge>
                  {selectedStudents.length > 0 && (
                    <Badge variant="info" size="sm">
                      {selectedStudents.length} aluno(s)
                    </Badge>
                  )}
                  {selectedParents.length > 0 && (
                    <Badge variant="warning" size="sm">
                      {selectedParents.length} responsável(is)
                    </Badge>
                  )}
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  {form.title.trim() || 'Seu título aparecerá aqui'}
                </h4>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {form.content.trim() || 'A mensagem do comunicado será exibida neste bloco para revisão rápida.'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Checklist rápido
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <BuildingOffice2Icon className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>{selectedInstitutionLabel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <UserGroupIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>
                    {form.targetRoles.length > 0
                      ? form.targetRoles.map((role) => roleLabels[role] ?? role).join(', ')
                      : 'Sem público geral definido'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <UserGroupIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>
                    {selectedStudents.length > 0
                      ? `${selectedStudents.length} aluno(s) específico(s) e responsáveis vinculados automaticamente`
                      : selectedParents.length > 0
                        ? `${selectedParents.length} responsável(is) específico(s)`
                        : 'Sem destinatários específicos'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <PaperAirplaneIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>
                    {form.scheduledFor
                      ? `Programado para ${formatDate(form.scheduledFor, true)}`
                      : `Envio imediato em ${formatDate(new Date().toISOString(), true)}`}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDaysIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>
                    {form.expiresAt ? `Vigente até ${formatDate(form.expiresAt)}` : 'Sem data limite'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <PaperClipIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>{parseAttachments(form.attachmentsText).length} link(s) de anexo</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(announcementToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setAnnouncementToDelete(null);
          }
        }}
        title="Excluir comunicado"
        description="Esta ação remove o comunicado da base e não pode ser desfeita."
        size="md"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            <p className="font-medium">{announcementToDelete?.title}</p>
            <p className="mt-1">
              Confirme a exclusão apenas se essa mensagem não precisar mais de histórico.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setAnnouncementToDelete(null)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              leftIcon={<TrashIcon className="h-5 w-5" />}
              className="w-full sm:w-auto"
            >
              Excluir comunicado
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
