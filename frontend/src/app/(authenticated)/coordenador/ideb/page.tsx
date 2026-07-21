'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import idebService, { type IDEBDashboard, type IDEBComparison } from '@/services/ideb.service';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';

export default function IDEBDashboard() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);

  // Buscar dashboard
  const { data: dashboard, isLoading } = useQuery<IDEBDashboard>({
    queryKey: ['ideb-dashboard', selectedYear],
    queryFn: () => idebService.getDashboard(selectedYear),
  });

  // Calcular indicador
  const calculateMutation = useMutation({
    mutationFn: (data: { year: number; gradeLevel: string }) =>
      idebService.calculateIndicator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideb-dashboard'] });
      setShowCalculateModal(false);
      toast.success('Indicador IDEB calculado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao calcular indicador IDEB');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando dashboard IDEB...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Nenhum dado disponível</div>
      </div>
    );
  }

  const { summary, comparison, indicators } = dashboard;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard IDEB</h1>
            <p className="mt-2 text-gray-600">
              Acompanhe os indicadores de desenvolvimento da educação básica
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(5)].map((_, i) => {
                const year = currentYear - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => setShowCalculateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Calcular IDEB
            </button>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="IDEB Médio"
          value={summary.averageIDEB.toFixed(2)}
          subtitle="Média institucional"
          color="blue"
        />
        <SummaryCard
          title="Séries Avaliadas"
          value={summary.totalGradeLevels.toString()}
          subtitle={`${summary.targetsSet} metas definidas`}
          color="green"
        />
        <SummaryCard
          title="Metas Alcançadas"
          value={summary.targetsAchieved.toString()}
          subtitle={`${summary.achievementRate.toFixed(0)}% de sucesso`}
          color="purple"
        />
        <SummaryCard
          title="Taxa de Aprovação"
          value={
            indicators.length > 0
              ? (
                  (indicators.reduce((sum, ind) => sum + ind.approvalRate, 0) /
                    indicators.length) *
                  100
                ).toFixed(1) + '%'
              : 'N/A'
          }
          subtitle="Média geral"
          color="orange"
        />
      </div>

      {/* Gráficos de comparação */}
      {comparison.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de barras - IDEB vs Metas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <BarChart
              title="IDEB x Metas por Série"
              data={comparison.map((c) => ({
                serie: c.gradeLevel,
                'IDEB Atual': c.idebScore,
                'Meta': c.target || 0,
                'Meta Nacional': c.nationalTarget || 0,
              }))}
              xKey="serie"
              yKeys={[
                { key: 'IDEB Atual', name: 'IDEB Atual', color: '#3B82F6' },
                { key: 'Meta', name: 'Meta Institucional', color: '#10B981' },
                { key: 'Meta Nacional', name: 'Meta Nacional', color: '#F59E0B' },
              ]}
              height={350}
            />
          </div>

          {/* Gráfico de pizza - Taxa de alcance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <PieChart
              title="Distribuição de Alcance de Metas"
              data={[
                {
                  name: 'Metas Alcançadas',
                  value: comparison.filter((c) => c.achieved).length,
                },
                {
                  name: 'Metas Não Alcançadas',
                  value: comparison.filter((c) => !c.achieved).length,
                },
              ]}
              colors={['#10B981', '#EF4444']}
              height={350}
            />
          </div>
        </div>
      )}

      {/* Comparação com metas */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Comparação Detalhada com Metas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Série
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IDEB Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Meta Institucional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Meta Nacional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Diferença
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparison.map((item) => (
                <ComparisonRow key={item.gradeLevel} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicadores detalhados */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Indicadores Detalhados</h2>
        <div className="space-y-4">
          {indicators.map((indicator) => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
      </div>

      {/* Modal de calcular */}
      {showCalculateModal && (
        <CalculateModal
          year={selectedYear}
          onClose={() => setShowCalculateModal(false)}
          onCalculate={(gradeLevel) => {
            calculateMutation.mutate({ year: selectedYear, gradeLevel });
          }}
        />
      )}
    </div>
  );
}

// Componente de card de resumo
function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-sm mt-1 opacity-70">{subtitle}</p>
    </div>
  );
}

// Componente de linha de comparação
function ComparisonRow({ item }: { item: IDEBComparison }) {
  const achieved = item.achieved;

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {item.gradeLevel}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
        {item.idebScore.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {item.target?.toFixed(2) || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {item.nationalTarget?.toFixed(2) || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {item.difference !== null ? (
          <span className={item.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
            {item.difference >= 0 ? '+' : ''}
            {item.difference.toFixed(2)}
          </span>
        ) : (
          'N/A'
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {achieved !== null && (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              achieved
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {achieved ? 'Alcançada' : 'Não alcançada'}
          </span>
        )}
      </td>
    </tr>
  );
}

// Componente de card de indicador
function IndicatorCard({ indicator }: { indicator: any }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{indicator.gradeLevel}</h3>
        <div className="text-2xl font-bold text-blue-600">
          IDEB: {indicator.idebScore.toFixed(2)}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500">Taxa de Aprovação</p>
          <p className="text-lg font-semibold text-green-600">
            {(indicator.approvalRate * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Taxa de Abandono</p>
          <p className="text-lg font-semibold text-red-600">
            {(indicator.dropoutRate * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Proficiência Média</p>
          <p className="text-lg font-semibold text-purple-600">
            {indicator.averageProficiency.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Alunos Avaliados</p>
          <p className="text-lg font-semibold text-gray-700">
            {indicator.evaluatedStudents}/{indicator.totalStudents}
          </p>
        </div>
      </div>
      {(indicator.mathProficiency || indicator.portugueseProficiency) && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4">
          {indicator.mathProficiency && (
            <div className="flex-1">
              <p className="text-xs text-gray-500">Matemática</p>
              <p className="text-sm font-semibold">{indicator.mathProficiency.toFixed(2)}</p>
            </div>
          )}
          {indicator.portugueseProficiency && (
            <div className="flex-1">
              <p className="text-xs text-gray-500">Português</p>
              <p className="text-sm font-semibold">
                {indicator.portugueseProficiency.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Modal de calcular IDEB
function CalculateModal({
  year,
  onClose,
  onCalculate,
}: {
  year: number;
  onClose: () => void;
  onCalculate: (gradeLevel: string) => void;
}) {
  const [gradeLevel, setGradeLevel] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Calcular Indicador IDEB</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ano: {year}
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Série/Ano Escolar *
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecione...</option>
            {gradeLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => gradeLevel && onCalculate(gradeLevel)}
            disabled={!gradeLevel}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Calcular
          </button>
        </div>
      </div>
    </div>
  );
}
