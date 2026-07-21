'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { User } from '@/types/user.types';
import { cn } from '@/lib/utils';

interface QuickApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const PROFILE_OPTIONS = [
  { value: 'TEACHER', label: 'Professor', description: 'Acesso ao banco de questões e gestão de turmas' },
  { value: 'STUDENT', label: 'Aluno', description: 'Acesso a notas, atividades e conteúdos' },
  { value: 'PARENT', label: 'Responsável', description: 'Acompanhamento de alunos vinculados' },
] as const;

export function QuickApproveModal({ isOpen, onClose, user }: QuickApproveModalProps) {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<'TEACHER' | 'STUDENT' | 'PARENT' | null>(
    user.requestedProfileType as any || null
  );

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!selectedProfile) throw new Error('Selecione um perfil');
      return usersService.quickApprove(user.id, selectedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onClose();
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <UserPlusIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      Aprovar Cadastro
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* User Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {user.requestedProfileType && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Perfil Solicitado:</p>
                      <p className="text-sm font-medium text-primary-600">
                        {PROFILE_OPTIONS.find(p => p.value === user.requestedProfileType)?.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Profile Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Selecione o perfil a adicionar:
                  </label>
                  <div className="space-y-2">
                    {PROFILE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedProfile(option.value)}
                        className={cn(
                          'w-full text-left p-4 rounded-lg border-2 transition-all',
                          selectedProfile === option.value
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{option.label}</p>
                            <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                          </div>
                          {selectedProfile === option.value && (
                            <CheckCircleIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {approveMutation.isError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      {approveMutation.error instanceof Error
                        ? approveMutation.error.message
                        : 'Erro ao aprovar usuário'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={!selectedProfile || approveMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Aprovando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Aprovar Cadastro
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
