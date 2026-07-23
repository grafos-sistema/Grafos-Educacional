'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { UseFormReturn, useWatch } from 'react-hook-form';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CameraIcon,
  CheckCircleIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MaskedInput, masks, removeMask, validateCPF } from '@/components/ui/MaskedInput';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/HeroDropdown';
import { supabase } from '@/lib/supabase';
import { Gender, UserRole } from '@/types/user.types';

export interface InstitutionOption {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
}

type StepDefinition = {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
};

type StudentLink = {
  studentId: string;
  studentUserId: string;
  studentName: string;
  relationship: string;
  isPrimary: boolean;
  notificacoes: boolean;
  podeRetirar: boolean;
};

interface StudentOption {
  studentId: string;
  userId: string;
  label: string;
  registrationNumber?: string;
  institutionId?: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code?: string | null;
  institutionId: string;
}

interface TeacherClassSummary {
  id: string;
  classId: string;
  subjectId: string;
  weeklyHours?: number;
  class: {
    id: string;
    name: string;
    grade: string;
    section?: string;
    shift?: string;
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
}

interface RoleBasedUserWizardProps {
  form: UseFormReturn<any>;
  mode: 'create' | 'edit';
  availableInstitutions: InstitutionOption[];
  isLoadingInstitutions?: boolean;
  roleOptions: Array<{ value: string; label: string }>;
  selectedPrimaryInstitutionId: string;
  selectedAdditionalInstitutionIds: string[];
  onPrimaryInstitutionChange: (institutionId: string) => void;
  onToggleAdditionalInstitution: (institutionId: string) => void;
  passwordField?: React.ReactNode;
  isRoleLocked?: boolean;
  teacherClasses?: TeacherClassSummary[];
  isLoadingTeacherClasses?: boolean;
}

const genderOptions = [
  { value: Gender.MALE, label: 'Masculino' },
  { value: Gender.FEMALE, label: 'Feminino' },
  { value: Gender.OTHER, label: 'Outro' },
  { value: Gender.NOT_INFORMED, label: 'Não informado' },
];

const relationshipOptions = [
  { value: 'Mãe', label: 'Mãe' },
  { value: 'Pai', label: 'Pai' },
  { value: 'Responsável Legal', label: 'Responsável Legal' },
  { value: 'Avó/Avô', label: 'Avó/Avô' },
  { value: 'Outro', label: 'Outro' },
];

const subjectCache = new Map<string, SubjectOption[]>();
const studentCache = new Map<string, StudentOption[]>();

function buildSteps(role?: UserRole, mode: 'create' | 'edit' = 'create'): StepDefinition[] {
  if (role === UserRole.TEACHER) {
    const teacherSteps: StepDefinition[] = [
      { id: 'identity', label: 'Dados Pessoais', subtitle: 'Identificação do professor', icon: IdentificationIcon },
      { id: 'contact', label: 'Contato', subtitle: 'Endereço e contatos', icon: MapPinIcon },
      { id: 'profile', label: 'Dados Profissionais', subtitle: 'Formação e registro', icon: BriefcaseIcon },
      { id: 'institution', label: 'Instituição', subtitle: 'Escolas em que atua', icon: BuildingOffice2Icon },
      { id: 'subjects', label: 'Disciplinas', subtitle: 'Disciplinas que leciona', icon: AcademicCapIcon },
      { id: 'classes', label: 'Turmas', subtitle: 'Turmas em que atua', icon: UserGroupIcon },
    ];

    if (mode === 'edit') {
      teacherSteps.push({
        id: 'access',
        label: 'Acesso',
        subtitle: 'Redefinição de senha',
        icon: ShieldCheckIcon,
      });
    }

    return teacherSteps;
  }

  if (role === UserRole.COORDINATOR) {
    return [
      { id: 'identity', label: 'Dados Pessoais', subtitle: 'Identificação do coordenador', icon: IdentificationIcon },
      { id: 'contact', label: 'Contato', subtitle: 'Endereço e contatos', icon: MapPinIcon },
      { id: 'institution', label: 'Instituição', subtitle: 'Instituições vinculadas', icon: BuildingOffice2Icon },
      { id: 'access', label: 'Acesso', subtitle: 'Redefinição de senha', icon: ShieldCheckIcon },
    ];
  }

  if (role === UserRole.PARENT) {
    return [
      { id: 'identity', label: 'Dados Pessoais', subtitle: 'Informações do responsável', icon: IdentificationIcon },
      { id: 'contact', label: 'Contato', subtitle: 'Contato e endereço', icon: MapPinIcon },
      { id: 'institution', label: 'Instituição', subtitle: 'Instituições relacionadas', icon: BuildingOffice2Icon },
      { id: 'students', label: 'Vínculo com Alunos', subtitle: 'Alunos e permissões', icon: UserGroupIcon },
      { id: 'access', label: 'Acesso', subtitle: 'Redefinição de senha', icon: EnvelopeIcon },
    ];
  }

  return [
    { id: 'identity', label: 'Dados Pessoais', subtitle: 'Informações básicas do perfil', icon: IdentificationIcon },
    { id: 'contact', label: 'Contato', subtitle: 'Contato e endereço', icon: MapPinIcon },
    { id: 'institution', label: 'Instituição', subtitle: 'Instituições vinculadas', icon: BuildingOffice2Icon },
    { id: 'access', label: 'Acesso', subtitle: 'Redefinição de senha', icon: ShieldCheckIcon },
  ];
}

function TabHeader({ step }: { step: StepDefinition }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.label}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.subtitle}</p>
      </div>
    </div>
  );
}

