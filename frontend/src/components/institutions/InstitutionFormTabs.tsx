'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  IdentificationIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BRAZILIAN_UF_OPTIONS } from '@/lib/constants/document-options';
import { formatCep, lookupCep } from '@/lib/address-utils';
import { supabase } from '@/lib/supabase';
import type { CreateInstitutionDto, CreateInstitutionUnitDto } from '@/types/institution.types';
import { UserRole } from '@/types/user.types';

const tabs = [
  {
    id: 'identificacao',
    label: 'Identificação',
    subtitle: 'Dados principais da instituição',
    icon: BuildingOffice2Icon,
  },
  {
    id: 'contato',
    label: 'Contato',
    subtitle: 'Canais oficiais da instituição',
    icon: GlobeAltIcon,
  },
  {
    id: 'anexos',
    label: 'Anexos',
    subtitle: 'Unidades, endereço e responsáveis',
    icon: MapPinIcon,
  },
  {
    id: 'sistema',
    label: 'Sistema',
    subtitle: 'Slug, status e identidade visual',
    icon: IdentificationIcon,
  },
] as const;

type TabId = (typeof tabs)[number]['id'];

export interface InstitutionUnitFormValues extends CreateInstitutionUnitDto {
  id?: string;
  directorMode?: 'none' | 'create' | 'link';
  directorFirstName?: string;
  directorLastName?: string;
  directorCpf?: string;
  directorEmail?: string;
  directorPhone?: string;
}

interface InstitutionFormTabsProps {
  form: UseFormReturn<InstitutionFormValues>;
  institutionId?: string;
}

export type InstitutionFormValues = Omit<CreateInstitutionDto, 'isActive' | 'units'> & {
  isActive?: boolean | 'true' | 'false';
  units: InstitutionUnitFormValues[];
};

const nameRegex = /[^A-Za-zÀ-ÿ0-9 ]/g;

type DirectorOption = {
  id: string;
  fullName: string;
  cpf?: string;
  email?: string;
  phone?: string;
};

type InstitutionDirectorRow = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  cpf?: string | null;
  email: string;
  phone?: string | null;
};

function TabHeader({ tab }: { tab: (typeof tabs)[number] }) {
  return (
    <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tab.label}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tab.subtitle}</p>
    </div>
  );
}

function sanitizeInstitutionName(value: string) {
  return value
    .replace(nameRegex, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, 50);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function formatCnpj(value?: string) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value?: string) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatCpf(value?: string) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function emptyUnit(): InstitutionUnitFormValues {
  return {
    name: '',
    managerName: '',
    directorUserId: '',
    directorMode: 'none',
    directorFirstName: '',
    directorLastName: '',
    directorCpf: '',
    directorEmail: '',
    directorPhone: '',
    email: '',
    phone: '',
    zipCode: '',
    address: '',
    numero: '',
    complemento: '',
    city: '',
    state: '',
    isActive: true,
  };
}

function normalizeTabError<T extends string>(message?: T) {
  return typeof message === 'string' ? message : undefined;
}

