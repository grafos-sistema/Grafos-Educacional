'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { usersService } from '@/services/users.service';
import { User } from '@/types/user.types';
import { cn } from '@/lib/utils';

interface BulkApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
}

const PROFILE_OPTIONS = [
  { value: 'TEACHER', label: 'Professor', description: 'Acesso ao banco de questões e gestão de turmas' },
  { value: 'STUDENT', label: 'Aluno', description: 'Acesso a notas, atividades e conteúdos' },
  { value: 'PARENT', label: 'Responsável', description: 'Acompanhamento de alunos vinculados' },
] as const;

export function BulkApproveModal({ isOpen, onClose, users }: BulkApproveModalProps) {
  const queryClient = useQueryClient();

  // Map user ID to selected profile type
  const [selectedProfiles, setSelectedProfiles] = useState<Record<string, 'TEACHER' | 'STUDENT' | 'PARENT'>>(() => {
    const initial: Record<string, 'TEACHER' | 'STUDENT' | 'PARENT'> = {};
    users.forEach((user) => {
      if (user.requestedProfileType) {
        initial[user.id] = user.requestedProfileType as any;
      }
    });
    return initial;
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      const approvals = users.map((user) => ({
        userId: user.id,
        profileType: selectedProfiles[user.id],
        profileData: {},
      }));

      // Validate all users have a profile selected
      const missingProfiles = approvals.filter((a) => !a.profileType);
      if (missingProfiles.length > 0) {
        throw new Error('Selecione um perfil para todos os usuários');
      }

      return usersService.bulkApprove(approvals);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Show results summary
      if (result.approved.length > 0) {
        toast.success(`${result.approved.length} usuário(s) aprovado(s) com sucesso!`);
      }
      if (result.failed.length > 0) {
        result.failed.forEach((f: any) => {
          toast.error(`Erro: ${f.error}`);
        });
      }

      onClose();
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const setProfileForUser = (userId: string, profileType: 'TEACHER' | 'STUDENT' | 'PARENT') => {
    setSelectedProfiles((prev) => ({
      ...prev,
      [userId]: profileType,
    }));
  };

  const allProfilesSelected = users.every((user) => selectedProfiles[user.id]);

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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                      Aprovar Cadastros em Massa
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Summary */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {users.length} usuário(s) selecionado(s) para aprovação
                  </p>
                </div>

                {/* Users List */}
                <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        {user.requestedProfileType && (
                          <div className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded">
                            Solicitou: {PROFILE_OPTIONS.find(p => p.value === user.requestedProfileType)?.label}
                          </div>
                        )}
                      </div>

                      {/* Profile Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Selecione o perfil:
                        </label>
                        <div className="flex gap-2">
                          {PROFILE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setProfileForUser(user.id, option.value)}
                              className={cn(
                                'flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm',
                                selectedProfiles[user.id] === option.value
                                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  'font-medium',
                                  selectedProfiles[user.id] === option.value
                                    ? 'text-primary-900 dark:text-primary-300'
                                    : 'text-gray-700 dark:text-gray-300'
                                )}>
                                  {option.label}
                                </span>
                                {selectedProfiles[user.id] === option.value && (
                                  <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Error Message */}
                {approveMutation.isError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {approveMutation.error instanceof Error
                        ? approveMutation.error.message
                        : 'Erro ao aprovar usuários'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={!allProfilesSelected || approveMutation.isPending}
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
                        Aprovar {users.length} Usuário(s)
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
