'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  AcademicCapIcon,
  ShieldCheckIcon,
  UsersIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function SelectProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [availableProfiles, setAvailableProfiles] = useState<
    Array<{ type: string; label: string; description: string; icon: any; href: string; color: string }>
  >([]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/');
      return;
    }

    // Build list of available profiles
    const profiles = [];

    // Check for admin/coordinator roles
    if (user.role === 'SUPER_ADMIN') {
      profiles.push({
        type: 'SUPER_ADMIN',
        label: 'Super Administrador',
        description: 'Gestão global do sistema',
        icon: ShieldCheckIcon,
        href: '/admin/dashboard',
        color: 'from-purple-600 to-indigo-600',
      });
    }

    if (user.role === 'INSTITUTION_ADMIN') {
      profiles.push({
        type: 'INSTITUTION_ADMIN',
        label: 'Administrador',
        description: 'Gestão da instituição',
        icon: ShieldCheckIcon,
        href: '/admin/dashboard',
        color: 'from-grafos-teal to-grafos-green',
      });
    }

    if (user.role === 'COORDINATOR') {
      profiles.push({
        type: 'COORDINATOR',
        label: 'Coordenador',
        description: 'Coordenação pedagógica',
        icon: ShieldCheckIcon,
        href: '/coordinator/dashboard',
        color: 'from-grafos-blue to-grafos-teal',
      });
    }

    // Check for teacher profile
    if (user.teacherProfile?.isActive) {
      profiles.push({
        type: 'TEACHER',
        label: 'Professor',
        description: 'Área docente',
        icon: AcademicCapIcon,
        href: '/professor/dashboard',
        color: 'from-grafos-green to-grafos-teal',
      });
    }

    // Check for student profile
    if (user.studentProfile?.isActive) {
      profiles.push({
        type: 'STUDENT',
        label: 'Aluno',
        description: 'Portal do estudante',
        icon: UsersIcon,
        href: '/aluno/dashboard',
        color: 'from-grafos-lime to-grafos-green',
      });
    }

    // Check for parent profile
    if (user.parentProfile?.isActive) {
      profiles.push({
        type: 'PARENT',
        label: 'Responsável',
        description: 'Acompanhamento familiar',
        icon: UserGroupIcon,
        href: '/responsaveis/dashboard',
        color: 'from-grafos-blue to-grafos-teal',
      });
    }

    setAvailableProfiles(profiles);

    // If only one profile, redirect automatically
    if (profiles.length === 1) {
      router.push(profiles[0].href);
    }

    // If no profiles, redirect to pending approval
    if (profiles.length === 0) {
      router.push('/pending-approval');
    }
  }, [user, router]);

  const handleProfileSelect = (href: string) => {
    router.push(href);
  };

  if (!user || availableProfiles.length <= 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-grafos-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Selecione seu Perfil
          </h1>
          <p className="text-lg text-gray-600">
            Olá, <span className="font-semibold">{user.firstName} {user.lastName}</span>!
            <br />
            Você possui múltiplos perfis. Escolha como deseja acessar o sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableProfiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <button
                key={profile.type}
                onClick={() => handleProfileSelect(profile.href)}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-left focus:outline-none focus:ring-2 focus:ring-grafos-green focus:ring-offset-2"
              >
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${profile.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
                />

                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${profile.color} mb-4 transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {profile.label}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {profile.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-sm font-semibold text-gray-900 group-hover:text-grafos-green transition-colors">
                  Acessar
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Você poderá alternar entre seus perfis a qualquer momento através do menu.
          </p>
        </div>
      </div>
    </div>
  );
}
