'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MaskedInput, masks } from '@/components/ui/MaskedInput';
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
  PencilSquareIcon,
  ShieldCheckIcon,
  CameraIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { observationsService } from '@/services/observations.service';
import { useAuthStore } from '@/stores/authStore';
import { Gender, UserRole } from '@/types/user.types';

const tabs = [
  { id: 'pessoais', label: 'Dados Pessoais', icon: UserIcon, subtitle: 'Informações básicas do aluno' },
  { id: 'matricula', label: 'Matrícula', icon: AcademicCapIcon, subtitle: 'Dados acadêmicos e de matrícula' },
  { id: 'endereco', label: 'Endereço', icon: MapPinIcon, subtitle: 'Endereço residencial do aluno' },
  { id: 'contato', label: 'Contato', icon: PhoneIcon, subtitle: 'Informações de contato do aluno' },
  { id: 'responsaveis', label: 'Responsáveis', icon: UserGroupIcon, subtitle: 'Responsáveis legais pelo aluno' },
  { id: 'saude', label: 'Saúde', icon: HeartIcon, subtitle: 'Informações de saúde e prontuário' },
  { id: 'transporte', label: 'Transporte', icon: TruckIcon, subtitle: 'Transporte escolar utilizado' },
  { id: 'documentos', label: 'Documentos', icon: DocumentTextIcon, subtitle: 'Documentos do aluno' },
  { id: 'acesso', label: 'Acesso', icon: ShieldCheckIcon, subtitle: 'Senha e credenciais do aluno' },
  { id: 'observacoes', label: 'Observações', icon: PencilSquareIcon, subtitle: 'Anotações da secretaria' },
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

type StudentObservationType = 'POSITIVE' | 'NEUTRAL' | 'ATTENTION' | 'DISCIPLINARY';

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

const observationTypeOptions: Array<{ value: StudentObservationType; label: string }> = [
  { value: 'POSITIVE', label: 'Positiva' },
  { value: 'NEUTRAL', label: 'Neutra' },
  { value: 'ATTENTION', label: 'Atenção' },
  { value: 'DISCIPLINARY', label: 'Disciplinar' },
];

function TabHeader({ tab, rightContent }: { tab: (typeof tabs)[number]; rightContent?: ReactNode }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tab.label}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tab.subtitle}</p>
        </div>
        {rightContent ? <div className="shrink-0">{rightContent}</div> : null}
      </div>
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
  const [activeTab, setActiveTab] = useState('pessoais');
  const { register, formState: { errors }, watch, setValue } = form;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const usaTransporte = watch('usaTransporte');
  const watchResponsaveis = watch('responsaveis');
  const selectedInstitutionId = watch('institutionId');
  const selectedPhoto = watch('photo');
  const currentAvatar = watch('avatar');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const cpf = watch('cpf');
  const bloodType = watch('tipoSanguineo');
  const [selectedObservationId, setSelectedObservationId] = useState<string | 'new' | null>(null);
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
  
  const [responsaveis, setResponsaveis] = useState(() => {
    const initial = form.getValues('responsaveis');
    return initial && initial.length > 0 ? initial.map((r: any, i: number) => ({ id: r.id || i + 1 })) : [{ id: 1 }];
  });

  useEffect(() => {
    if (watchResponsaveis && watchResponsaveis.length > 0) {
      if (watchResponsaveis.length !== responsaveis.length) {
        setResponsaveis(watchResponsaveis.map((r: any, i: number) => ({ id: r.id || Date.now() + i })));
      }
    }
  }, [watchResponsaveis]);

  useEffect(() => {
    if (!selectedInstitutionId) return;

    const selectedInstitution = availableInstitutions.find((institution) => institution.id === selectedInstitutionId);
    if (!selectedInstitution) return;

    if (form.getValues('escola') !== selectedInstitution.name) {
      setValue('escola', selectedInstitution.name, { shouldValidate: true });
    }
  }, [availableInstitutions, form, selectedInstitutionId, setValue]);

  useEffect(() => {
    const resolveSelectedFile = () => {
      if (!selectedPhoto) return null;
      if (typeof FileList !== 'undefined' && selectedPhoto instanceof FileList) {
        return selectedPhoto.item(0);
      }
      return Array.isArray(selectedPhoto) ? selectedPhoto[0] ?? null : null;
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

  const canManageObservations = useMemo(
    () =>
      currentUser?.role === UserRole.SUPER_ADMIN ||
      currentUser?.role === UserRole.INSTITUTION_ADMIN ||
      currentUser?.role === UserRole.COORDINATOR ||
      currentUser?.role === UserRole.TEACHER,
    [currentUser?.role]
  );

  const { data: observations = [], isLoading: isLoadingObservations } = useQuery({
    queryKey: ['student-observations-inline', studentProfileId],
    queryFn: async () => (await observationsService.findByStudent(studentProfileId as string)) as StudentObservation[],
    enabled: mode === 'edit' && Boolean(studentProfileId) && activeTab === 'observacoes',
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

  const selectedObservation = selectedObservationId && selectedObservationId !== 'new'
    ? observations.find((item) => item.id === selectedObservationId) ?? null
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
      if (!studentProfileId) throw new Error('Aluno ainda não possui perfil para receber observações.');
      return observationsService.create({
        studentId: studentProfileId,
        title: observationDraft.title.trim(),
        description: observationDraft.description.trim(),
        type: observationDraft.type,
        isPrivate: observationDraft.isPrivate,
      } as any);
    },
    onSuccess: (createdObservation: any) => {
      queryClient.invalidateQueries({ queryKey: ['student-observations-inline', studentProfileId] });
      setSelectedObservationId(createdObservation.id);
      toast.success('Anotação salva com sucesso.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Não foi possível salvar a anotação.');
    },
  });

  const updateObservationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedObservation) throw new Error('Selecione uma anotação para atualizar.');
      return observationsService.update(selectedObservation.id, {
        title: observationDraft.title.trim(),
        description: observationDraft.description.trim(),
        type: observationDraft.type,
        isPrivate: observationDraft.isPrivate,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-observations-inline', studentProfileId] });
      toast.success('Anotação atualizada com sucesso.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Não foi possível atualizar a anotação.');
    },
  });

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const activeObservationTab = tabs.find((tab) => tab.id === 'observacoes');
  const activeAccessTab = tabs.find((tab) => tab.id === 'acesso');
  const studentDisplayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Novo aluno';
  const resolvedAvatarSrc = photoPreviewUrl || currentAvatar || '';
  const studentSummary = cpf?.trim() || '';
  const bloodTypeBadge = bloodType && bloodType !== 'NAO_INFORMADO' ? bloodType : null;

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
    observation?.teacher?.user?.name || observation?.teacher?.user?.email || 'Autor não identificado';

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
    if (!observationDraft.title.trim() || !observationDraft.description.trim()) {
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
            <label className="group relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-primary-200 bg-gray-50 transition-colors hover:border-primary-300 hover:bg-gray-100 dark:border-primary-900/40 dark:bg-gray-900/40 dark:hover:bg-gray-700">
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
                <span className="text-xs font-medium">Trocar foto</span>
              </div>
            </div>

            <input type="file" accept="image/png,image/jpeg" className="hidden" {...register('photo')} />
          </label>

          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentDisplayName}</p>
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
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
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
                <Input label="Nome *" {...register('firstName', { required: 'Nome obrigatório' })} error={errors.firstName?.message as string} />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <Input label="Sobrenome *" {...register('lastName', { required: 'Sobrenome obrigatório' })} error={errors.lastName?.message as string} />
              </div>
              <div className="md:col-span-2">
                <Input label="Nome Social" {...register('socialName')} />
              </div>
              <Input label="Data de Nascimento *" type="date" {...register('birthDate', { required: 'Data obrigatória' })} error={errors.birthDate?.message as string} />
              <Select label="Sexo *" options={genderOptions} {...register('gender', { required: 'Sexo obrigatório' })} error={errors.gender?.message as string} />
              <MaskedInput label="CPF" mask={masks.cpf} maskChar={null} {...register('cpf')} placeholder="000.000.000-00" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-3 lg:col-span-4">
                <Input label="RG" {...register('rg')} />
                <Input label="Órgão Emissor" {...register('rgEmissor')} placeholder="Ex.: SSP/MA" />
                <Input label="Data de Emissão" type="date" {...register('rgEmissao')} />
              </div>
              <Input label="Nacionalidade" {...register('nacionalidade')} defaultValue="Brasileira" />
              <Input label="Naturalidade" {...register('naturalidade')} />
            </div>
          </div>
        )}

        {/* MATRICULA */}
        {activeTab === 'matricula' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabHeader tab={tabs[1]} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Matrícula" {...register('registrationNumber')} disabled placeholder="Gerada automaticamente" />
              <Select label="Situação" options={situationOptions} {...register('situacao')} defaultValue="ATIVO" />
              <Select 
                label="Escola *" 
                value={selectedInstitutionId || ''}
                onChange={(event) => {
                  const nextInstitutionId = event.target.value;
                  const selectedInstitution = availableInstitutions.find((institution) => institution.id === nextInstitutionId);
                  setValue('institutionId', nextInstitutionId, { shouldDirty: true, shouldValidate: true });
                  setValue('institutionIds', nextInstitutionId ? [nextInstitutionId] : [], { shouldDirty: true, shouldValidate: true });
                  setValue('escola', selectedInstitution?.name ?? '', { shouldDirty: true, shouldValidate: true });
                }}
                error={errors.institutionId?.message as string}
                disabled={isLoadingInstitutions}
                options={[
                  { value: '', label: 'Selecione uma escola...' },
                  ...availableInstitutions.map((institution) => ({ value: institution.id, label: institution.name }))
                ]}
              />
              <input
                type="hidden"
                {...register('institutionId', { required: 'Obrigatório' })}
              />
              <input type="hidden" {...register('escola')} />
              <Input label="Unidade *" {...register('unidade', { required: 'Obrigatório' })} />
              <Input label="Ano Letivo *" {...register('anoLetivo', { required: 'Obrigatório' })} />
              <Input label="Curso *" {...register('curso', { required: 'Obrigatório' })} />
              <Input label="Série/Ano *" {...register('serie', { required: 'Obrigatório' })} />
              <Input label="Turma *" {...register('turma', { required: 'Obrigatório' })} />
              <Input label="Turno *" {...register('turno', { required: 'Obrigatório' })} />
              <Input label="Modalidade *" {...register('modalidade', { required: 'Obrigatório' })} />
              <Input label="Data da Matrícula *" type="date" {...register('dataMatricula', { required: 'Obrigatório' })} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
        )}

        {/* ENDERECO */}
        {activeTab === 'endereco' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabHeader tab={tabs[2]} />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <MaskedInput label="CEP" mask={masks.cep} maskChar={null} {...register('zipCode')} placeholder="00000-000" />
              <div className="md:col-span-2 lg:col-span-3">
                <Input label="Logradouro" {...register('address')} />
              </div>
              <Input label="Número" {...register('numero')} />
              <Input label="Complemento" {...register('complemento')} />
              <Input label="Bairro" {...register('bairro')} />
              <Input label="Cidade" {...register('city')} />
              <Input label="Estado" {...register('state')} maxLength={2} placeholder="UF" />
            </div>
          </div>
        )}

        {/* CONTATO */}
        {activeTab === 'contato' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabHeader tab={tabs[3]} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 lg:col-span-1">
                <Input label="Email do Aluno" type="email" {...register('email')} />
              </div>
              <MaskedInput label="Celular" mask={masks.phone} maskChar={null} {...register('phone')} placeholder="(00) 00000-0000" />
              <MaskedInput label="Telefone Fixo" mask="(99) 9999-9999" maskChar={null} {...register('telefoneFixo')} placeholder="(00) 0000-0000" />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Nota: O login do aluno no sistema será feito com este email e com uma senha padrão definida pela escola.
            </p>
          </div>
        )}

        {/* RESPONSAVEIS */}
        {activeTab === 'responsaveis' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <UserGroupIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Responsáveis <span className="text-red-500">*</span></h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ao menos 1 responsável é obrigatório</p>
                </div>
              </div>
              <Button type="button" size="sm" className="bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800 dark:hover:bg-primary-900/50" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setResponsaveis([...responsaveis, { id: Date.now() }])}>
                Adicionar Responsável
              </Button>
            </div>

            {/* Aviso de acesso ao sistema */}
            <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
              <svg className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Acesso ao sistema:</strong> Se o responsável tiver um <strong>email</strong> informado, uma conta será criada automaticamente e ele poderá acessar o sistema para acompanhar as notas e dados do aluno. Sem email, o responsável será cadastrado apenas para fins de registro.
              </p>
            </div>

            {responsaveis.map((resp, index) => (
              <div key={resp.id} className="bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 relative shadow-sm hover:shadow-md transition-shadow">
                {responsaveis.length > 1 && (
                  <button type="button" onClick={() => setResponsaveis(responsaveis.filter(r => r.id !== resp.id))} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                  Responsável {index + 1}
                  {index === 0 && <span className="ml-2 text-xs font-normal text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">Principal</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input label="Nome completo *" {...register(`responsaveis.${index}.nome`, { required: 'Nome do responsável é obrigatório' })} />
                  </div>
                  <Input label="Parentesco *" {...register(`responsaveis.${index}.parentesco`, { required: true })} placeholder="Ex: Mãe, Pai, Avó..." />
                  <MaskedInput label="CPF" mask={masks.cpf} maskChar={null} {...register(`responsaveis.${index}.cpf`)} />
                  <div>
                    <label
                      htmlFor={`responsavel-email-${index}`}
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email
                    </label>
                    <input
                      id={`responsavel-email-${index}`}
                      type="email"
                      {...register(`responsaveis.${index}.email`)}
                      placeholder="email@exemplo.com (opcional)"
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                    />
                  </div>
                  <MaskedInput label="Celular *" mask={masks.phone} maskChar={null} {...register(`responsaveis.${index}.celular`, { required: true })} />
                  <MaskedInput label="WhatsApp" mask={masks.phone} maskChar={null} {...register(`responsaveis.${index}.whatsapp`)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                    <input type="checkbox" {...register(`responsaveis.${index}.financeiro`)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resp. Financeiro</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                    <input type="checkbox" {...register(`responsaveis.${index}.notificacoes`)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recebe Notificações</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                    <input type="checkbox" {...register(`responsaveis.${index}.podeRetirar`)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pode Retirar Aluno</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SAUDE */}
        {activeTab === 'saude' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabHeader tab={tabs[5]} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Tipo Sanguíneo" options={[{value:'A+',label:'A+'},{value:'A-',label:'A-'},{value:'B+',label:'B+'},{value:'B-',label:'B-'},{value:'AB+',label:'AB+'},{value:'AB-',label:'AB-'},{value:'O+',label:'O+'},{value:'O-',label:'O-'},{value:'NAO_INFORMADO',label:'Não informado'}]} {...register('tipoSanguineo')} defaultValue="NAO_INFORMADO" />
              <Input label="Convênio Médico" {...register('convenioMedico')} />
              <div className="md:col-span-2">
                <Input label="Alergias" {...register('alergias')} placeholder="Especifique se houver" />
              </div>
              <div className="md:col-span-2">
                <Input label="Medicamentos de uso contínuo" {...register('medicamentos')} />
              </div>
              <div className="md:col-span-2">
                <Input label="Necessidades especiais" {...register('necessidadesEspeciais')} />
              </div>
              <div className="md:col-span-2">
                <Input label="Restrições alimentares" {...register('restricoesAlimentares')} />
              </div>
              <div className="md:col-span-2">
                <Input label="Contato de emergência (Nome e Telefone)" {...register('contatoEmergencia')} />
              </div>
            </div>
          </div>
        )}

        {/* TRANSPORTE */}
        {activeTab === 'transporte' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabHeader tab={tabs[6]} />

            <label className="flex items-center gap-2 mb-4 cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 w-max">
              <input type="checkbox" {...register('usaTransporte')} className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
              <span className="font-medium text-gray-900 dark:text-white">Utiliza transporte escolar</span>
            </label>

            {usaTransporte && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300 p-4 border border-primary-100 bg-primary-50/50 dark:border-primary-900/30 dark:bg-primary-900/10 rounded-lg">
                <Select label="Tipo de Transporte" options={[{value:'PRIVADO',label:'Van/Ônibus Privado'},{value:'PUBLICO',label:'Transporte Público'},{value:'PROPRIO',label:'Próprio'}]} {...register('tipoTransporte')} />
                <Input label="Empresa/Viação" {...register('empresaTransporte')} />
                <Input label="Nome do Motorista" {...register('motoristaTransporte')} />
                <Input label="Rota/Linha" {...register('rotaTransporte')} />
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabHeader tab={tabs[7]} />
            <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="mx-auto flex justify-center mb-4 text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Clique para fazer upload ou arraste os arquivos</p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB por arquivo)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {['Certidão de Nascimento', 'RG do Aluno', 'CPF do Aluno', 'Comprovante de Residência', 'Histórico Escolar', 'Cartão de Vacinação'].map(doc => (
                <div key={doc} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc}</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">Pendente</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'acesso' && activeAccessTab && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabHeader tab={activeAccessTab} />
            {mode === 'create' ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Senha inicial automática</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {generatedInitialPassword || 'Informe o email do aluno para gerar a senha automaticamente.'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No primeiro login, o aluno será direcionado para trocar a senha.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {passwordField ?? (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                    A redefinição de senha fica disponível apenas para o Super Admin na edição do aluno.
                  </div>
                )}
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-sm font-semibold text-amber-900">Alteração sensível</p>
                  <p className="mt-2 text-sm text-amber-800">
                    Ao salvar a nova senha, o aluno passará a acessar o sistema com a credencial redefinida.
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
                As observações ficam disponíveis após salvar o aluno pela primeira vez.
              </div>
            ) : !studentProfileId ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                O perfil do aluno ainda não está pronto para receber observações.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Histórico de anotações</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Registre observações sobre o aluno e acompanhe o histórico com autor e data.
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Carregando observações...</p>
                    ) : observations.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma anotação registrada para este aluno.
                      </p>
                    ) : (
                      observations.map((observation) => (
                        <button
                          key={observation.id}
                          type="button"
                          onClick={() => setSelectedObservationId(observation.id)}
                          className={`w-full rounded-xl border p-4 text-left transition-colors ${
                            selectedObservationId === observation.id
                              ? 'border-primary-300 bg-primary-50/80 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{observation.title}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {getObservationAuthor(observation)}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatObservationDate(observation.date ?? observation.createdAt)}
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
                    {selectedObservationId === null && observations.length > 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                        Selecione uma anotação da lista para visualizar a mensagem completa.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Título da anotação"
                            value={observationDraft.title}
                            onChange={(event) => setObservationDraft((current) => ({ ...current, title: event.target.value }))}
                            placeholder="Ex.: Evolução pedagógica"
                          />
                          <Select
                            label="Tipo"
                            value={observationDraft.type}
                            onChange={(event) =>
                              setObservationDraft((current) => ({
                                ...current,
                                type: event.target.value as StudentObservationType,
                              }))
                            }
                            options={observationTypeOptions}
                          />
                        </div>

                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              Autor: {selectedObservation ? getObservationAuthor(selectedObservation) : currentUser?.name || 'Você'}
                            </span>
                            <span>
                              Data: {formatObservationDate(selectedObservation?.date ?? selectedObservation?.createdAt ?? new Date().toISOString())}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem</label>
                          <textarea
                            value={observationDraft.description}
                            onChange={(event) =>
                              setObservationDraft((current) => ({ ...current, description: event.target.value }))
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
                              setObservationDraft((current) => ({ ...current, isPrivate: event.target.checked }))
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
                            onClick={() => setSelectedObservationId(observations[0]?.id ?? null)}
                            disabled={createObservationMutation.isPending || updateObservationMutation.isPending}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={handlePersistObservation}
                            disabled={!canManageObservations}
                            isLoading={createObservationMutation.isPending || updateObservationMutation.isPending}
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
            type="button"
            onClick={() => goToTab(activeIndex + 1)}
            disabled={activeIndex === tabs.length - 1}
            rightIcon={<ArrowRightIcon className="h-4 w-4" />}
          >
            Próximo
          </Button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
