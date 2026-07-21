'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user.types';
import {
  AcademicCapIcon,
  UserGroupIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfileSwitcher() {
  const { user, activeProfile, setActiveProfile, getAvailableProfiles } = useAuthStore();
  const router = useRouter();

  const availableProfiles = getAvailableProfiles();

  // Não mostra se tem apenas um perfil
  if (!user || availableProfiles.length <= 1) {
    return null;
  }

  const getProfileIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.INSTITUTION_ADMIN:
        return ShieldCheckIcon;
      case UserRole.COORDINATOR:
      case UserRole.TEACHER:
        return AcademicCapIcon;
      case UserRole.STUDENT:
        return UsersIcon;
      case UserRole.PARENT:
        return UserGroupIcon;
      default:
        return AcademicCapIcon;
    }
  };

  const getProfileLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.INSTITUTION_ADMIN:
        return 'Administrador';
      case UserRole.COORDINATOR:
        return 'Coordenador';
      case UserRole.TEACHER:
        return 'Professor';
      case UserRole.STUDENT:
        return 'Aluno';
      case UserRole.PARENT:
        return 'Família';
      default:
        return role;
    }
  };

  const getRedirectPathByRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return '/admin/dashboard';
      case UserRole.INSTITUTION_ADMIN:
        return '/admin/dashboard';
      case UserRole.COORDINATOR:
        return '/coordinator/dashboard';
      case UserRole.TEACHER:
        return '/professor/dashboard';
      case UserRole.STUDENT:
        return '/aluno/dashboard';
      case UserRole.PARENT:
        return '/responsaveis/dashboard';
      default:
        return '/dashboard';
    }
  };

  const handleProfileSwitch = (profile: UserRole) => {
    if (profile === activeProfile) return;

    setActiveProfile(profile);
    const redirectPath = getRedirectPathByRole(profile);
    router.push(redirectPath);
  };

  const currentProfile = activeProfile || user.role;
  const CurrentIcon = getProfileIcon(currentProfile);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          <CurrentIcon className="h-5 w-5 mr-2 text-grafos-green" aria-hidden="true" />
          {getProfileLabel(currentProfile)}
          <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trocar Perfil
              </p>
            </div>

            {availableProfiles.map((profile) => {
              const Icon = getProfileIcon(profile);
              const isActive = profile === currentProfile;

              return (
                <Menu.Item key={profile}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => handleProfileSwitch(profile)}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'group flex items-center px-4 py-2 text-sm w-full text-left transition-colors'
                      )}
                    >
                      <Icon
                        className={classNames(
                          isActive ? 'text-grafos-green' : 'text-gray-400 group-hover:text-grafos-green',
                          'mr-3 h-5 w-5'
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{getProfileLabel(profile)}</span>
                      {isActive && (
                        <CheckIcon className="h-5 w-5 text-grafos-green" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
