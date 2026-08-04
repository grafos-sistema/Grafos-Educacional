'use client';

import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, BuildingOffice2Icon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { getValidInstitutionIds, isUuid } from '@/lib/institution-filter';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

interface Institution {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  isPrimary?: boolean;
  isCurrent?: boolean;
}

export function InstitutionSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user,
    institutionFilterAll,
    institutionFilterIds,
    setInstitutionFilterAll,
    setInstitutionFilterIds,
  } = useAuthStore();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await authService.getInstitutions();
        setInstitutions(data);

        // Find current institution
        const current = data.find((inst: Institution) => inst.id === user?.institutionId);
        if (current) {
          setCurrentInstitution(current);
        }
      } catch (error) {
        console.error('Failed to load institutions:', error);
      }
    };

    if (user) {
      loadInstitutions();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (institutionFilterAll) return;
    if (getValidInstitutionIds(institutionFilterIds).length > 0) return;

    const fallbackId = isUuid(user.institutionId)
      ? user.institutionId
      : institutions.find((institution) => isUuid(institution.id))?.id;

    if (!fallbackId) return;
    setInstitutionFilterIds([fallbackId]);
  }, [institutionFilterAll, institutionFilterIds, institutions, setInstitutionFilterIds, user]);

  const selectedIds = institutionFilterAll
    ? institutions.map((institution) => institution.id)
    : getValidInstitutionIds(institutionFilterIds);

  const selectedLabel = (() => {
    if (institutionFilterAll) return 'Todas';
    if (selectedIds.length === 0) return currentInstitution?.name || 'Selecionar';
    if (selectedIds.length === 1) {
      return institutions.find((institution) => institution.id === selectedIds[0])?.name || 'Selecionar';
    }
    return `${selectedIds.length} selecionadas`;
  })();

  const applyFilter = async (nextAll: boolean, nextIds: string[]) => {
    setIsLoading(true);
    try {
      if (nextAll) {
        setInstitutionFilterAll(true);
      } else {
        setInstitutionFilterIds(nextIds);
      }

      await Promise.all([
        queryClient.invalidateQueries(),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['teachers'] }),
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['announcements'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if only one institution
  if (institutions.length <= 1) {
    // Still show current institution name
    return (
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-400">
          Instituição atual
        </p>
        <div className="flex items-center gap-2 text-sm">
          <BuildingOffice2Icon className="h-5 w-5 text-secondary-400" />
          <span className="max-w-[180px] truncate font-medium text-secondary-700">
            {currentInstitution?.name || user?.institution?.name || 'Instituição'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-400">
        Instituição atual
      </p>

      <Menu as="div" className="relative">
        <Menu.Button
          className="flex w-full items-center gap-2 rounded-lg px-0 py-0 text-sm font-medium text-secondary-700 transition-colors hover:text-secondary-900"
          disabled={isLoading}
        >
          <BuildingOffice2Icon className="h-5 w-5 text-secondary-400" />
          <span className="flex-1 truncate text-left">
            {selectedLabel}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-secondary-400" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-10 mt-2 w-64 origin-top-left rounded-xl bg-white py-2 shadow-lg ring-1 ring-secondary-900/5 focus:outline-none">
            <div className="px-4 py-2 border-b border-secondary-100">
              <p className="text-xs font-semibold text-secondary-500 uppercase">
                Filtrar Instituições
              </p>
            </div>

            <div className="py-1 max-h-64 overflow-y-auto">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => applyFilter(true, [])}
                    disabled={isLoading}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2 text-sm',
                      active ? 'bg-secondary-50' : '',
                      institutionFilterAll ? 'text-primary-600 font-medium' : 'text-secondary-700'
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded border border-secondary-300 bg-white">
                      {institutionFilterAll ? <CheckIcon className="h-4 w-4 text-primary-600" /> : null}
                    </span>
                    <span className="flex-1 text-left truncate">Todas</span>
                  </button>
                )}
              </Menu.Item>

              {institutions.map((institution) => (
                <Menu.Item key={institution.id}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => {
                        const isSelected = selectedIds.includes(institution.id);
                        const next = isSelected
                          ? selectedIds.filter((id) => id !== institution.id)
                          : [...selectedIds, institution.id];
                        void applyFilter(false, next);
                      }}
                      disabled={isLoading}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2 text-sm',
                        active ? 'bg-secondary-50' : '',
                        selectedIds.includes(institution.id) ? 'text-primary-600 font-medium' : 'text-secondary-700'
                      )}
                    >
                      {institution.logo ? (
                        <img
                          src={institution.logo}
                          alt={institution.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : (
                        <BuildingOffice2Icon className="h-5 w-5 text-secondary-400" />
                      )}
                      <span className="flex-1 text-left truncate">
                        {institution.name}
                      </span>
                      {selectedIds.includes(institution.id) && <CheckIcon className="h-5 w-5 text-primary-500" />}
                      {institution.isPrimary && institution.id !== user?.institutionId && (
                        <span className="text-xs text-secondary-400">Principal</span>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
