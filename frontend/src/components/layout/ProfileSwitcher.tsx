'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  AcademicCapIcon,
  ShieldCheckIcon,
  UsersIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types/user.types';

interface ProfileOption {
  type: string;
  label: string;
  icon: any;
  href: string;
  isActive: boolean;
}

export function ProfileSwitcher() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  // Build list of available profiles
  const profiles: ProfileOption[] = [];

  // Check for admin/coordinator roles
  if (user.role === UserRole.SUPER_ADMIN) {
    profiles.push({
      type: 'SUPER_ADMIN',
      label: 'Super Admin',
      icon: ShieldCheckIcon,
      href: '/admin/dashboard',
      isActive: false,
    });
  }

  if (user.role === UserRole.INSTITUTION_ADMIN) {
    profiles.push({
      type: 'INSTITUTION_ADMIN',
      label: 'Administrador',
      icon: ShieldCheckIcon,
      href: '/admin/dashboard',
      isActive: false,
    });
  }

  if (user.role === UserRole.COORDINATOR) {
    profiles.push({
      type: 'COORDINATOR',
      label: 'Coordenador',
      icon: ShieldCheckIcon,
      href: '/coordinator/dashboard',
      isActive: false,
    });
  }

  // Check for teacher profile
  if (user.teacherProfile?.isActive) {
    profiles.push({
      type: 'TEACHER',
      label: 'Professor',
      icon: AcademicCapIcon,
      href: '/professor/dashboard',
      isActive: false,
    });
  }

  // Check for student profile
  if (user.studentProfile?.isActive) {
    profiles.push({
      type: 'STUDENT',
      label: 'Aluno',
      icon: UsersIcon,
      href: '/aluno/dashboard',
      isActive: false,
    });
  }

  // Check for parent profile
  if (user.parentProfile?.isActive) {
    profiles.push({
      type: 'PARENT',
      label: 'Responsável',
      icon: UserGroupIcon,
      href: '/responsaveis/dashboard',
      isActive: false,
    });
  }

  // If only one profile, don't show switcher
  if (profiles.length <= 1) {
    return null;
  }

  // Detect current active profile based on URL
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    profiles.forEach((profile) => {
      if (currentPath.startsWith(profile.href.split('/dashboard')[0])) {
        profile.isActive = true;
      }
    });
  }

  const handleProfileSwitch = (href: string) => {
    router.push(href);
  };

  return (
    <div className="px-4 py-3 border-b border-secondary-100">
      <div className="flex items-center gap-2 mb-2">
        <ArrowsRightLeftIcon className="h-4 w-4 text-secondary-400" />
        <span className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">
          Trocar Perfil
        </span>
      </div>
      <div className="space-y-1">
        {profiles.map((profile) => {
          const Icon = profile.icon;
          return (
            <button
              key={profile.type}
              onClick={() => handleProfileSwitch(profile.href)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors',
                profile.isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-secondary-700 hover:bg-secondary-50'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                profile.isActive ? 'text-primary-600' : 'text-secondary-400'
              )} />
              <span className="flex-1 text-left">{profile.label}</span>
              {profile.isActive && (
                <CheckCircleIcon className="h-4 w-4 text-primary-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
