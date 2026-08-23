'use client';

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MaskedInput, masks, formatCPF } from '@/components/ui/MaskedInput';
import { Button } from '@/components/ui/Button';
import {
  PlusIcon,
  TrashIcon,
  UserIcon,
  AcademicCapIcon,
  MapPinIcon,
  PhoneIcon,
  UserGroupIcon,
  HeartIcon,
  TruckIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CameraIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { observationsService } from '@/services/observations.service';
import { useAuthStore } from '@/stores/authStore';
import { BRAZILIAN_UF_OPTIONS } from '@/lib/constants/document-options';
import { Gender, UserRole } from '@/types/user.types';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/HeroDropdown';
import { presentFriendlyError } from '@/lib/friendly-error';
import { supabase } from '@/lib/supabase';
import { useCepAutofill } from '@/hooks/useCepAutofill';
import { coursesService } from '@/services/courses.service';
import { academicYearsService } from '@/services/academic-years.service';
import { classesService } from '@/services/classes.service';
import {
  classShiftOptions,
  getClassSeriesOptions,
} from '@/lib/constants/class-options';
import { parseStudentTagList } from '@/lib/student-form-utils';
import {
  STUDENT_DOCUMENT_DEFINITIONS,
  type PendingStudentDocumentUpload,
  type StudentDocumentKey,
} from '@/types/student-document.types';

const tabs = [
  {
    id: 'pessoais',
    label: 'Dados Pessoais',
    icon: UserIcon,
    subtitle: 'Informações básicas do aluno',
  },
  {
    id: 'matricula',
    label: 'Matrícula',
    icon: AcademicCapIcon,
    subtitle: 'Dados acadêmicos e de matrícula',
  },
  {
    id: 'endereco',
    label: 'Endereço',
    icon: MapPinIcon,
    subtitle: 'Endereço residencial do aluno',
  },
  {
    id: 'contato',
    label: 'Contato',
    icon: PhoneIcon,
    subtitle: 'Informações de contato do aluno',
  },
  {
    id: 'responsaveis',
    label: 'Responsáveis',
    icon: UserGroupIcon,
    subtitle: 'Responsáveis legais pelo aluno',
  },
  {
    id: 'saude',
    label: 'Saúde',
    icon: HeartIcon,
    subtitle: 'Informações de saúde e prontuário',
  },
  {
    id: 'transporte',
    label: 'Transporte',
    icon: TruckIcon,
    subtitle: 'Transporte escolar utilizado',
  },
  {
    id: 'documentos',
    label: 'Documentos',
    icon: DocumentTextIcon,
    subtitle: 'Documentos do aluno',
  },
  {
    id: 'acesso',
    label: 'Acesso',
    icon: ShieldCheckIcon,
    subtitle: 'Senha e credenciais do aluno',
  },
];

const genderOptions = [
  { value: Gender.MALE, label: 'Masculino' },
  { value: Gender.FEMALE, label: 'Feminino' },
  { value: Gender.OTHER, label: 'Outro' },
  { value: Gender.NOT_INFORMED, label: 'Não informado' },
];

const situationOptions = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'INATIVO', label: 'Inativo' },
  { value: 'TRANSFERIDO', label: 'Transferido' },
  { value: 'TRANCADO', label: 'Trancado' },
  { value: 'CONCLUIDO', label: 'Concluído' },
];

const responsibleRelationshipOptions = [
  'Pai',
  'Mãe',
  'Padrasto',
  'Madrasta',
  'Tio',
  'Tia',
  'Avô',
  'Avó',
  'Primo',
  'Prima',
  'Irmão',
  'Irmã',
].map((value) => ({ value, label: value }));

const adultRequiredRelationships = new Set(['Primo', 'Prima', 'Irmão', 'Irmã']);

function hasMinimumAge(birthDate: string, minimumAge: number) {
  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const birthdayNotReached =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  if (birthdayNotReached) age -= 1;
  return age >= minimumAge;
}

interface StudentFormTabsProps {
  form: UseFormReturn<any>;
  availableInstitutions: Array<{
    id: string;
    name: string;
  }>;
  isLoadingInstitutions?: boolean;
  mode?: 'create' | 'edit';
  generatedInitialPassword?: string;
  passwordField?: React.ReactNode;
  studentProfileId?: string;
}

type StudentObservationType =
  'POSITIVE' | 'NEUTRAL' | 'ATTENTION' | 'DISCIPLINARY';

type StudentObservation = {
  id: string;
  studentId: string;
  teacherId: string;
  title: string;
  description: string;
  type: StudentObservationType;
  isPrivate: boolean;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  teacher?: {
    user?: {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
    };
  };
};

const observationTypeOptions: Array<{
  value: StudentObservationType;
  label: string;
}> = [
  { value: 'POSITIVE', label: 'Positiva' },
  { value: 'NEUTRAL', label: 'Neutra' },
  { value: 'ATTENTION', label: 'Atenção' },
  { value: 'DISCIPLINARY', label: 'Disciplinar' },
];

function getInitialPasswordFromEmail(email?: string) {
  if (!email) return '';
  const [localPart] = email.trim().toLowerCase().split('@');
  return localPart ? `${localPart}@Grafos` : '';
}

const STUDENT_DOCUMENT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const MAX_STUDENT_DOCUMENT_SIZE = 5 * 1024 * 1024;

function sortStudentDocuments(documents: PendingStudentDocumentUpload[]) {
  const order = new Map(
    STUDENT_DOCUMENT_DEFINITIONS.map((definition, index) => [
      definition.key,
      index,
    ]),
  );

  return [...documents].sort(
    (left, right) => (order.get(left.key) ?? 0) - (order.get(right.key) ?? 0),
  );
}

function TabHeader({
  tab,
  rightContent,
}: {
  tab: (typeof tabs)[number];
  rightContent?: ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tab.label}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tab.subtitle}
          </p>
        </div>
        {rightContent ? <div className="shrink-0">{rightContent}</div> : null}
      </div>
    </div>
  );
}

function TagInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const addTag = (rawValue: string) => {
    const nextValue = rawValue.trim();
    if (!nextValue) return;

    const exists = value.some(
      (item) => item.toLocaleLowerCase() === nextValue.toLocaleLowerCase(),
    );
    if (!exists) onChange([...value, nextValue]);
    setDraft('');
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 dark:border-gray-600 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                className="text-primary-500 hover:text-primary-800"
                aria-label={`Remover ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addTag(draft);
              } else if (
                event.key === 'Backspace' &&
                !draft &&
                value.length > 0
              ) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={() => addTag(draft)}
            placeholder={
              value.length === 0 ? placeholder : 'Digite e pressione Enter'
            }
            className="min-w-[150px] flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Pressione Enter para adicionar cada item.
      </p>
    </div>
  );
}

export function StudentFormTabs({
  form,
  availableInstitutions,
  isLoadingInstitutions = false,
  mode = 'create',
  generatedInitialPassword = '',
  passwordField,
  studentProfileId,
}: StudentFormTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pessoais');
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
  } = form;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const currentRole = currentUser?.activeProfile ?? currentUser?.role;
  const isDirector = currentRole === UserRole.DIRECTOR;

  const usaTransporte = watch('usaTransporte');
  const watchResponsaveis = watch('responsaveis');
  const selectedInstitutionId = watch('institutionId');
  const selectedAcademicYearName = watch('anoLetivo') as string | undefined;
  const selectedCourseName = watch('curso') as string | undefined;
  const selectedGrade = watch('serie') as string | undefined;
  const selectedClassName = watch('turma') as string | undefined;
  const selectedClassId = watch('turmaId') as string | undefined;
  const selectedShift = watch('turno') as string | undefined;
  const selectedPhoto = watch('photo');
  const currentAvatar = watch('avatar');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const cpf = watch('cpf');
  const password = watch('password');
  const bloodType = watch('tipoSanguineo');
  const birthDate = watch('birthDate') as string | undefined;
  const state = watch('state') as string | undefined;
  const dataMatricula = watch('dataMatricula') as string | undefined;
  const situacao = watch('situacao') as string | undefined;
  const tipoTransporte = watch('tipoTransporte') as string | undefined;
  const emergencyContacts = useMemo<
    Array<{ index: number; name: string; phone: string; selected: boolean }>
  >(
    () =>
      (watchResponsaveis ?? [])
        .map((item: any, index: number) => ({
          index,
          name: String(item?.nome ?? '').trim(),
          phone: String(item?.celular ?? '').trim(),
          selected: Boolean(item?.contatoEmergencia),
        }))
        .filter((item: { name: string }) => item.name),
    [watchResponsaveis],
  );
  const watchedDocuments = watch('documents') as
    PendingStudentDocumentUpload[] | undefined;
  const effectiveInstitutionId =
    selectedInstitutionId || currentUser?.institutionId;

  const { data: academicYearsData, isLoading: isLoadingAcademicYears } =
    useQuery({
      queryKey: ['student-form-academic-years', effectiveInstitutionId],
      queryFn: () =>
        academicYearsService.findAll({
          institutionId: effectiveInstitutionId,
          isActive: true,
          limit: 1000,
        }),
      enabled: Boolean(effectiveInstitutionId),
    });

  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['student-form-courses', effectiveInstitutionId],
    queryFn: () =>
      coursesService.findAll({
        institutionId: effectiveInstitutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(effectiveInstitutionId),
  });

  const selectedAcademicYear = useMemo(
    () =>
      (academicYearsData?.data ?? []).find(
        (item) =>
          String(item.year) === String(selectedAcademicYearName ?? '') ||
          item.name === selectedAcademicYearName,
      ),
    [academicYearsData?.data, selectedAcademicYearName],
  );

  const selectedCourse = useMemo(
    () =>
      (coursesData?.data ?? []).find(
        (item) => item.name === selectedCourseName,
      ),
    [coursesData?.data, selectedCourseName],
  );

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: [
      'student-form-classes',
      effectiveInstitutionId,
      selectedAcademicYear?.id,
      selectedCourse?.id,
    ],
    queryFn: () =>
      classesService.findAll({
        institutionId: effectiveInstitutionId,
        academicYearId: selectedAcademicYear?.id,
        courseId: selectedCourse?.id,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(
      effectiveInstitutionId && selectedAcademicYear?.id && selectedCourse?.id,
    ),
  });

  const gradeOptions = useMemo(() => {
    const configuredOptions = getClassSeriesOptions(selectedCourse?.level);
    if (configuredOptions.length > 1) return configuredOptions;

    const grades = Array.from(
      new Set(
        (classesData?.data ?? []).map((item) => item.grade).filter(Boolean),
      ),
    );
    return [
      { value: '', label: 'Selecione a série/ano' },
      ...grades.map((grade) => ({ value: grade, label: grade })),
    ];
  }, [classesData?.data, selectedCourse?.level]);

  const classOptions = useMemo(() => {
    const classes = (classesData?.data ?? []).filter(
      (item) => !selectedGrade || item.grade === selectedGrade,
    );
    return [
      { value: '', label: 'Selecione uma turma' },
      ...classes.map((item) => ({
        value: item.id,
        label: `${item.name}${item.shift ? ` • ${item.shift}` : ''}`,
      })),
    ];
  }, [classesData?.data, selectedGrade]);

  useEffect(() => {
    if (selectedClassId || !selectedClassName || !classesData?.data?.length)
      return;

    const matchingClass = classesData.data.find(
      (item) => item.name === selectedClassName,
    );
    if (matchingClass) {
      setValue('turmaId', matchingClass.id, { shouldDirty: false });
    }
  }, [classesData?.data, selectedClassId, selectedClassName, setValue]);

  const { fillAddressFromCep } = useCepAutofill({
    form,
    fields: {
      zipCode: 'zipCode',
      address: 'address',
      city: 'city',
      state: 'state',
      bairro: 'bairro',
      complemento: 'complemento',
    },
  });
  const [selectedObservationId, setSelectedObservationId] = useState<
    string | 'new' | null
  >(null);
  const [observationDraft, setObservationDraft] = useState<{
    title: string;
    description: string;
    type: StudentObservationType;
    isPrivate: boolean;
  }>({
    title: '',
    description: '',
    type: 'NEUTRAL',
    isPrivate: false,
  });
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDocumentKey, setSelectedDocumentKey] =
    useState<StudentDocumentKey | null>(null);
  const [queuedDocumentFile, setQueuedDocumentFile] = useState<File | null>(
    null,
  );
  const [isDocumentPickerOpen, setIsDocumentPickerOpen] = useState(false);
  const [isDocumentDropActive, setIsDocumentDropActive] = useState(false);
  const [selectedUploadedDocument, setSelectedUploadedDocument] =
    useState<PendingStudentDocumentUpload | null>(null);
  const [documentActionLoading, setDocumentActionLoading] = useState<
    'view' | 'download' | null
  >(null);

  const [responsaveis, setResponsaveis] = useState(() => {
    const initial = form.getValues('responsaveis');
    return initial && initial.length > 0
      ? initial.map((r: any, i: number) => ({ id: r.id || i + 1 }))
      : [{ id: 1 }];
  });

  useEffect(() => {
    if (
      isDirector &&
      currentUser?.institutionId &&
      selectedInstitutionId !== currentUser.institutionId
    ) {
      setValue('institutionId', currentUser.institutionId, {
        shouldValidate: true,
      });
      setValue('institutionIds', [currentUser.institutionId], {
        shouldValidate: true,
      });
    }
  }, [currentUser?.institutionId, isDirector, selectedInstitutionId, setValue]);

  useEffect(() => {
    if (watchResponsaveis && watchResponsaveis.length > 0) {
      if (watchResponsaveis.length !== responsaveis.length) {
        setResponsaveis(
          watchResponsaveis.map((r: any, i: number) => ({
            id: r.id || Date.now() + i,
          })),
        );
      }
    }
  }, [watchResponsaveis]);

  useEffect(() => {
    if (!watchResponsaveis?.length) return;

    watchResponsaveis.forEach((_: any, index: number) => {
      void trigger(`responsaveis.${index}.email`);
    });
  }, [trigger, watchResponsaveis]);

  useEffect(() => {
    if (!selectedInstitutionId) return;

    const selectedInstitution = availableInstitutions.find(
      (institution) => institution.id === selectedInstitutionId,
    );
    if (!selectedInstitution) return;

    if (form.getValues('escola') !== selectedInstitution.name) {
      setValue('escola', selectedInstitution.name, { shouldValidate: true });
    }
  }, [availableInstitutions, form, selectedInstitutionId, setValue]);

  useEffect(() => {
    const resolveSelectedFile = () => {
      if (!selectedPhoto) return null;
      if (
        typeof FileList !== 'undefined' &&
        selectedPhoto instanceof FileList
      ) {
        return selectedPhoto.item(0);
      }
      return Array.isArray(selectedPhoto) ? (selectedPhoto[0] ?? null) : null;
    };

    const selectedFile = resolveSelectedFile();
    if (!selectedFile) {
      setPhotoPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPhotoPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedPhoto]);

  const photoRegister = register('photo');
  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (!nextFile.type.startsWith('image/')) {
      event.target.value = '';
      toast.error('Selecione um arquivo de imagem válido.');
      return;
    }
    setPendingPhotoFile(nextFile);
    setIsCropModalOpen(true);
    event.target.value = '';
  };

  const handleDeletePhoto = () => {
    setValue('avatar', null as never, { shouldDirty: true });
    setValue('photo', undefined as never, { shouldDirty: true });
    if (photoInputRef.current) photoInputRef.current.value = '';
    toast.success('Foto removida. Salve o cadastro para confirmar.');
  };

  const canManageObservations = useMemo(
    () =>
      currentUser?.role === UserRole.SUPER_ADMIN ||
      currentUser?.role === UserRole.INSTITUTION_ADMIN ||
      currentUser?.role === UserRole.COORDINATOR ||
      currentUser?.role === UserRole.TEACHER,
    [currentUser?.role],
  );

  const { data: observations = [], isLoading: isLoadingObservations } =
    useQuery({
      queryKey: ['student-observations-inline', studentProfileId],
      queryFn: async () =>
        (await observationsService.findByStudent(
          studentProfileId as string,
        )) as unknown as StudentObservation[],
      enabled:
        mode === 'edit' &&
        Boolean(studentProfileId) &&
        activeTab === 'observacoes',
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    });

  useEffect(() => {
    if (mode !== 'edit' || !studentProfileId) return;
    if (selectedObservationId) return;
    if (observations.length === 0) return;
    setSelectedObservationId(observations[0].id);
  }, [mode, observations, selectedObservationId, studentProfileId]);

  const selectedObservation =
    selectedObservationId && selectedObservationId !== 'new'
      ? (observations.find((item) => item.id === selectedObservationId) ?? null)
      : null;

  useEffect(() => {
    if (selectedObservationId === 'new') {
      setObservationDraft({
        title: '',
        description: '',
        type: 'NEUTRAL',
        isPrivate: false,
      });
      return;
    }

    if (!selectedObservation) return;

    setObservationDraft({
      title: selectedObservation.title ?? '',
      description: selectedObservation.description ?? '',
      type: selectedObservation.type ?? 'NEUTRAL',
      isPrivate: Boolean(selectedObservation.isPrivate),
    });
  }, [selectedObservation, selectedObservationId]);

  const createObservationMutation = useMutation({
    mutationFn: async () => {
      if (!studentProfileId)
        throw new Error(
          'Aluno ainda não possui perfil para receber observações.',
        );
      return observationsService.create({
        studentId: studentProfileId,
        title: observationDraft.title.trim(),
        description: observationDraft.description.trim(),
        type: observationDraft.type,
        isPrivate: observationDraft.isPrivate,
      } as any);
    },
    onSuccess: (createdObservation: any) => {
      queryClient.invalidateQueries({
        queryKey: ['student-observations-inline', studentProfileId],
      });
      setSelectedObservationId(createdObservation.id);
      toast.success('Anotação salva com sucesso.');
    },
    onError: (error: any) => {
      presentFriendlyError(
        error,
        'Nao foi possivel salvar a anotacao agora. Tente novamente.',
      );
    },
  });

  const updateObservationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedObservation)
        throw new Error('Selecione uma anotação para atualizar.');
      return observationsService.update(selectedObservation.id, {
        title: observationDraft.title.trim(),
        description: observationDraft.description.trim(),
        type: observationDraft.type,
        isPrivate: observationDraft.isPrivate,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-observations-inline', studentProfileId],
      });
      toast.success('Anotação atualizada com sucesso.');
    },
    onError: (error: any) => {
      presentFriendlyError(
        error,
        'Nao foi possivel atualizar a anotacao agora. Tente novamente.',
      );
    },
  });

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const activeObservationTab = tabs.find((tab) => tab.id === 'observacoes');
  const activeAccessTab = tabs.find((tab) => tab.id === 'acesso');
  const studentDisplayName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || 'Novo aluno';
  const resolvedAvatarSrc = photoPreviewUrl || currentAvatar || '';
  const studentSummary = cpf?.trim() ? formatCPF(cpf.trim()) : '';
  const bloodTypeBadge =
    bloodType && bloodType !== 'NAO_INFORMADO' ? bloodType : null;
  const resolvedInitialPassword =
    generatedInitialPassword || getInitialPasswordFromEmail(email);
  const documentDefinitionsByKey = useMemo(
    () =>
      new Map(
        STUDENT_DOCUMENT_DEFINITIONS.map((definition) => [
          definition.key,
          definition.label,
        ]),
      ),
    [],
  );
  const resolvedDocuments = useMemo(() => {
    const normalizedDocuments = Array.isArray(watchedDocuments)
      ? watchedDocuments.filter(Boolean)
      : [];
    const documentMap = new Map(
      normalizedDocuments.map((document) => [document.key, document]),
    );

    return STUDENT_DOCUMENT_DEFINITIONS.map((definition) => {
      const document = documentMap.get(definition.key);
      return {
        key: definition.key,
        label: definition.label,
        fileName: document?.fileName ?? '',
        path: document?.path,
        mimeType: document?.mimeType,
        size: document?.size,
        uploadedAt: document?.uploadedAt,
        file: document?.file,
        status: document?.status ?? 'PENDING',
      } satisfies PendingStudentDocumentUpload;
    });
  }, [watchedDocuments]);
  const pendingDocuments = useMemo(
    () =>
      resolvedDocuments.filter((document) => !document.path && !document.file),
    [resolvedDocuments],
  );
  const documentOptionsForPicker =
    pendingDocuments.length > 0 ? pendingDocuments : resolvedDocuments;
  const hasLocalDocuments = resolvedDocuments.some(
    (document) => document.status === 'LOCAL',
  );

  const formatObservationDate = (value?: string) => {
    if (!value) return 'Sem data';

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return 'Sem data';

    return parsedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getObservationAuthor = (observation?: StudentObservation | null) =>
    observation?.teacher?.user?.name ||
    observation?.teacher?.user?.email ||
    'Autor não identificado';

  const upsertStudentDocument = (document: PendingStudentDocumentUpload) => {
    const currentDocuments = Array.isArray(getValues('documents'))
      ? (getValues('documents') as PendingStudentDocumentUpload[])
      : [];

    const nextDocuments = sortStudentDocuments([
      ...currentDocuments.filter((item) => item.key !== document.key),
      document,
    ]);

    setValue('documents', nextDocuments, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const validateStudentDocumentFile = (file: File) => {
    if (!STUDENT_DOCUMENT_ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Envie um arquivo em PDF, JPG ou PNG.');
      return false;
    }

    if (file.size > MAX_STUDENT_DOCUMENT_SIZE) {
      toast.error('Cada documento pode ter no máximo 5MB.');
      return false;
    }

    return true;
  };

  const handleDocumentFileSelection = (
    file: File,
    documentKey: StudentDocumentKey,
  ) => {
    if (!validateStudentDocumentFile(file)) {
      return;
    }

    const label = documentDefinitionsByKey.get(documentKey) ?? 'Documento';

    upsertStudentDocument({
      key: documentKey,
      label,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'LOCAL',
      file,
    });

    setQueuedDocumentFile(null);
    setSelectedDocumentKey(null);

    toast.success(
      mode === 'create'
        ? 'Documento separado para envio. Ao salvar o aluno, o arquivo sera anexado.'
        : 'Documento pronto para envio. Salve as alteracoes para concluir o anexo.',
    );
  };

  const openDocumentBrowserFor = (documentKey: StudentDocumentKey) => {
    setSelectedDocumentKey(documentKey);
    setIsDocumentPickerOpen(false);

    if (queuedDocumentFile) {
      handleDocumentFileSelection(queuedDocumentFile, documentKey);
      return;
    }

    documentInputRef.current?.click();
  };

  const openPendingDocumentsPicker = (file?: File) => {
    if (file && !validateStudentDocumentFile(file)) {
      return;
    }

    setQueuedDocumentFile(file ?? null);
    setIsDocumentPickerOpen(true);
  };

  const handleDocumentInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile || !selectedDocumentKey) {
      event.target.value = '';
      return;
    }

    handleDocumentFileSelection(nextFile, selectedDocumentKey);
    event.target.value = '';
  };

  const handleDocumentDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDocumentDropActive(false);

    const droppedFiles = Array.from(event.dataTransfer.files ?? []);
    if (droppedFiles.length === 0) return;

    if (droppedFiles.length > 1) {
      toast.error('Envie um documento por vez para escolher o tipo correto.');
      return;
    }

    openPendingDocumentsPicker(droppedFiles[0]);
  };

  const handleExistingDocumentAction = (
    document: PendingStudentDocumentUpload,
  ) => {
    if (document.status === 'UPLOADED' && document.path) {
      setSelectedUploadedDocument(document);
      return;
    }

    openDocumentBrowserFor(document.key);
  };

  const loadUploadedDocumentBlob = async (
    document: PendingStudentDocumentUpload,
  ) => {
    if (!document.path) {
      throw new Error('O caminho do anexo nao foi encontrado.');
    }

    const { data, error } = await supabase.storage
      .from('student-documents')
      .download(document.path);

    if (error) {
      throw error;
    }

    return data;
  };

  const handleViewUploadedDocument = async () => {
    if (!selectedUploadedDocument) return;

    setDocumentActionLoading('view');

    try {
      const blob = await loadUploadedDocumentBlob(selectedUploadedDocument);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setSelectedUploadedDocument(null);
    } catch (error) {
      presentFriendlyError(error, 'Nao foi possivel abrir o anexo agora.');
    } finally {
      setDocumentActionLoading(null);
    }
  };

  const handleDownloadUploadedDocument = async () => {
    if (!selectedUploadedDocument) return;

    setDocumentActionLoading('download');

    try {
      const blob = await loadUploadedDocumentBlob(selectedUploadedDocument);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        selectedUploadedDocument.fileName ||
        `${selectedUploadedDocument.label}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setSelectedUploadedDocument(null);
    } catch (error) {
      presentFriendlyError(error, 'Nao foi possivel baixar o anexo agora.');
    } finally {
      setDocumentActionLoading(null);
    }
  };

  const handleStartNewObservation = () => {
    setSelectedObservationId('new');
    setObservationDraft({
      title: '',
      description: '',
      type: 'NEUTRAL',
      isPrivate: false,
    });
  };

  const handlePersistObservation = async () => {
    if (
      !observationDraft.title.trim() ||
      !observationDraft.description.trim()
    ) {
      toast.error('Preencha o título e a mensagem da anotação.');
      return;
    }

    if (selectedObservationId === 'new') {
      await createObservationMutation.mutateAsync();
      return;
    }

    if (selectedObservation) {
      await updateObservationMutation.mutateAsync();
    }
  };

  const goToTab = (index: number) => {
    if (index >= 0 && index < tabs.length) {
      setActiveTab(tabs[index].id);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8 pt-4 pb-4 md:flex-row md:items-start">
        <div className="w-full md:w-[248px] shrink-0 flex flex-col gap-5">
          <div className="relative flex flex-col items-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-6 shadow-sm">
            {bloodTypeBadge ? (
              <div className="absolute right-4 top-3">
                <span className="inline-block text-3xl font-black italic leading-none tracking-tighter text-rose-500 drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:text-rose-400">
                  {bloodTypeBadge}
                </span>
              </div>
            ) : null}
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Ações da foto"
                  className="group relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-primary-200 bg-gray-50 transition-colors hover:border-primary-300 hover:bg-gray-100 dark:border-primary-900/40 dark:bg-gray-900/40 dark:hover:bg-gray-700"
                >
                  {resolvedAvatarSrc ? (
                    <img
                      src={resolvedAvatarSrc}
                      alt={studentDisplayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 text-center text-gray-400">
                      <CameraIcon className="h-8 w-8 text-primary-500 dark:text-primary-400" />
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        Adicionar foto
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <CameraIcon className="h-6 w-6" />
                      <span className="text-xs font-medium">Ações da foto</span>
                    </div>
                  </div>
                </button>
              }
              items={[
                ...(resolvedAvatarSrc
                  ? [
                      {
                        key: 'view-photo',
                        label: 'Visualizar foto',
                        onClick: () =>
                          window.open(
                            resolvedAvatarSrc,
                            '_blank',
                            'noopener,noreferrer',
                          ),
                      },
                    ]
                  : []),
                {
                  key: 'change-photo',
                  label: resolvedAvatarSrc ? 'Trocar foto' : 'Adicionar foto',
                  onClick: () => photoInputRef.current?.click(),
                },
                ...(resolvedAvatarSrc
                  ? [
                      {
                        key: 'delete-photo',
                        label: 'Excluir foto',
                        onClick: handleDeletePhoto,
                        color: 'danger' as const,
                      },
                    ]
                  : []),
              ]}
            />
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              {...photoRegister}
              ref={(element) => {
                photoRegister.ref(element);
                photoInputRef.current = element;
              }}
              onChange={handlePhotoChange}
            />

            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {studentDisplayName}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {studentSummary || 'xxx.xxx.xxx-xx'}
              </p>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 text-left px-4 py-3 rounded-r-lg text-sm font-medium transition-colors whitespace-nowrap border-l-4 ${
                    isActive
                      ? 'bg-primary-50/80 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 border-primary-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="min-w-0 flex-1 self-start rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="relative p-6 md:p-8 xl:p-10">
            <div className="w-full">
              {activeTab === 'pessoais' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={tabs[0]} />

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="md:col-span-2 lg:col-span-2">
                      <Input
                        label="Nome *"
                        {...register('firstName', {
                          required: 'Nome obrigatório',
                        })}
                        error={errors.firstName?.message as string}
                      />
                    </div>
                    <div className="md:col-span-1 lg:col-span-2">
                      <Input
                        label="Sobrenome *"
                        {...register('lastName', {
                          required: 'Sobrenome obrigatório',
                        })}
                        error={errors.lastName?.message as string}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input label="Nome Social" {...register('socialName')} />
                    </div>
                    <Input
                      label="Data de Nascimento *"
                      type="date"
                      {...register('birthDate', {
                        required: 'Data obrigatória',
                      })}
                      value={birthDate ?? ''}
                      onChange={(event) =>
                        setValue('birthDate', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      error={errors.birthDate?.message as string}
                    />
                    <Select
                      label="Sexo *"
                      options={genderOptions}
                      value={form.watch('gender') ?? Gender.NOT_INFORMED}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        form.setValue('gender', e.target.value as Gender, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      error={errors.gender?.message as string}
                    />
                    <MaskedInput
                      label="CPF"
                      mask={masks.cpf}
                      maskChar={null}
                      value={cpf ?? ''}
                      {...register('cpf')}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              )}

              {/* MATRICULA */}
              {activeTab === 'matricula' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={tabs[1]} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Matrícula"
                      {...register('registrationNumber')}
                      disabled
                      placeholder="Gerada automaticamente"
                    />
                    <Select
                      label="Situação"
                      options={situationOptions}
                      {...register('situacao')}
                      value={situacao ?? 'ATIVO'}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        setValue('situacao', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    {isDirector ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Escola
                        </label>
                        <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                          {availableInstitutions.find(
                            (institution) =>
                              institution.id === effectiveInstitutionId,
                          )?.name || 'Instituição vinculada ao diretor'}
                        </div>
                      </div>
                    ) : (
                      <Select
                        label="Escola *"
                        value={selectedInstitutionId || ''}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                          const nextInstitutionId = event.target.value;
                          const selectedInstitution =
                            availableInstitutions.find(
                              (institution) =>
                                institution.id === nextInstitutionId,
                            );
                          setValue('institutionId', nextInstitutionId, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue(
                            'institutionIds',
                            nextInstitutionId ? [nextInstitutionId] : [],
                            { shouldDirty: true, shouldValidate: true },
                          );
                          setValue('escola', selectedInstitution?.name ?? '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue('anoLetivo', '', { shouldDirty: true });
                          setValue('curso', '', { shouldDirty: true });
                          setValue('serie', '', { shouldDirty: true });
                          setValue('turma', '', { shouldDirty: true });
                          setValue('turmaId', '', { shouldDirty: true });
                        }}
                        error={errors.institutionId?.message as string}
                        disabled={isLoadingInstitutions}
                        options={[
                          { value: '', label: 'Selecione uma escola...' },
                          ...availableInstitutions.map((institution) => ({
                            value: institution.id,
                            label: institution.name,
                          })),
                        ]}
                      />
                    )}
                    <input
                      type="hidden"
                      {...register('institutionId', {
                        required: 'Obrigatório',
                      })}
                    />
                    <input type="hidden" {...register('escola')} />
                    <Select
                      label="Ano Letivo *"
                      options={[
                        {
                          value: '',
                          label: isLoadingAcademicYears
                            ? 'Carregando anos letivos...'
                            : 'Selecione o ano letivo',
                        },
                        ...(academicYearsData?.data ?? []).map((item) => ({
                          value: String(item.year),
                          label: item.name || String(item.year),
                        })),
                      ]}
                      value={selectedAcademicYearName ?? ''}
                      onChange={(event) => {
                        setValue('anoLetivo', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue('turma', '', { shouldDirty: true });
                        setValue('turmaId', '', { shouldDirty: true });
                      }}
                      disabled={
                        isLoadingAcademicYears || !effectiveInstitutionId
                      }
                    />
                    <Select
                      label="Curso *"
                      options={[
                        {
                          value: '',
                          label: isLoadingCourses
                            ? 'Carregando cursos...'
                            : 'Selecione o curso',
                        },
                        ...(coursesData?.data ?? []).map((item) => ({
                          value: item.name,
                          label: item.name,
                        })),
                      ]}
                      value={selectedCourseName ?? ''}
                      onChange={(event) => {
                        setValue('curso', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue('serie', '', { shouldDirty: true });
                        setValue('turma', '', { shouldDirty: true });
                        setValue('turmaId', '', { shouldDirty: true });
                      }}
                      disabled={isLoadingCourses || !effectiveInstitutionId}
                    />
                    <Select
                      label="Série/Ano *"
                      options={gradeOptions}
                      value={selectedGrade ?? ''}
                      onChange={(event) => {
                        setValue('serie', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue('turma', '', { shouldDirty: true });
                        setValue('turmaId', '', { shouldDirty: true });
                      }}
                      disabled={!selectedCourse?.id || isLoadingClasses}
                    />
                    <Select
                      label="Turma *"
                      options={classOptions}
                      value={selectedClassId ?? ''}
                      onChange={(event) => {
                        const nextClassId = event.target.value;
                        const nextClass = (classesData?.data ?? []).find(
                          (item) => item.id === nextClassId,
                        );
                        setValue('turmaId', nextClassId, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue('turma', nextClass?.name ?? '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        if (nextClass?.grade)
                          setValue('serie', nextClass.grade, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        if (nextClass?.shift)
                          setValue('turno', nextClass.shift, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                      }}
                      disabled={
                        !selectedAcademicYear?.id ||
                        !selectedCourse?.id ||
                        isLoadingClasses
                      }
                    />
                    <Select
                      label="Turno *"
                      options={[
                        ...classShiftOptions,
                        ...Array.from(
                          new Set(
                            (classesData?.data ?? [])
                              .map((item) => item.shift)
                              .filter(Boolean),
                          ),
                        )
                          .filter(
                            (shift) =>
                              !classShiftOptions.some(
                                (option) => option.value === shift,
                              ),
                          )
                          .map((shift) => ({
                            value: shift as string,
                            label: shift as string,
                          })),
                      ]}
                      value={selectedShift ?? ''}
                      onChange={(event) =>
                        setValue('turno', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <input
                      type="hidden"
                      {...register('anoLetivo', { required: 'Obrigatório' })}
                    />
                    <input
                      type="hidden"
                      {...register('curso', { required: 'Obrigatório' })}
                    />
                    <input
                      type="hidden"
                      {...register('serie', { required: 'Obrigatório' })}
                    />
                    <input
                      type="hidden"
                      {...register('turma', { required: 'Obrigatório' })}
                    />
                    <input type="hidden" {...register('turmaId')} />
                    <input
                      type="hidden"
                      {...register('turno', { required: 'Obrigatório' })}
                    />
                    <Input
                      label="Data da Matrícula *"
                      type="date"
                      {...register('dataMatricula', {
                        required: 'Obrigatório',
                      })}
                      value={
                        dataMatricula ?? new Date().toISOString().split('T')[0]
                      }
                      onChange={(event) =>
                        setValue('dataMatricula', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* ENDERECO */}
              {activeTab === 'endereco' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={tabs[2]} />
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <MaskedInput
                      label="CEP"
                      mask={masks.cep}
                      maskChar={null}
                      {...register('zipCode', {
                        onBlur: async () => {
                          await fillAddressFromCep();
                          await trigger([
                            'address',
                            'city',
                            'state',
                            'bairro',
                            'complemento',
                          ]);
                        },
                      })}
                      placeholder="00000-000"
                    />
                    <div className="md:col-span-2 lg:col-span-3">
                      <Input label="Logradouro" {...register('address')} />
                    </div>
                    <Input label="Número" {...register('numero')} />
                    <Input label="Complemento" {...register('complemento')} />
                    <Input label="Bairro" {...register('bairro')} />
                    <Input label="Cidade" {...register('city')} />
                    <Select
                      label="Estado"
                      options={[
                        { value: '', label: 'Selecione a UF' },
                        ...BRAZILIAN_UF_OPTIONS,
                      ]}
                      {...register('state')}
                      value={state ?? ''}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        setValue('state', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* CONTATO */}
              {activeTab === 'contato' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={tabs[3]} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 lg:col-span-1">
                      <Input
                        label="Email do Aluno"
                        type="email"
                        {...register('email')}
                      />
                    </div>
                    <MaskedInput
                      label="Celular"
                      mask={masks.phone}
                      maskChar={null}
                      {...register('phone')}
                      placeholder="(00) 0 0000-0000"
                    />
                    <MaskedInput
                      label="Telefone Fixo"
                      mask={masks.phone}
                      maskChar={null}
                      {...register('telefoneFixo')}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Nota: O login do aluno no sistema será feito com este email
                    e com uma senha padrão definida pela escola.
                  </p>
                </div>
              )}

              {/* RESPONSAVEIS */}
              {activeTab === 'responsaveis' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Responsáveis <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ao menos 1 responsável é obrigatório
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800 dark:hover:bg-primary-900/50"
                      leftIcon={<PlusIcon className="h-4 w-4" />}
                      onClick={() =>
                        setResponsaveis([...responsaveis, { id: Date.now() }])
                      }
                    >
                      Adicionar Responsável
                    </Button>
                  </div>

                  {responsaveis.map((resp: { id: number }, index: number) => {
                    const responsavelAtual = watchResponsaveis?.[index];
                    const relationship = String(
                      responsavelAtual?.parentesco ?? '',
                    );
                    const birthDateError = adultRequiredRelationships.has(
                      relationship,
                    )
                      ? (value: string) => {
                          if (!value) {
                            return 'Informe a data de nascimento para confirmar que é maior de 18 anos.';
                          }

                          return hasMinimumAge(value, 18)
                            ? true
                            : 'Este parentesco exige que o responsável tenha 18 anos ou mais.';
                        }
                      : undefined;
                    const emailObrigatorio = Boolean(
                      responsavelAtual?.financeiro &&
                      responsavelAtual?.podeRetirar,
                    );
                    const emailPlaceholder = emailObrigatorio
                      ? 'Obrigatório quando for financeiro e puder retirar o aluno'
                      : 'Opcional se for apenas responsável por retirar o aluno';

                    return (
                      <div
                        key={resp.id}
                        className="bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 relative shadow-sm hover:shadow-md transition-shadow"
                      >
                        {responsaveis.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setResponsaveis(
                                responsaveis.filter(
                                  (r: { id: number }) => r.id !== resp.id,
                                ),
                              )
                            }
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                        <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                          Responsável {index + 1}
                          {index === 0 && (
                            <span className="ml-2 text-xs font-normal text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Input
                              label="Nome completo *"
                              {...register(`responsaveis.${index}.nome`, {
                                required: 'Nome do responsável é obrigatório',
                              })}
                            />
                          </div>
                          <Select
                            label="Parentesco *"
                            options={[
                              { value: '', label: 'Selecione o parentesco' },
                              ...responsibleRelationshipOptions,
                            ]}
                            {...register(`responsaveis.${index}.parentesco`, {
                              required: 'Selecione o parentesco',
                            })}
                            value={relationship}
                            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                              setValue(
                                `responsaveis.${index}.parentesco`,
                                event.target.value,
                                { shouldDirty: true, shouldValidate: true },
                              )
                            }
                            error={
                              (errors.responsaveis as any)?.[index]?.parentesco
                                ?.message as string
                            }
                          />
                          <Input
                            label="Data de nascimento"
                            type="date"
                            {...register(
                              `responsaveis.${index}.dataNascimento`,
                              { validate: birthDateError },
                            )}
                            value={String(
                              responsavelAtual?.dataNascimento ?? '',
                            )}
                            onChange={(event) =>
                              setValue(
                                `responsaveis.${index}.dataNascimento`,
                                event.target.value,
                                { shouldDirty: true, shouldValidate: true },
                              )
                            }
                            error={
                              (errors.responsaveis as any)?.[index]
                                ?.dataNascimento?.message as string
                            }
                            helperText={
                              adultRequiredRelationships.has(relationship)
                                ? 'Obrigatória para irmão, irmã, primo ou prima e deve indicar 18 anos ou mais.'
                                : undefined
                            }
                          />
                          <MaskedInput
                            label="CPF"
                            mask={masks.cpf}
                            maskChar={null}
                            {...register(`responsaveis.${index}.cpf`)}
                          />
                          <Input
                            label={emailObrigatorio ? 'Email *' : 'Email'}
                            id={`responsavel-email-${index}`}
                            type="email"
                            {...register(`responsaveis.${index}.email`, {
                              validate: (value) => {
                                const responsavel = getValues(
                                  `responsaveis.${index}`,
                                );
                                const isRequired = Boolean(
                                  responsavel?.financeiro &&
                                  responsavel?.podeRetirar,
                                );
                                const normalizedValue = String(
                                  value ?? '',
                                ).trim();

                                if (isRequired && !normalizedValue) {
                                  return 'Email obrigatório para responsável financeiro que pode retirar o aluno';
                                }

                                if (
                                  normalizedValue &&
                                  !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                                    normalizedValue,
                                  )
                                ) {
                                  return 'Informe um email válido';
                                }

                                return true;
                              },
                            })}
                            placeholder={emailPlaceholder}
                            error={
                              (errors.responsaveis as any)?.[index]?.email
                                ?.message as string
                            }
                          />
                          <MaskedInput
                            label="Celular *"
                            mask={masks.phone}
                            maskChar={null}
                            {...register(`responsaveis.${index}.celular`, {
                              required: true,
                            })}
                            placeholder="(00) 0 0000-0000"
                          />
                          <MaskedInput
                            label="WhatsApp"
                            mask={masks.phone}
                            maskChar={null}
                            {...register(`responsaveis.${index}.whatsapp`)}
                            placeholder="(00) 0 0000-0000"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                            <input
                              type="checkbox"
                              {...register(`responsaveis.${index}.financeiro`)}
                              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Resp. Financeiro
                            </span>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                            <input
                              type="checkbox"
                              {...register(
                                `responsaveis.${index}.notificacoes`,
                              )}
                              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Recebe Notificações
                            </span>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                            <input
                              type="checkbox"
                              {...register(`responsaveis.${index}.podeRetirar`)}
                              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Pode Retirar Aluno
                            </span>
                          </label>
                          <label className="sm:col-span-3 flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                            <input
                              type="checkbox"
                              {...register(
                                `responsaveis.${index}.contatoEmergencia`,
                              )}
                              checked={Boolean(
                                responsavelAtual?.contatoEmergencia,
                              )}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                const currentCount = (
                                  watchResponsaveis ?? []
                                ).filter(
                                  (item: any, itemIndex: number) =>
                                    itemIndex !== index &&
                                    Boolean(item?.contatoEmergencia),
                                ).length;

                                if (checked && currentCount >= 2) {
                                  toast.error(
                                    'O aluno pode ter no máximo dois contatos de emergência.',
                                  );
                                  return;
                                }

                                setValue(
                                  `responsaveis.${index}.contatoEmergencia`,
                                  checked,
                                  { shouldDirty: true, shouldValidate: true },
                                );
                                const nextContacts = (watchResponsaveis ?? [])
                                  .map((item: any, itemIndex: number) =>
                                    itemIndex === index
                                      ? { ...item, contatoEmergencia: checked }
                                      : item,
                                  )
                                  .filter(
                                    (item: any) =>
                                      item?.contatoEmergencia &&
                                      item?.nome?.trim(),
                                  )
                                  .map((item: any) => String(item.nome).trim());
                                setValue(
                                  'contatoEmergencia',
                                  nextContacts.join(' | '),
                                  { shouldDirty: true, shouldValidate: true },
                                );
                              }}
                              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Contato de emergência
                            </span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SAUDE */}
              {activeTab === 'saude' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={tabs[5]} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Tipo Sanguíneo"
                      options={[
                        { value: 'A+', label: 'A+' },
                        { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' },
                        { value: 'B-', label: 'B-' },
                        { value: 'AB+', label: 'AB+' },
                        { value: 'AB-', label: 'AB-' },
                        { value: 'O+', label: 'O+' },
                        { value: 'O-', label: 'O-' },
                        { value: 'NAO_INFORMADO', label: 'Não informado' },
                      ]}
                      {...register('tipoSanguineo')}
                      value={bloodType ?? 'NAO_INFORMADO'}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        setValue('tipoSanguineo', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <div className="md:col-span-2">
                      <TagInput
                        label="Convênio Médico"
                        value={parseStudentTagList(watch('convenioMedico'))}
                        onChange={(value) =>
                          setValue('convenioMedico', value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        placeholder="Ex.: Unimed, SulAmérica..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <TagInput
                        label="Alergias"
                        value={parseStudentTagList(watch('alergias'))}
                        onChange={(value) =>
                          setValue('alergias', value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        placeholder="Ex.: Dipirona, poeira..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <TagInput
                        label="Medicamentos de uso contínuo"
                        value={parseStudentTagList(watch('medicamentos'))}
                        onChange={(value) =>
                          setValue('medicamentos', value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        placeholder="Ex.: Dipirona"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <TagInput
                        label="Necessidades especiais"
                        value={parseStudentTagList(
                          watch('necessidadesEspeciais'),
                        )}
                        onChange={(value) =>
                          setValue('necessidadesEspeciais', value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        placeholder="Informe uma necessidade"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <TagInput
                        label="Restrições alimentares"
                        value={parseStudentTagList(
                          watch('restricoesAlimentares'),
                        )}
                        onChange={(value) =>
                          setValue('restricoesAlimentares', value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        placeholder="Ex.: lactose, amendoim..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contatos de emergência (até 2)
                      </p>
                      {emergencyContacts.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                          Marque um responsável como contato de emergência na
                          aba “Responsáveis”.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {emergencyContacts.map((contact) => (
                            <div
                              key={contact.index}
                              className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-900/50 dark:bg-green-900/20"
                            >
                              <span className="font-medium text-green-800 dark:text-green-200">
                                {contact.name}
                              </span>
                              <span className="text-green-700 dark:text-green-300">
                                {contact.phone || 'Telefone não informado'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Os responsáveis marcados serão salvos automaticamente
                          neste campo de saúde.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push('/admin/users/new?role=PARENT')
                          }
                          leftIcon={<PlusIcon className="h-4 w-4" />}
                        >
                          Adicionar novo responsável
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSPORTE */}
              {activeTab === 'transporte' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={tabs[6]} />

                  <label className="flex items-center gap-2 mb-4 cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 w-max">
                    <input
                      type="checkbox"
                      {...register('usaTransporte')}
                      className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Utiliza transporte escolar
                    </span>
                  </label>

                  {usaTransporte && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300 p-4 border border-primary-100 bg-primary-50/50 dark:border-primary-900/30 dark:bg-primary-900/10 rounded-lg">
                      <Select
                        label="Tipo de Transporte"
                        options={[
                          { value: 'PRIVADO', label: 'Van/Ônibus Privado' },
                          { value: 'PUBLICO', label: 'Transporte Público' },
                          { value: 'PROPRIO', label: 'Próprio' },
                        ]}
                        {...register('tipoTransporte')}
                        value={tipoTransporte ?? ''}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          setValue('tipoTransporte', event.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      <Input
                        label="Empresa/Viação"
                        {...register('empresaTransporte')}
                      />
                      <Input
                        label="Nome do Motorista"
                        {...register('motoristaTransporte')}
                      />
                      <Input
                        label="Rota/Linha"
                        {...register('rotaTransporte')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTOS */}
              {activeTab === 'documentos' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={tabs[7]} />
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={handleDocumentInputChange}
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openPendingDocumentsPicker()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openPendingDocumentsPicker();
                      }
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDocumentDropActive(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDocumentDropActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDocumentDropActive(false);
                    }}
                    onDrop={handleDocumentDrop}
                    className={`p-8 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
                      isDocumentDropActive
                        ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="mx-auto flex justify-center mb-4 text-gray-400">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                      Clique para fazer upload ou arraste os arquivos
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG (Max 5MB por arquivo)
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                    {hasLocalDocuments
                      ? mode === 'create'
                        ? 'Os documentos selecionados serao enviados assim que o aluno for salvo.'
                        : 'Os documentos marcados como selecionados serao enviados ao salvar as alteracoes.'
                      : 'Clique em um documento pendente para anexar diretamente ou use a area acima para escolher entre os pendentes.'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {resolvedDocuments.map((document) => {
                      const isUploaded =
                        document.status === 'UPLOADED' &&
                        Boolean(document.path);
                      const isLocal =
                        document.status === 'LOCAL' && Boolean(document.file);

                      return (
                        <button
                          key={document.key}
                          type="button"
                          onClick={() => handleExistingDocumentAction(document)}
                          className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                        >
                          <div className="min-w-0">
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {document.label}
                            </span>
                            {document.fileName ? (
                              <span className="mt-1 block truncate text-xs text-gray-500 dark:text-gray-400">
                                {document.fileName}
                              </span>
                            ) : null}
                          </div>
                          <span
                            className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
                              isUploaded
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : isLocal
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}
                          >
                            {isUploaded
                              ? 'Enviado'
                              : isLocal
                                ? 'Selecionado'
                                : 'Pendente'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'acesso' && activeAccessTab && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={activeAccessTab} />
                  {mode === 'create' ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Primeiro acesso
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {resolvedInitialPassword
                            ? 'Se for o primeiro login do aluno, você pode preencher a senha inicial automaticamente com o início do email.'
                            : 'Informe o email do aluno para liberar o preenchimento automático da senha inicial.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={!resolvedInitialPassword}
                            onClick={() => {
                              if (!resolvedInitialPassword) return;
                              setValue('password', resolvedInitialPassword, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }}
                          >
                            É o primeiro acesso? Preencher senha
                          </Button>
                          {resolvedInitialPassword ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Senha sugerida:{' '}
                              <strong>{resolvedInitialPassword}</strong>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                        <Input
                          label="Senha inicial"
                          type="text"
                          value={password ?? ''}
                          onChange={(event) =>
                            setValue('password', event.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          placeholder="Clique no botão para preencher automaticamente"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No primeiro login, o aluno poderá trocar essa senha
                          depois de acessar a conta.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {passwordField ?? (
                        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                          A redefinição de senha fica disponível apenas para o
                          Super Admin na edição do aluno.
                        </div>
                      )}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                        <p className="text-sm font-semibold text-amber-900">
                          Alteração sensível
                        </p>
                        <p className="mt-2 text-sm text-amber-800">
                          Ao salvar a nova senha, o aluno passará a acessar o
                          sistema com a credencial redefinida.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'observacoes' && activeObservationTab && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TabHeader tab={activeObservationTab} />

                  {mode === 'create' ? (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                      As observações ficam disponíveis após salvar o aluno pela
                      primeira vez.
                    </div>
                  ) : !studentProfileId ? (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                      O perfil do aluno ainda não está pronto para receber
                      observações.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Histórico de anotações
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Registre observações sobre o aluno e acompanhe o
                            histórico com autor e data.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleStartNewObservation}
                          disabled={!canManageObservations}
                          leftIcon={<PlusIcon className="h-4 w-4" />}
                        >
                          Adicionar anotação
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-5">
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                          {isLoadingObservations ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Carregando observações...
                            </p>
                          ) : observations.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Nenhuma anotação registrada para este aluno.
                            </p>
                          ) : (
                            observations.map((observation) => (
                              <button
                                key={observation.id}
                                type="button"
                                onClick={() =>
                                  setSelectedObservationId(observation.id)
                                }
                                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                                  selectedObservationId === observation.id
                                    ? 'border-primary-300 bg-primary-50/80 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {observation.title}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {getObservationAuthor(observation)}
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatObservationDate(
                                      observation.date ?? observation.createdAt,
                                    )}
                                  </span>
                                </div>
                                <p className="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                                  {observation.description}
                                </p>
                              </button>
                            ))
                          )}
                        </div>

                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                          {selectedObservationId === null &&
                          observations.length > 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                              Selecione uma anotação da lista para visualizar a
                              mensagem completa.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  label="Título da anotação"
                                  value={observationDraft.title}
                                  onChange={(event) =>
                                    setObservationDraft((current) => ({
                                      ...current,
                                      title: event.target.value,
                                    }))
                                  }
                                  placeholder="Ex.: Evolução pedagógica"
                                />
                                <Select
                                  label="Tipo"
                                  value={observationDraft.type}
                                  onChange={(
                                    event: ChangeEvent<HTMLSelectElement>,
                                  ) =>
                                    setObservationDraft((current) => ({
                                      ...current,
                                      type: event.target
                                        .value as StudentObservationType,
                                    }))
                                  }
                                  options={observationTypeOptions}
                                />
                              </div>

                              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  <span>
                                    Autor:{' '}
                                    {selectedObservation
                                      ? getObservationAuthor(
                                          selectedObservation,
                                        )
                                      : currentUser?.firstName ||
                                        currentUser?.email ||
                                        'Você'}
                                  </span>
                                  <span>
                                    Data:{' '}
                                    {formatObservationDate(
                                      selectedObservation?.date ??
                                        selectedObservation?.createdAt ??
                                        new Date().toISOString(),
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Mensagem
                                </label>
                                <textarea
                                  value={observationDraft.description}
                                  onChange={(event) =>
                                    setObservationDraft((current) => ({
                                      ...current,
                                      description: event.target.value,
                                    }))
                                  }
                                  className="w-full h-48 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                  placeholder="Escreva a observação sobre o aluno..."
                                />
                              </div>

                              <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={observationDraft.isPrivate}
                                  onChange={(event) =>
                                    setObservationDraft((current) => ({
                                      ...current,
                                      isPrivate: event.target.checked,
                                    }))
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  Observação privada
                                </span>
                              </label>

                              <div className="flex flex-wrap justify-end gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    setSelectedObservationId(
                                      observations[0]?.id ?? null,
                                    )
                                  }
                                  disabled={
                                    createObservationMutation.isPending ||
                                    updateObservationMutation.isPending
                                  }
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handlePersistObservation}
                                  disabled={!canManageObservations}
                                  isLoading={
                                    createObservationMutation.isPending ||
                                    updateObservationMutation.isPending
                                  }
                                >
                                  Salvar anotação
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navegação entre etapas */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToTab(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                >
                  Anterior
                </Button>
                <Button
                  type={activeIndex === tabs.length - 1 ? 'submit' : 'button'}
                  onClick={() => {
                    if (activeIndex < tabs.length - 1) {
                      goToTab(activeIndex + 1);
                    }
                  }}
                  rightIcon={
                    activeIndex < tabs.length - 1 ? (
                      <ArrowRightIcon className="h-4 w-4" />
                    ) : undefined
                  }
                >
                  {activeIndex === tabs.length - 1 ? 'Salvar' : 'Próximo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AvatarCropModal
        isOpen={isCropModalOpen}
        file={pendingPhotoFile}
        onCancel={() => {
          setIsCropModalOpen(false);
          setPendingPhotoFile(null);
        }}
        onConfirm={(nextFile) => {
          setValue('photo', [nextFile] as any, {
            shouldDirty: true,
            shouldValidate: true,
          });
          setIsCropModalOpen(false);
          setPendingPhotoFile(null);
          if (photoInputRef.current) photoInputRef.current.value = '';
        }}
      />

      <Modal
        isOpen={isDocumentPickerOpen}
        onClose={() => {
          setIsDocumentPickerOpen(false);
          setQueuedDocumentFile(null);
        }}
        title="Selecionar documento"
        description={
          pendingDocuments.length > 0
            ? 'Escolha qual documento pendente voce deseja anexar.'
            : 'Todos os documentos obrigatorios ja foram anexados. Escolha um item para substituir o arquivo atual.'
        }
        size="lg"
      >
        <div className="space-y-4">
          {queuedDocumentFile ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
              Arquivo pronto para vincular:{' '}
              <strong>{queuedDocumentFile.name}</strong>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {documentOptionsForPicker.map((document) => (
              <button
                key={document.key}
                type="button"
                onClick={() => openDocumentBrowserFor(document.key)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
              >
                <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                  {document.label}
                </span>
                <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
                  {!document.path && !document.file
                    ? 'Pendente'
                    : 'Substituir arquivo'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedUploadedDocument)}
        onClose={() => {
          if (documentActionLoading) return;
          setSelectedUploadedDocument(null);
        }}
        title={selectedUploadedDocument?.label ?? 'Anexo enviado'}
        description={
          selectedUploadedDocument?.fileName
            ? `Arquivo enviado: ${selectedUploadedDocument.fileName}`
            : 'Escolha o que deseja fazer com este anexo.'
        }
        size="sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleViewUploadedDocument}
            disabled={documentActionLoading !== null}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {documentActionLoading === 'view' ? 'Abrindo...' : 'Visualizar'}
          </button>

          <button
            type="button"
            onClick={handleDownloadUploadedDocument}
            disabled={documentActionLoading !== null}
            className="inline-flex items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-950/50"
          >
            {documentActionLoading === 'download' ? 'Baixando...' : 'Baixar'}
          </button>
        </div>
      </Modal>
    </>
  );
}
