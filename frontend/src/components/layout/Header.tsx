'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/constants/roles';
import { cn } from '@/lib/utils';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ProfileSwitcher } from './ProfileSwitcher';
import { NotificationsBell } from './NotificationsBell';
import { InstitutionSwitcher } from './InstitutionSwitcher';
import { UserRole } from '@/types/user.types';
import { useMunicipalityConfig } from '@/config/municipality.config';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const municipalityConfig = useMunicipalityConfig();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-secondary-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Municipality Logo and Name */}
      <div className="flex items-center gap-3">
        {municipalityConfig.logo && (
          <Image
            src={municipalityConfig.logo}
            alt={`Logo ${municipalityConfig.shortName}`}
            width={40}
            height={40}
            className="rounded-lg object-contain"
          />
        )}
        <div className="hidden md:block">
          <p className="text-sm font-bold text-secondary-900" style={{ color: 'var(--color-primary)' }}>
            {municipalityConfig.shortName}
          </p>
          {municipalityConfig.state && (
            <p className="text-xs text-secondary-500">
              {municipalityConfig.slogan}
            </p>
          )}
        </div>
      </div>

      {/* Page Title */}
      {title && (
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          </div>
        </div>
      )}

      {/* Right side */}
      <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
        {/* Institution Switcher - Don't show for Super Admin */}
        {user?.role !== UserRole.SUPER_ADMIN && <InstitutionSwitcher />}

        {/* Notifications */}
        <NotificationsBell />

        {/* Profile dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors">
            <span className="sr-only">Open user menu</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white shadow-md">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-2 text-sm font-semibold leading-6 text-secondary-900" aria-hidden="true">
                {user?.firstName} {user?.lastName}
              </span>
              <svg
                className="ml-2 h-5 w-5 text-secondary-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
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
            <Menu.Items className="absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-secondary-900/5 focus:outline-none">
              {/* User info */}
              <div className="px-4 py-3 border-b border-secondary-100">
                <p className="text-sm font-medium text-secondary-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">{user?.email}</p>
                <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 mt-2">
                  {user?.role && ROLE_LABELS[user.role]}
                </span>
              </div>

              {/* Profile Switcher */}
              <ProfileSwitcher />

              {/* Menu items */}
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/perfil"
                      className={cn(
                        active ? 'bg-secondary-50' : '',
                        'flex items-center gap-3 px-4 py-2 text-sm text-secondary-700'
                      )}
                    >
                      <UserCircleIcon className="h-5 w-5 text-secondary-400" />
                      Meu Perfil
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/configuracoes"
                      className={cn(
                        active ? 'bg-secondary-50' : '',
                        'flex items-center gap-3 px-4 py-2 text-sm text-secondary-700'
                      )}
                    >
                      <Cog6ToothIcon className="h-5 w-5 text-secondary-400" />
                      Configurações
                    </Link>
                  )}
                </Menu.Item>
              </div>

              {/* Logout */}
              <div className="border-t border-secondary-100 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={cn(
                        active ? 'bg-danger-50 text-danger-700' : 'text-secondary-700',
                        'flex w-full items-center gap-3 px-4 py-2 text-sm'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 text-danger-500" />
                      Sair
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
