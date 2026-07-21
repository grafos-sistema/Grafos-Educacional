'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import idebService, { type IDEBTarget } from '@/services/ideb.service';

export default function IDEBTargets() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<IDEBTarget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; targetId: string | null }>({
    isOpen: false,
    targetId: null,
  });

  // Buscar metas
  const { data: targets = [], isLoading } = useQuery<IDEBTarget[]>({
    queryKey: ['ideb-targets', selectedYear],
    queryFn: () => idebService.getTargets(selectedYear),
  });

  // Criar meta
  const createMutation = useMutation({
    mutationFn: idebService.createTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideb-targets'] });
      setShowModal(false);
      toast.success('Meta criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar meta');
    },
  });

  // Atualizar meta
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      idebService.updateTarget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideb-targets'] });
      setEditingTarget(null);
      setShowModal(false);
      toast.success('Meta atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar meta');
    },
  });

  // Deletar meta
  const deleteMutation = useMutation({
    mutationFn: idebService.deleteTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideb-targets'] });
      setDeleteConfirm({ isOpen: false, targetId: null });
      toast.success('Meta deletada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao deletar meta');
    },
  });

  const handleEdit = (target: IDEBTarget) => {
    setEditingTarget(target);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, targetId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.targetId) {
      deleteMutation.mutate(deleteConfirm.targetId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando metas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Metas IDEB</h1>
            <p className="mt-2 text-gray-600">Defina e gerencie as metas de IDEB por série</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(5)].map((_, i) => {
                const year = currentYear + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => {
                setEditingTarget(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Nova Meta
            </button>
          </div>
        </div>
      </div>

      {/* Lista de metas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {targets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma meta definida para {selectedYear}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Série
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Meta Institucional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Meta Nacional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Meta Estadual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {targets.map((target) => (
                <tr key={target.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {target.gradeLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-lg font-semibold text-blue-600">
                      {target.target.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {target.nationalTarget?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {target.stateTarget?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(target)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(target.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de criar/editar */}
      {showModal && (
        <TargetModal
          year={selectedYear}
          target={editingTarget}
          onClose={() => {
            setShowModal(false);
            setEditingTarget(null);
          }}
          onSave={(data) => {
            if (editingTarget) {
              updateMutation.mutate({ id: editingTarget.id, data });
            } else {
              createMutation.mutate({ ...data, year: selectedYear });
            }
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar exclusão</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja deletar esta meta? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, targetId: null })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal de criar/editar meta
function TargetModal({
  year,
  target,
  onClose,
  onSave,
}: {
  year: number;
  target: IDEBTarget | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    gradeLevel: target?.gradeLevel || '',
    target: target?.target || 0,
    nationalTarget: target?.nationalTarget || undefined,
    stateTarget: target?.stateTarget || undefined,
  });

  const gradeLevels = [
    '1º ano',
    '2º ano',
    '3º ano',
    '4º ano',
    '5º ano',
    '6º ano',
    '7º ano',
    '8º ano',
    '9º ano',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">
          {target ? 'Editar Meta' : 'Nova Meta'} - {year}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Série/Ano Escolar *
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!target}
            >
              <option value="">Selecione...</option>
              {gradeLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Institucional * (0-10)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.target}
              onChange={(e) =>
                setFormData({ ...formData, target: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Nacional (0-10)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.nationalTarget || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nationalTarget: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Estadual (0-10)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.stateTarget || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stateTarget: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {target ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
