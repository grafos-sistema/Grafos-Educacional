'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supportTicketsService } from '@/services/support-tickets.service';
import { useAuthStore } from '@/stores/authStore';
import type { SupportTicket } from '@/types/support-ticket.types';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCpf(value?: string | null) {
  if (!value) return '-';
  const digits = value.replace(/\D/g, '');
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function getStatusBadgeVariant(status: SupportTicket['status']) {
  return status === 'RESOLVED' ? 'success' : 'warning';
}

export default function SuperAdminSupportTicketsPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportTicketsService.listAll(),
  });

  const resolveMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!currentUser?.id) {
        throw new Error('Nao foi possivel identificar o Super Admin logado.');
      }
      return supportTicketsService.resolve(ticketId, currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Chamado marcado como resolvido.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar o chamado.');
    },
  });

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
      if (!matchesStatus) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        ticket.name,
        ticket.email,
        ticket.cpf,
        ticket.description,
        ticket.requesterRole,
        ticket.source,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [search, statusFilter, tickets]);

  const openTickets = tickets.filter((ticket) => ticket.status === 'OPEN').length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chamados de Suporte</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Acompanhe os pedidos abertos pelos usuarios nas telas de login e marque como resolvido quando o atendimento for concluido.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{tickets.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm text-amber-700 dark:text-amber-300">Em aberto</p>
          <p className="mt-2 text-3xl font-bold text-amber-900 dark:text-amber-100">{openTickets}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Resolvidos</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900 dark:text-emerald-100">{resolvedTickets}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 dark:border-gray-700">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, email, CPF ou descricao"
              className="h-12 w-full bg-transparent text-sm outline-none"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'OPEN' | 'RESOLVED')}
            className="h-12 rounded-xl border border-gray-200 px-4 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="ALL">Todos os status</option>
            <option value="OPEN">Em aberto</option>
            <option value="RESOLVED">Resolvidos</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            Carregando chamados...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            Nenhum chamado encontrado com os filtros atuais.
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.name}</h2>
                    <Badge variant={getStatusBadgeVariant(ticket.status)} size="sm">
                      {ticket.status === 'OPEN' ? 'Em aberto' : 'Resolvido'}
                    </Badge>
                    {ticket.requesterRole ? (
                      <Badge variant="default" size="sm">
                        {ticket.requesterRole}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-2">
                    <p>
                      <span className="font-medium text-gray-900 dark:text-white">Email:</span> {ticket.email}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900 dark:text-white">CPF:</span> {formatCpf(ticket.cpf)}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900 dark:text-white">Celular:</span> {ticket.phone || '-'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900 dark:text-white">Origem:</span> {ticket.source || '-'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900 dark:text-white">Abertura:</span> {formatDateTime(ticket.createdAt)}
                    </p>
                    {ticket.resolvedAt ? (
                      <p className="md:col-span-2">
                        <span className="font-medium text-gray-900 dark:text-white">Resolvido em:</span> {formatDateTime(ticket.resolvedAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    {ticket.description}
                  </div>

                  {ticket.attachments.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Imagens enviadas</p>
                      <div className="flex flex-wrap gap-3">
                        {ticket.attachments.map((attachment) => (
                          <a
                            key={attachment.path}
                            href={attachment.signedUrl ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            {attachment.signedUrl ? (
                              <img
                                src={attachment.signedUrl}
                                alt={attachment.fileName}
                                className="h-24 w-24 rounded-xl border border-gray-200 object-cover dark:border-gray-700"
                              />
                            ) : (
                              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 dark:border-gray-700">
                                Imagem indisponivel
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-3 lg:w-[220px]">
                  {ticket.status === 'OPEN' ? (
                    <Button
                      onClick={() => resolveMutation.mutate(ticket.id)}
                      disabled={resolveMutation.isPending}
                      leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                      Marcar como resolvido
                    </Button>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                      Chamado finalizado.
                    </div>
                  )}

                  <div className="rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    Entre em contato com o usuario por email para orientar a troca de senha ou confirmar a solucao.
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
