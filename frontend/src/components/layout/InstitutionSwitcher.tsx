'use client';

import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, BuildingOffice2Icon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { clientCookies } from '@/lib/cookies';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
  const { user, setTokens } = useAuthStore();
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

  const handleSwitchInstitution = async (institution: Institution) => {
    if (institution.id === user?.institutionId) return;

    setIsLoading(true);
    try {
      const tokens = await authService.switchInstitution(institution.id);

      // Update tokens in store and cookies
      setTokens(tokens.accessToken, tokens.refreshToken);
      clientCookies.setAuthTokens(tokens.accessToken, tokens.refreshToken);

      // Update current institution
      setCurrentInstitution(institution);

      toast.success(`Você está agora em ${institution.name}`);

      router.refresh();
    } catch (error) {
      console.error('Failed to switch institution:', error);
      toast.error('Erro ao trocar de instituição');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if only one institution
  if (institutions.length <= 1) {
    // Still show current institution name
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <BuildingOffice2Icon className="h-5 w-5 text-secondary-400" />
        <span className="font-medium text-secondary-700 max-w-[150px] truncate">
          {currentInstitution?.name || user?.institution?.name || 'Instituição'}
        </span>
      </div>
    );
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
        disabled={isLoading}
      >
        <BuildingOffice2Icon className="h-5 w-5 text-secondary-400" />
        <span className="max-w-[150px] truncate">
          {currentInstitution?.name || 'Selecionar'}
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
              Trocar Instituição
            </p>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {institutions.map((institution) => (
              <Menu.Item key={institution.id}>
                {({ active }) => (
                  <button
                    onClick={() => handleSwitchInstitution(institution)}
                    disabled={isLoading || institution.id === user?.institutionId}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2 text-sm',
                      active ? 'bg-secondary-50' : '',
                      institution.id === user?.institutionId
                        ? 'text-primary-600 font-medium'
                        : 'text-secondary-700'
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
                    {institution.id === user?.institutionId && (
                      <CheckIcon className="h-5 w-5 text-primary-500" />
                    )}
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
  );
}
