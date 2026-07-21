'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import idebService from '@/services/ideb.service';
import LineChart from '@/components/charts/LineChart';

export default function IDEBHistory() {
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('5º ano');

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

  // Buscar evolução histórica
  const { data: historicalData = [], isLoading } = useQuery({
    queryKey: ['ideb-history', selectedGradeLevel],
    queryFn: () => idebService.getHistoricalTrend(selectedGradeLevel, 10),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando evolução histórica...</div>
      </div>
    );
  }

  // Preparar dados para gráficos
  const chartData = historicalData.map((item) => ({
    ano: item.year.toString(),
    'IDEB': item.idebScore,
    'Taxa de Aprovação': item.approvalRate * 10, // Escala 0-10
    'Proficiência': item.averageProficiency,
  }));

  const flowChartData = historicalData.map((item) => ({
    ano: item.year.toString(),
    'Aprovação (%)': item.approvalRate * 100,
    'Abandono (%)': item.dropoutRate * 100,
    'Reprovação (%)': item.repetitionRate * 100,
  }));

  const proficiencyChartData = historicalData
    .filter((item) => item.mathProficiency || item.portugueseProficiency)
    .map((item) => ({
      ano: item.year.toString(),
      'Matemática': item.mathProficiency || 0,
      'Português': item.portugueseProficiency || 0,
      'Média': item.averageProficiency,
    }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evolução Histórica do IDEB</h1>
            <p className="mt-2 text-gray-600">Acompanhe a evolução dos indicadores ao longo do tempo</p>
          </div>
          <div>
            <select
              value={selectedGradeLevel}
              onChange={(e) => setSelectedGradeLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {gradeLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      {historicalData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Nenhum dado histórico disponível para {selectedGradeLevel}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Evolução do IDEB */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <LineChart
              title={`Evolução do IDEB - ${selectedGradeLevel}`}
              data={chartData}
              xKey="ano"
              yKeys={[
                { key: 'IDEB', name: 'IDEB', color: '#3B82F6' },
                { key: 'Taxa de Aprovação', name: 'Taxa de Aprovação (escala 0-10)', color: '#10B981' },
                { key: 'Proficiência', name: 'Proficiência Média', color: '#F59E0B' },
              ]}
              height={400}
            />
          </div>

          {/* Indicadores de Fluxo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <LineChart
              title="Indicadores de Fluxo Escolar"
              data={flowChartData}
              xKey="ano"
              yKeys={[
                { key: 'Aprovação (%)', name: 'Taxa de Aprovação', color: '#10B981' },
                { key: 'Reprovação (%)', name: 'Taxa de Reprovação', color: '#F59E0B' },
                { key: 'Abandono (%)', name: 'Taxa de Abandono', color: '#EF4444' },
              ]}
              height={400}
            />
          </div>

          {/* Proficiência por Disciplina */}
          {proficiencyChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <LineChart
                title="Proficiência por Disciplina"
                data={proficiencyChartData}
                xKey="ano"
                yKeys={[
                  { key: 'Matemática', name: 'Matemática', color: '#8B5CF6' },
                  { key: 'Português', name: 'Português', color: '#EC4899' },
                  { key: 'Média', name: 'Média Geral', color: '#3B82F6' },
                ]}
                height={400}
              />
            </div>
          )}

          {/* Tabela de dados */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Dados Detalhados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IDEB
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aprovação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Proficiência
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Alunos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicalData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-lg font-semibold text-blue-600">
                          {item.idebScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(item.approvalRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.averageProficiency.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.evaluatedStudents}/{item.totalStudents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