function institutionLocation(institution: InstitutionOption) {
  return [institution.city, institution.state].filter(Boolean).join(' - ');
}

export function RoleBasedUserWizard({
  form,
  mode,
  availableInstitutions,
  isLoadingInstitutions = false,
  roleOptions,
  selectedPrimaryInstitutionId,
  selectedAdditionalInstitutionIds,
  onPrimaryInstitutionChange,
  onToggleAdditionalInstitution,
  passwordField,
  isRoleLocked = false,
  teacherClasses = [],
  isLoadingTeacherClasses = false,
}: RoleBasedUserWizardProps) {
  const [activeStepId, setActiveStepId] = useState('identity');
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [isLoadingDynamicOptions, setIsLoadingDynamicOptions] = useState(false);
  const [institutionSearchTerm, setInstitutionSearchTerm] = useState('');
  const { register, setValue, control, formState: { errors } } = form;

  const role = useWatch({ control, name: 'role' }) as UserRole | undefined;
  const firstName = useWatch({ control, name: 'firstName' }) as string | undefined;
  const lastName = useWatch({ control, name: 'lastName' }) as string | undefined;
  const email = useWatch({ control, name: 'email' }) as string | undefined;
  const cpf = useWatch({ control, name: 'cpf' }) as string | undefined;
  const birthDate = useWatch({ control, name: 'birthDate' }) as string | undefined;
  const isActive = useWatch({ control, name: 'isActive' }) as boolean | undefined;
  const avatar = useWatch({ control, name: 'avatar' }) as string | undefined;
  const photo = useWatch({ control, name: 'photo' }) as FileList | File[] | undefined;
  const selectedSubjects = (useWatch({ control, name: 'subjectIds' }) as string[] | undefined) ?? [];
  const linkedStudents = (useWatch({ control, name: 'linkedStudents' }) as StudentLink[] | undefined) ?? [];
  const generatedInitialPassword = useMemo(() => {
    if (!email) return '';
    const [localPart] = email.trim().toLowerCase().split('@');
    return localPart ? `${localPart}@Grafos` : '';
  }, [email]);
  const profileDisplayName =
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    (role === UserRole.COORDINATOR ? 'Novo coordenador' : 'Novo professor');
  const profileSummary = cpf?.trim() || '';

  const selectedInstitutionIds = useMemo(
    () => Array.from(new Set([selectedPrimaryInstitutionId, ...selectedAdditionalInstitutionIds].filter(Boolean))),
    [selectedAdditionalInstitutionIds, selectedPrimaryInstitutionId]
  );

  const steps = useMemo(() => buildSteps(role, mode), [mode, role]);
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId));
  const activeStep = steps[activeIndex] ?? steps[0];
  const searchableInstitutions = useMemo(() => {
    const term = institutionSearchTerm.trim().toLowerCase();
    return availableInstitutions.filter((institution) => {
      const haystack = [institution.name, institution.city, institution.state, institution.slug]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [availableInstitutions, institutionSearchTerm]);
  const institutionCards = useMemo(() => {
    const selected = searchableInstitutions.filter(
      (institution) =>
        institution.id === selectedPrimaryInstitutionId || selectedAdditionalInstitutionIds.includes(institution.id)
    );
    const unselected = searchableInstitutions.filter(
      (institution) =>
        institution.id !== selectedPrimaryInstitutionId && !selectedAdditionalInstitutionIds.includes(institution.id)
    );
    return [...selected, ...unselected];
  }, [searchableInstitutions, selectedAdditionalInstitutionIds, selectedPrimaryInstitutionId]);
  const selectedPhotoFile = useMemo(() => {
    if (!photo) return null;
    if (typeof FileList !== 'undefined' && photo instanceof FileList) {
      return photo.item(0);
    }
    return Array.isArray(photo) ? photo[0] ?? null : null;
  }, [photo]);
  const photoPreviewUrl = useMemo(() => {
    if (selectedPhotoFile) {
      return URL.createObjectURL(selectedPhotoFile);
    }
    return avatar ?? null;
  }, [avatar, selectedPhotoFile]);

  useEffect(() => {
    setActiveStepId(steps[0]?.id ?? 'identity');
  }, [steps]);

  useEffect(() => {
    return () => {
      if (selectedPhotoFile && photoPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl, selectedPhotoFile]);

  useEffect(() => {
    const loadOptions = async () => {
      if (role !== UserRole.TEACHER && role !== UserRole.PARENT) {
        setSubjectOptions([]);
        setStudentOptions([]);
        return;
      }

      const cacheKey = selectedInstitutionIds.slice().sort().join('|') || 'all';
      setIsLoadingDynamicOptions(true);

      try {
        if (role === UserRole.TEACHER) {
          const cachedSubjects = subjectCache.get(cacheKey);
          if (cachedSubjects) {
            setSubjectOptions(cachedSubjects);
          } else {
            const { data, error } = await supabase
              .from('subjects')
              .select('id, name, code, institutionId')
              .in('institutionId', selectedInstitutionIds.length > 0 ? selectedInstitutionIds : [''])
              .eq('isActive', true)
              .order('name', { ascending: true });

            if (error) throw error;
            const normalized = (data ?? []) as SubjectOption[];
            subjectCache.set(cacheKey, normalized);
            setSubjectOptions(normalized);
          }
        }

        if (role === UserRole.PARENT) {
          const cachedStudents = studentCache.get(cacheKey);
          if (cachedStudents) {
            setStudentOptions(cachedStudents);
          } else {
            const { data, error } = await supabase
              .from('students')
              .select('id, registrationNumber, user:users!inner(id, firstName, lastName, institutionId, isActive)')
              .order('createdAt', { ascending: false });

            if (error) throw error;

            const normalized = (data ?? [])
              .map((row: any) => ({
                studentId: row.id as string,
                userId: row.user?.id as string,
                label: `${row.user?.firstName ?? ''} ${row.user?.lastName ?? ''}`.trim(),
                registrationNumber: row.registrationNumber ?? undefined,
                institutionId: row.user?.institutionId ?? undefined,
                isActive: row.user?.isActive ?? true,
              }))
              .filter((row) => row.userId && row.label && row.isActive)
              .filter((row) => selectedInstitutionIds.length === 0 || selectedInstitutionIds.includes(row.institutionId ?? ''));

            studentCache.set(cacheKey, normalized);
            setStudentOptions(normalized);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar opcoes do wizard de usuario:', error);
      } finally {
        setIsLoadingDynamicOptions(false);
      }
    };

    loadOptions();
  }, [role, selectedInstitutionIds]);

  const pendencias = useMemo(() => {
    const items: string[] = [];
    if (!firstName || !lastName) items.push('Preencher nome e sobrenome.');
    if (!email) items.push('Informar email de acesso.');
    if (!selectedPrimaryInstitutionId) items.push('Definir a instituição principal.');
    if (role === UserRole.TEACHER && selectedSubjects.length === 0) items.push('Vincular ao menos uma disciplina.');
    if (role === UserRole.PARENT && linkedStudents.length === 0) items.push('Vincular ao menos um aluno.');
    return items;
  }, [email, firstName, lastName, linkedStudents.length, role, selectedPrimaryInstitutionId, selectedSubjects.length]);

  const status = pendencias.length === 0 ? 'Pronto para uso' : pendencias.length <= 2 ? 'Incompleto' : 'Cadastrado';

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setActiveStepId(steps[index].id);
  };

  const toggleSubject = (subjectId: string) => {
    const next = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter((id) => id !== subjectId)
      : [...selectedSubjects, subjectId];
    setValue('subjectIds', next, { shouldDirty: true, shouldValidate: true });
  };

  const toggleLinkedStudent = (student: StudentOption) => {
    const exists = linkedStudents.find((item) => item.studentId === student.studentId);
    const next = exists
      ? linkedStudents.filter((item) => item.studentId !== student.studentId)
      : [
          ...linkedStudents,
          {
            studentId: student.studentId,
            studentUserId: student.userId,
            studentName: student.label,
            relationship: 'Responsável Legal',
            isPrimary: linkedStudents.length === 0,
            notificacoes: true,
            podeRetirar: false,
          },
        ];

    setValue('linkedStudents', next, { shouldDirty: true, shouldValidate: true });
  };

  const updateLinkedStudent = (studentId: string, field: keyof StudentLink, value: string | boolean) => {
    const next = linkedStudents.map((item) => item.studentId === studentId ? { ...item, [field]: value } : item);
    setValue('linkedStudents', next, { shouldDirty: true, shouldValidate: true });
  };

  const toggleInstitutionSelection = (institutionId: string) => {
    const isPrimary = institutionId === selectedPrimaryInstitutionId;
    const isAdditional = selectedAdditionalInstitutionIds.includes(institutionId);

    if (isPrimary) {
      const fallbackInstitutionId = selectedAdditionalInstitutionIds[0];
      if (fallbackInstitutionId) {
        onPrimaryInstitutionChange(fallbackInstitutionId);
      } else {
        onPrimaryInstitutionChange('');
      }
      return;
    }

    if (isAdditional) {
      onToggleAdditionalInstitution(institutionId);
      return;
    }

    onToggleAdditionalInstitution(institutionId);
  };

  const defineInstitutionAsPrimary = (institutionId: string) => {
    if (institutionId === selectedPrimaryInstitutionId) return;

    const currentPrimaryInstitutionId = selectedPrimaryInstitutionId;

    if (!selectedAdditionalInstitutionIds.includes(institutionId)) {
      onToggleAdditionalInstitution(institutionId);
    }

    if (currentPrimaryInstitutionId && currentPrimaryInstitutionId !== institutionId) {
      onToggleAdditionalInstitution(currentPrimaryInstitutionId);
    }

    onPrimaryInstitutionChange(institutionId);
  };

  return (
    <div className="flex flex-col gap-8 pt-2 pb-4 md:flex-row md:items-start">
      <div className="w-full md:w-[248px] shrink-0 flex flex-col gap-5">
        {(role === UserRole.TEACHER || role === UserRole.COORDINATOR) && (
          <div className="relative flex flex-col items-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-6 shadow-sm">
            <label className="group relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-primary-200 bg-gray-50 transition-colors hover:border-primary-300 hover:bg-gray-100 dark:border-primary-900/40 dark:bg-gray-900/40 dark:hover:bg-gray-700">
              {photoPreviewUrl ? (
                <Image
                  src={photoPreviewUrl}
                  alt={profileDisplayName}
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                  unoptimized={photoPreviewUrl.startsWith('blob:')}
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
                  <span className="text-xs font-medium">Trocar foto</span>
                </div>
              </div>

              <input type="file" accept="image/png,image/jpeg" className="hidden" {...register('photo')} />
            </label>

            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{profileDisplayName}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {profileSummary || 'xxx.xxx.xxx-xx'}
              </p>
            </div>
          </div>
        )}

        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep.id === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepId(step.id)}
                className={`flex items-center gap-3 text-left px-4 py-3 rounded-r-lg text-sm font-medium transition-colors whitespace-nowrap border-l-4 ${
                  isActive
                    ? 'bg-primary-50/80 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 border-primary-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                {step.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
        <div className="flex-1 p-6 md:p-8 xl:p-10">
          <div className="w-full">
            {activeStep.id === 'identity' && (
              <div>
                <TabHeader step={activeStep} />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {!isRoleLocked && (
                    <div className="md:col-span-7 xl:col-span-8">
                      <Select
                        label="Perfil *"
                        options={roleOptions}
                        {...register('role', { required: 'Perfil é obrigatório' })}
                        error={errors.role?.message as string}
                        required
                      />
                    </div>
                  )}
                  <div className="md:col-span-6">
                    <Input label="Nome *" {...register('firstName', { required: 'Nome obrigatório' })} error={errors.firstName?.message as string} />
                  </div>
                  <div className="md:col-span-6">
                    <Input label="Sobrenome *" {...register('lastName', { required: 'Sobrenome obrigatório' })} error={errors.lastName?.message as string} />
                  </div>
                  <div className="md:col-span-6">
                    <Input label="Nome Social" {...register('socialName')} />
                  </div>
                  <div className="md:col-span-3">
                    <Input label="Data de Nascimento" type="date" {...register('birthDate')} />
                  </div>
                  <div className="md:col-span-3">
                    <Select label="Sexo" options={genderOptions} {...register('gender')} />
                  </div>
                  <div className="md:col-span-4 xl:col-span-3">
                    <MaskedInput
                    label="CPF"
                    mask={masks.cpf}
                    maskChar={null}
                    {...register('cpf', {
                      validate: (value) => {
                        if (!value) return true;
                        if (removeMask(value).length !== 11) return 'CPF deve conter 11 dígitos';
                        if (!validateCPF(value)) return 'CPF inválido';
                        return true;
                      },
                    })}
                    error={errors.cpf?.message as string}
                    placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-12">
                    <Input label="RG" {...register('rg')} />
                    <Input label="Órgão Emissor" {...register('rgEmissor')} />
                    <Input label="Data de Emissão" type="date" {...register('rgEmissao')} />
                  </div>
                  <div className="md:col-span-4">
                    <Input label="Nacionalidade" {...register('nacionalidade')} />
                  </div>
                  <div className="md:col-span-4">
                    <Input label="Naturalidade" {...register('naturalidade')} />
                  </div>
                </div>
              </div>
            )}

            {activeStep.id === 'contact' && (
              <div>
                <TabHeader step={activeStep} />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <Input
                      label="Email *"
                      type="email"
                      {...register('email', {
                        required: 'Email é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido',
                        },
                      })}
                      error={errors.email?.message as string}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <MaskedInput label="Celular" mask={masks.phone} maskChar={null} {...register('phone')} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="md:col-span-3">
                    <MaskedInput label="Telefone Fixo" mask="(99) 9999-9999" maskChar={null} {...register('telefoneFixo')} placeholder="(00) 0000-0000" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                  <div className="md:col-span-3 xl:col-span-2">
                    <MaskedInput label="CEP" mask={masks.cep} maskChar={null} {...register('zipCode')} placeholder="00000-000" />
                  </div>
                  <div className="md:col-span-9 xl:col-span-7">
                    <Input label="Logradouro" {...register('address')} />
                  </div>
                  <div className="md:col-span-3 xl:col-span-3">
                    <Input label="Número" {...register('numero')} />
                  </div>
                  <div className="md:col-span-4 xl:col-span-3">
                    <Input label="Complemento" {...register('complemento')} />
                  </div>
                  <div className="md:col-span-4 xl:col-span-3">
                    <Input label="Bairro" {...register('bairro')} />
                  </div>
                  <div className="md:col-span-4 xl:col-span-4">
                    <Input label="Cidade" {...register('city')} />
                  </div>
                  <div className="md:col-span-2 xl:col-span-2">
                    <Input label="Estado" {...register('state')} maxLength={2} placeholder="UF" />
                  </div>
                </div>
              </div>
            )}

            {activeStep.id === 'profile' && role === UserRole.TEACHER && (
              <div>
                <TabHeader step={activeStep} />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <Input label="Formação principal" {...register('degree')} placeholder="Ex.: Licenciatura em Matemática" />
                  </div>
                  <div className="md:col-span-4">
                    <Input label="Especialização" {...register('specialization')} placeholder="Ex.: Educação Inclusiva" />
                  </div>
                  <div className="md:col-span-4">
                    <Input label="Registro profissional" {...register('registrationNumber')} placeholder="Ex.: Registro interno" />
                  </div>
                  <div className="md:col-span-4">
                    <Input label="Data de admissão" type="date" {...register('hireDate')} />
                  </div>
                </div>
              </div>
            )}

            {activeStep.id === 'institution' && (
              <div>
                <TabHeader step={activeStep} />

                {isLoadingInstitutions ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                    Carregando instituições...
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1">
                      <div>
                        <Input
                          label="Buscar instituição"
                          value={institutionSearchTerm}
                          onChange={(event) => setInstitutionSearchTerm(event.target.value)}
                          placeholder="Digite o nome, cidade ou UF"
                          leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Clique no bloco para selecionar ou remover. Depois, use o menu de ações para definir a principal.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Instituições</p>
                      {institutionCards.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma instituição encontrada para esse filtro.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {institutionCards.map((institution) => {
                            const isPrimary = institution.id === selectedPrimaryInstitutionId;
                            const isSelected = isPrimary || selectedAdditionalInstitutionIds.includes(institution.id);
                            return (
                              <div
                                key={institution.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleInstitutionSelection(institution.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    toggleInstitutionSelection(institution.id);
                                  }
                                }}
                                className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'border-emerald-300 bg-emerald-50/80 dark:bg-emerald-900/20'
                                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-primary-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{institution.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{institutionLocation(institution)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2 shrink-0">
                                    {isPrimary && (
                                      <Badge variant="success" size="sm">Principal</Badge>
                                    )}
                                    {isSelected && !isPrimary && (
                                      <div onClick={(event) => event.stopPropagation()}>
                                        <Dropdown
                                          trigger={(
                                            <button
                                              type="button"
                                              onClick={(event) => event.stopPropagation()}
                                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-700 dark:hover:bg-gray-700"
                                              aria-label={`Ações da instituição ${institution.name}`}
                                            >
                                              <EllipsisHorizontalIcon className="h-5 w-5" />
                                            </button>
                                          )}
                                          items={[
                                            {
                                              key: 'set-primary',
                                              label: isPrimary ? 'Instituição principal' : 'Definir como principal',
                                              onClick: () => defineInstitutionAsPrimary(institution.id),
                                              disabled: isPrimary,
                                            },
                                          ]}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStep.id === 'subjects' && role === UserRole.TEACHER && (
              <div>
                <TabHeader step={activeStep} />

                {isLoadingDynamicOptions ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                    Carregando disciplinas...
                  </div>
                ) : subjectOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma disciplina encontrada nas instituições selecionadas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subjectOptions.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject.id);
                      const institutionName = availableInstitutions.find((item) => item.id === subject.institutionId)?.name;
                      return (
                        <label
                          key={subject.id}
                          className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary-300 bg-primary-50/80 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubject(subject.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{subject.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {[subject.code, institutionName].filter(Boolean).join(' | ')}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeStep.id === 'students' && role === UserRole.PARENT && (
              <div>
                <TabHeader step={activeStep} />
                <div className="mb-4">
                  <Input label="Ocupação" {...register('occupation')} placeholder="Ex.: Autônoma, Servidor, Analista" />
                </div>

                {isLoadingDynamicOptions ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                    Carregando alunos...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {studentOptions.map((student) => {
                        const isSelected = linkedStudents.some((item) => item.studentId === student.studentId);
                        const institutionName = availableInstitutions.find((item) => item.id === student.institutionId)?.name;

                        return (
                          <label
                            key={student.studentId}
                            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-primary-300 bg-primary-50/80 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLinkedStudent(student)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{student.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {[student.registrationNumber, institutionName].filter(Boolean).join(' | ')}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {linkedStudents.map((student) => (
                      <div key={student.studentId} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 mt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.studentName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Defina o parentesco e as permissões desse vínculo.</p>
                          </div>
                          {student.isPrimary && <Badge variant="success" size="sm">Principal</Badge>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                          <Select
                            label="Parentesco"
                            options={relationshipOptions}
                            value={student.relationship}
                            onChange={(e) => updateLinkedStudent(student.studentId, 'relationship', e.target.value)}
                          />
                          <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!student.isPrimary}
                              onChange={(e) => updateLinkedStudent(student.studentId, 'isPrimary', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Contato principal</span>
                          </label>
                          <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!student.notificacoes}
                              onChange={(e) => updateLinkedStudent(student.studentId, 'notificacoes', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Recebe notificações</span>
                          </label>
                          <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!student.podeRetirar}
                              onChange={(e) => updateLinkedStudent(student.studentId, 'podeRetirar', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Pode retirar o aluno</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeStep.id === 'classes' && role === UserRole.TEACHER && (
              <div>
                <TabHeader step={activeStep} />

                {mode === 'create' ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-sm font-semibold text-amber-900">Vincule as turmas após criar o professor</p>
                      <p className="mt-2 text-sm text-amber-800">
                        O vínculo com turmas depende do cadastro do professor já existir no sistema. Primeiro salve o professor,
                        depois use a edição ou o módulo acadêmico para associar as turmas em que ele vai atuar.
                      </p>
                    </div>
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                      As turmas são vinculadas junto da atuação do professor nas disciplinas. Selecione as disciplinas nesta etapa
                      e finalize o cadastro para liberar o próximo passo operacional.
                    </div>
                  </div>
                ) : isLoadingTeacherClasses ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                    Carregando turmas vinculadas...
                  </div>
                ) : teacherClasses.length === 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                      Este professor ainda não possui turmas vinculadas.
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                      Para deixar o professor pronto para uso, associe as turmas no fluxo acadêmico de distribuição de disciplinas/turmas.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teacherClasses.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{item.class.name}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.class.grade}
                              {item.class.section ? ` • ${item.class.section}` : ''}
                              {item.class.shift ? ` • ${item.class.shift}` : ''}
                            </p>
                          </div>
                          <Badge variant="success" size="sm">Vinculada</Badge>
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Disciplina:</span> {item.subject.name}
                          </p>
                          {item.weeklyHours ? (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Carga semanal:</span> {item.weeklyHours}h
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeStep.id === 'access' && (
              <div>
                <TabHeader step={activeStep} />
                {passwordField ?? (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                    A redefinição de senha fica disponível apenas para o Super Admin na edição do usuário.
                  </div>
                )}

                {mode === 'create' ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 mt-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Senha inicial automática</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {generatedInitialPassword || 'Informe o email para gerar a senha automaticamente'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No primeiro login, o usuário será direcionado para trocar a senha.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 mt-4 space-y-2">
                    <p className="text-sm font-semibold text-amber-900">Alteração sensível</p>
                    <p className="text-sm text-amber-800">
                      Ao redefinir a senha, o usuário passará a acessar o sistema com a nova credencial definida pelo Super Admin.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => goToStep(activeIndex - 1)}
                disabled={activeIndex === 0}
                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
              >
                Anterior
              </Button>
              <Button
                type={activeIndex === steps.length - 1 ? 'submit' : 'button'}
                onClick={() => {
                  if (activeIndex < steps.length - 1) {
                    goToStep(activeIndex + 1);
                  }
                }}
                rightIcon={
                  activeIndex < steps.length - 1 ? <ArrowRightIcon className="h-4 w-4" /> : undefined
                }
              >
                {activeIndex === steps.length - 1 ? 'Salvar' : 'Próximo'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