export function InstitutionFormTabs({ form, institutionId }: InstitutionFormTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('identificacao');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const {
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'units',
  });

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const institutionName = watch('name') || 'Nova Instituição';
  const slugValue = watch('slug') || '';
  const cnpjValue = watch('cnpj') || '';
  const websiteValue = watch('website') || '';
  const emailValue = watch('email') || '';
  const phoneValue = watch('phone') || '';
  const units = watch('units') || [];

  const nameError = normalizeTabError(errors.name?.message as string | undefined);
  const slugError = normalizeTabError(errors.slug?.message as string | undefined);
  const cnpjError = normalizeTabError(errors.cnpj?.message as string | undefined);
  const emailError = normalizeTabError(errors.email?.message as string | undefined);
  const phoneError = normalizeTabError(errors.phone?.message as string | undefined);
  const websiteError = normalizeTabError(errors.website?.message as string | undefined);

  useEffect(() => {
    const currentUnits = getValues('units');
    if (!currentUnits || currentUnits.length === 0) {
      replace([emptyUnit()]);
    }
  }, [getValues, replace]);

  useEffect(() => {
    if (slugManuallyEdited) return;
    const generatedSlug = slugify(institutionName);
    setValue('slug', generatedSlug, { shouldDirty: true, shouldValidate: true });
  }, [institutionName, setValue, slugManuallyEdited]);

  const goToTab = (index: number) => {
    if (index >= 0 && index < tabs.length) {
      setActiveTab(tabs[index].id);
    }
  };

  const annexSummary = units.filter((unit) => unit?.name?.trim()).length;
  const shouldLoadInstitutionDirectors =
    Boolean(institutionId) &&
    units.some((unit) => (unit?.directorMode ?? 'none') === 'link');

  const { data: directorsResponse } = useQuery({
    queryKey: ['institution-directors', institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, firstName, lastName, cpf, email, phone')
        .eq('role', UserRole.DIRECTOR)
        .eq('institutionId', institutionId as string)
        .order('firstName', { ascending: true })
        .limit(200);

      if (error) {
        return { data: [] as InstitutionDirectorRow[] };
      }

      return { data: (data ?? []) as InstitutionDirectorRow[] };
    },
    enabled: shouldLoadInstitutionDirectors,
  });

  const institutionDirectors: DirectorOption[] = (directorsResponse?.data ?? []).map((director) => ({
    id: director.id,
    fullName: `${director.firstName} ${director.lastName}`.trim(),
    cpf: director.cpf ?? undefined,
    email: director.email,
    phone: director.phone ?? undefined,
  }));

  const handleUnitCepBlur = async (index: number) => {
    const unit = getValues(`units.${index}`);
    const normalizedCep = (unit?.zipCode ?? '').replace(/\D/g, '');

    if (normalizedCep.length !== 8) {
      return;
    }

    try {
      const result = await lookupCep(normalizedCep);
      if (!result) return;

      setValue(`units.${index}.zipCode`, result.zipCode, {
        shouldDirty: true,
        shouldTouch: true,
      });

      if (!getValues(`units.${index}.address`) && result.address) {
        setValue(`units.${index}.address`, result.address, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      if (!getValues(`units.${index}.city`) && result.city) {
        setValue(`units.${index}.city`, result.city, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      if (!getValues(`units.${index}.state`) && result.state) {
        setValue(`units.${index}.state`, result.state, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    } catch {
      // Mantém edição manual liberada
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-4 pt-4 md:flex-row md:items-start">
      <div className="flex w-full shrink-0 flex-col gap-5 md:w-[248px]">
        <nav className="hide-scrollbar flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-r-lg border-l-4 px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary-600 bg-primary-50/80 text-primary-700 shadow-sm dark:bg-primary-900/20 dark:text-primary-400'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p>{tab.label}</p>
                    <p className="mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                      {tab.id === 'anexos' ? `${annexSummary} anexo(s)` : tab.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-w-0 flex-1 self-start rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="relative p-6 md:p-8 xl:p-10">
          <div className="w-full space-y-6">
            {activeTab === 'identificacao' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
                <TabHeader tab={tabs[0]} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome da Instituição *"
                      placeholder="Ex: SESI"
                      value={institutionName}
                      onChange={(event) => {
                        const sanitized = sanitizeInstitutionName(event.target.value);
                        setValue('name', sanitized, { shouldDirty: true, shouldValidate: true });
                      }}
                      error={nameError}
                      maxLength={50}
                      helperText="Máximo de 50 caracteres. Apenas letras, números e espaços."
                    />
                  </div>

                  <div>
                    <Input
                      label="CNPJ *"
                      placeholder="Ex: 12.345.678/0001-90"
                      value={formatCnpj(cnpjValue)}
                      onChange={(event) => {
                        setValue('cnpj', formatCnpj(event.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      error={cnpjError}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contato' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
                <TabHeader tab={tabs[1]} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      label="Email Institucional"
                      placeholder="Ex: contato@escola.com.br"
                      type="email"
                      value={emailValue}
                      onChange={(event) => {
                        setValue('email', event.target.value.trim(), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      error={emailError}
                    />
                  </div>

                  <div>
                    <Input
                      label="Telefone"
                      placeholder="Ex: (99) 9 9999-9999"
                      value={formatPhone(phoneValue)}
                      onChange={(event) => {
                        setValue('phone', formatPhone(event.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      error={phoneError}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Site Institucional"
                      placeholder="Ex: https://www.suaescola.com.br"
                      type="url"
                      value={websiteValue}
                      onChange={(event) => {
                        setValue('website', event.target.value.trim(), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      error={websiteError}
                    />
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'anexos' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
                <TabHeader tab={tabs[2]} />

                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Cadastre os anexos e unidades da instituição
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Cada anexo pode ter localização, contatos e responsável próprios.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append(emptyUnit())}
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                  >
                    Adicionar anexo
                  </Button>
                </div>

                <div className="space-y-5">
                  {fields.map((field, index) => {
                    const unitNameError = normalizeTabError(
                      (errors.units?.[index]?.name?.message as string | undefined) ?? undefined
                    );
                    const unitPhoneError = normalizeTabError(
                      (errors.units?.[index]?.phone?.message as string | undefined) ?? undefined
                    );
                    const unitEmailError = normalizeTabError(
                      (errors.units?.[index]?.email?.message as string | undefined) ?? undefined
                    );
                    const unitZipCode = watch(`units.${index}.zipCode`) || '';
                    const unitPhone = watch(`units.${index}.phone`) || '';
                    const directorMode = (watch(`units.${index}.directorMode`) || 'none') as InstitutionUnitFormValues['directorMode'];
                    const unitDirectorCpf = watch(`units.${index}.directorCpf`) || '';
                    const unitDirectorPhone = watch(`units.${index}.directorPhone`) || '';
                    const linkedDirectorId = watch(`units.${index}.directorUserId`) || '';
                    const directorSearch = watch(`units.${index}.managerName`) || '';
                    const filteredDirectors = institutionDirectors.filter((director) => {
                      if (!directorSearch.trim()) return true;
                      const normalizedSearch = directorSearch.toLowerCase();
                      return (
                        director.fullName.toLowerCase().includes(normalizedSearch) ||
                        (director.cpf ?? '').replace(/\D/g, '').includes(directorSearch.replace(/\D/g, ''))
                      );
                    });
                    const selectedDirector = institutionDirectors.find((director) => director.id === linkedDirectorId);

                    return (
                      <div
                        key={field.id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40"
                      >
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                              Anexo {index + 1}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Endereço, contato e responsável desta unidade.
                            </p>
                          </div>
                          {fields.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => remove(index)}
                              className="rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                              leftIcon={<TrashIcon className="h-4 w-4" />}
                            >
                              Remover
                            </Button>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Input
                              label="Nome do anexo *"
                              placeholder="Ex: SESI - Anna Adelaide Bello"
                              value={watch(`units.${index}.name`) || ''}
                              onChange={(event) =>
                                setValue(`units.${index}.name`, sanitizeInstitutionName(event.target.value), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              error={unitNameError}
                              maxLength={50}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-950/20">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Diretor do anexo
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Cadastre um novo diretor ou vincule um já existente nesta instituição.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant={directorMode === 'create' ? 'primary' : 'outline'}
                                    onClick={() => {
                                      setValue(`units.${index}.directorMode`, 'create', {
                                        shouldDirty: true,
                                      });
                                      setValue(`units.${index}.directorUserId`, '', {
                                        shouldDirty: true,
                                      });
                                    }}
                                    disabled={!institutionId}
                                    leftIcon={<PlusIcon className="h-4 w-4" />}
                                  >
                                    Cadastrar Diretor
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={directorMode === 'link' ? 'primary' : 'outline'}
                                    onClick={() => {
                                      setValue(`units.${index}.directorMode`, 'link', {
                                        shouldDirty: true,
                                      });
                                      setValue(`units.${index}.directorFirstName`, '', {
                                        shouldDirty: true,
                                      });
                                      setValue(`units.${index}.directorLastName`, '', {
                                        shouldDirty: true,
                                      });
                                      setValue(`units.${index}.directorCpf`, '', {
                                        shouldDirty: true,
                                      });
                                      setValue(`units.${index}.directorEmail`, '', {
                                        shouldDirty: true,
                                      });
                                      setValue(`units.${index}.directorPhone`, '', {
                                        shouldDirty: true,
                                      });
                                    }}
                                    disabled={!institutionId}
                                    leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                                  >
                                    Vincular Diretor
                                  </Button>
                                </div>
                              </div>

                              {!institutionId ? (
                                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                                  Salve a instituição primeiro para cadastrar ou vincular um diretor neste anexo.
                                </p>
                              ) : null}

                              {directorMode === 'create' ? (
                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <Input
                                    label="Nome do diretor *"
                                    placeholder="Ex: Maria"
                                    value={watch(`units.${index}.directorFirstName`) || ''}
                                    onChange={(event) =>
                                      setValue(
                                        `units.${index}.directorFirstName`,
                                        sanitizeInstitutionName(event.target.value),
                                        { shouldDirty: true, shouldValidate: true }
                                      )
                                    }
                                    leftIcon={<UserCircleIcon className="h-5 w-5" />}
                                    maxLength={50}
                                  />

                                  <Input
                                    label="Sobrenome do diretor *"
                                    placeholder="Ex: Oliveira"
                                    value={watch(`units.${index}.directorLastName`) || ''}
                                    onChange={(event) =>
                                      setValue(
                                        `units.${index}.directorLastName`,
                                        sanitizeInstitutionName(event.target.value),
                                        { shouldDirty: true, shouldValidate: true }
                                      )
                                    }
                                    maxLength={50}
                                  />

                                  <Input
                                    label="CPF do diretor"
                                    placeholder="Ex: 123.456.789-00"
                                    value={formatCpf(unitDirectorCpf)}
                                    onChange={(event) =>
                                      setValue(`units.${index}.directorCpf`, formatCpf(event.target.value), {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      })
                                    }
                                    inputMode="numeric"
                                  />

                                  <Input
                                    label="Telefone do diretor"
                                    placeholder="Ex: (99) 9 9999-9999"
                                    value={formatPhone(unitDirectorPhone)}
                                    onChange={(event) =>
                                      setValue(`units.${index}.directorPhone`, formatPhone(event.target.value), {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      })
                                    }
                                    inputMode="numeric"
                                  />

                                  <div className="md:col-span-2">
                                    <Input
                                      label="Email do diretor *"
                                      type="email"
                                      placeholder="Ex: diretor@instituicao.com.br"
                                      value={watch(`units.${index}.directorEmail`) || ''}
                                      onChange={(event) =>
                                        setValue(`units.${index}.directorEmail`, event.target.value.trim(), {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              ) : null}

                              {directorMode === 'link' ? (
                                <div className="mt-4 space-y-3">
                                  <Input
                                    label="Buscar diretor por nome ou CPF"
                                    placeholder="Digite nome ou CPF"
                                    value={directorSearch}
                                    onChange={(event) => {
                                      setValue(`units.${index}.directorUserId`, '', {
                                        shouldDirty: true,
                                      });
                                      setValue(`units.${index}.managerName`, event.target.value, {
                                        shouldDirty: true,
                                      });
                                    }}
                                    leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                  />

                                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
                                    {filteredDirectors.length === 0 ? (
                                      <p className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        Nenhum diretor encontrado para esta instituição.
                                      </p>
                                    ) : (
                                      filteredDirectors.map((director) => {
                                        const isSelected = linkedDirectorId === director.id;

                                        return (
                                          <button
                                            key={director.id}
                                            type="button"
                                            onClick={() => {
                                              setValue(`units.${index}.directorUserId`, director.id, {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                              });
                                              setValue(`units.${index}.managerName`, director.fullName, {
                                                shouldDirty: true,
                                              });
                                            }}
                                            className={`flex w-full items-start justify-between rounded-xl border px-3 py-3 text-left transition-colors ${
                                              isSelected
                                                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                            }`}
                                          >
                                            <div>
                                              <p className="text-sm font-semibold">{director.fullName}</p>
                                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {director.cpf || 'CPF não informado'}{director.email ? ` • ${director.email}` : ''}
                                              </p>
                                            </div>
                                            {isSelected ? (
                                              <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                                Vinculado
                                              </span>
                                            ) : null}
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>

                                  {selectedDirector ? (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                                      Diretor vinculado: <span className="font-semibold">{selectedDirector.fullName}</span>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <Input
                              label="Email do anexo"
                              type="email"
                              placeholder="Ex: anna.adelaide@sesi.com.br"
                              value={watch(`units.${index}.email`) || ''}
                              onChange={(event) =>
                                setValue(`units.${index}.email`, event.target.value.trim(), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              error={unitEmailError}
                            />
                          </div>

                          <div>
                            <Input
                              label="Telefone do anexo"
                              placeholder="Ex: (99) 9 9999-9999"
                              value={formatPhone(unitPhone)}
                              onChange={(event) =>
                                setValue(`units.${index}.phone`, formatPhone(event.target.value), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              error={unitPhoneError}
                              inputMode="numeric"
                            />
                          </div>

                          <div>
                            <Input
                              label="CEP"
                              value={unitZipCode ? formatCep(unitZipCode) : ''}
                              placeholder="Ex: 65000-000"
                              inputMode="numeric"
                              onChange={(event) =>
                                setValue(`units.${index}.zipCode`, formatCep(event.target.value), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              onBlur={() => void handleUnitCepBlur(index)}
                            />
                          </div>

                          <div>
                            <Select
                              label="Estado (UF)"
                              value={watch(`units.${index}.state`) || ''}
                              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                setValue(`units.${index}.state`, event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              options={[{ value: '', label: 'Selecione a UF' }, ...BRAZILIAN_UF_OPTIONS]}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Input
                              label="Logradouro"
                              placeholder="Ex: Av. Principal"
                              value={watch(`units.${index}.address`) || ''}
                              onChange={(event) =>
                                setValue(`units.${index}.address`, event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Input
                              label="Número"
                              placeholder="Ex: 1000"
                              value={watch(`units.${index}.numero`) || ''}
                              onChange={(event) =>
                                setValue(`units.${index}.numero`, event.target.value.slice(0, 20), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Input
                              label="Complemento"
                              placeholder="Ex: Bloco B"
                              value={watch(`units.${index}.complemento`) || ''}
                              onChange={(event) =>
                                setValue(`units.${index}.complemento`, event.target.value.slice(0, 80), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Input
                              label="Cidade"
                              placeholder="Ex: São Luís"
                              value={watch(`units.${index}.city`) || ''}
                              onChange={(event) =>
                                setValue(`units.${index}.city`, event.target.value.slice(0, 80), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'sistema' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
                <TabHeader tab={tabs[3]} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="Slug (Identificador na URL) *"
                      placeholder="Ex: sesi"
                      value={slugValue}
                      onChange={(event) => {
                        setSlugManuallyEdited(true);
                        setValue('slug', slugify(event.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      error={slugError}
                      helperText="Apenas letras minúsculas, números e hífens."
                    />
                  </div>

                  <div>
                    <Select
                      label="Status *"
                      value={String(watch('isActive') ?? 'true')}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        setValue('isActive', event.target.value as 'true' | 'false', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      options={[
                        { value: 'true', label: 'Ativo' },
                        { value: 'false', label: 'Inativo' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
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
                  activeIndex < tabs.length - 1 ? <ArrowRightIcon className="h-4 w-4" /> : undefined
                }
              >
                {activeIndex === tabs.length - 1 ? 'Salvar' : 'Próximo'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
