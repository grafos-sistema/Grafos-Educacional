'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  GlobeAltIcon,
  IdentificationIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BRAZILIAN_UF_OPTIONS } from '@/lib/constants/document-options';
import type { CreateInstitutionDto } from '@/types/institution.types';

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
    subtitle: 'Canais de contato institucionais',
    icon: GlobeAltIcon,
  },
  {
    id: 'endereco',
    label: 'Endereço',
    subtitle: 'Localização e dados postais',
    icon: MapPinIcon,
  },
  {
    id: 'sistema',
    label: 'Sistema',
    subtitle: 'Slug, status e identidade visual',
    icon: IdentificationIcon,
  },
] as const;

function TabHeader({ tab }: { tab: (typeof tabs)[number] }) {
  return (
    <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tab.label}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tab.subtitle}</p>
    </div>
  );
}

interface InstitutionFormTabsProps {
  form: UseFormReturn<InstitutionFormValues>;
}

export type InstitutionFormValues = Omit<CreateInstitutionDto, 'isActive'> & {
  isActive?: boolean | 'true' | 'false';
};

export function InstitutionFormTabs({ form }: InstitutionFormTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('identificacao');
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const institutionName = watch('name') || 'Nova Instituição';
  const institutionSlug = watch('slug') || 'slug-da-instituicao';
  const institutionCity = watch('city') || 'Cidade';
  const institutionState = watch('state') || 'UF';
  const institutionCnpj = watch('cnpj') || 'CNPJ não informado';
  const institutionEmail = watch('email') || 'Email não informado';
  const institutionStatus = watch('isActive');
  const initials = institutionName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? '')
    .join('') || 'NI';

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const nameError = typeof errors.name?.message === 'string' ? errors.name.message : undefined;
  const slugError = typeof errors.slug?.message === 'string' ? errors.slug.message : undefined;

  const goToTab = (index: number) => {
    if (index >= 0 && index < tabs.length) {
      setActiveTab(tabs[index].id);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-4 pt-4 md:flex-row md:items-start">
      <div className="flex w-full shrink-0 flex-col gap-5 md:w-[248px]">
        <div className="relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-50 text-2xl font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {initials}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{institutionName}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{institutionCnpj}</p>
          </div>

          <div className="mt-5 w-full space-y-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/40">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Slug</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{institutionSlug}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Localização</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {institutionCity}
                {institutionState ? `, ${institutionState}` : ''}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Contato</p>
              <p className="mt-1 break-all text-sm text-gray-700 dark:text-gray-300">{institutionEmail}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircleIcon className="h-4 w-4" />
            {institutionStatus === false || institutionStatus === 'false' ? 'Instituição inativa' : 'Instituição ativa'}
          </div>
        </div>

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
                      {tab.subtitle}
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
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <TabHeader tab={tabs[0]} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome da Instituição *"
                      placeholder="Ex: SESI"
                      {...register('name', { required: 'Nome é obrigatório' })}
                      error={nameError}
                    />
                  </div>

                  <div>
                    <Input
                      label="CNPJ"
                      placeholder="Ex: 12.345.678/0001-90"
                      {...register('cnpj')}
                    />
                  </div>

                  <div>
                    <Input
                      label="País"
                      placeholder="Brasil"
                      {...register('country')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contato' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <TabHeader tab={tabs[1]} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      label="Email Institucional"
                      placeholder="Ex: contato@escola.com.br"
                      type="email"
                      {...register('email')}
                    />
                  </div>

                  <div>
                    <Input
                      label="Telefone"
                      placeholder="Ex: (11) 99999-9999"
                      {...register('phone')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'endereco' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <TabHeader tab={tabs[2]} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="Endereço"
                      placeholder="Ex: Av. Principal, 1000"
                      {...register('address')}
                    />
                  </div>

                  <div>
                    <Input
                      label="Cidade"
                      placeholder="Ex: São Paulo"
                      {...register('city')}
                    />
                  </div>

                  <div>
                    <Select
                      label="Estado (UF)"
                      options={[{ value: '', label: 'Selecione a UF' }, ...BRAZILIAN_UF_OPTIONS]}
                      {...register('state')}
                    />
                  </div>

                  <div>
                    <Input
                      label="CEP"
                      placeholder="Ex: 01000-000"
                      {...register('zipCode')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sistema' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <TabHeader tab={tabs[3]} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="Slug (Identificador na URL) *"
                      placeholder="Ex: escola-machado-de-assis"
                      {...register('slug', {
                        required: 'Slug é obrigatório',
                        pattern: {
                          value: /^[a-z0-9-]+$/,
                          message: 'Apenas letras minúsculas, números e hifens',
                        },
                      })}
                      error={slugError}
                      helpText="Usado para o link de acesso da escola. Apenas letras minúsculas sem acento, números e hifens."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Logo (URL)"
                      placeholder="Ex: https://..."
                      {...register('logo')}
                    />
                  </div>

                  <div>
                    <Select
                      label="Status *"
                      {...register('isActive')}
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
