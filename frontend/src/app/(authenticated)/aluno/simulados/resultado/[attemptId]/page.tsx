'use client';

import { useQuery } from '@tanstack/react-query';
import { examsService } from '@/services/exams.service';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrophyIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
  LightBulbIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface PageProps {
  params: {
    attemptId: string;
  };
}

const proficiencyLabels: Record<number, { label: string; color: string }> = {
  9: { label: 'Avançado Superior', color: 'bg-purple-600' },
  8: { label: 'Avançado', color: 'bg-blue-600' },
  7: { label: 'Proficiente Superior', color: 'bg-green-600' },
  6: { label: 'Proficiente', color: 'bg-green-500' },
  5: { label: 'Básico Superior', color: 'bg-yellow-600' },
  4: { label: 'Básico', color: 'bg-yellow-500' },
  3: { label: 'Em Desenvolvimento', color: 'bg-orange-500' },
  2: { label: 'Inicial', color: 'bg-red-500' },
  1: { label: 'Muito Inicial', color: 'bg-red-600' },
  0: { label: 'Insuficiente', color: 'bg-gray-600' },
};

export default function ExamResultPage({ params }: PageProps) {
  const { attemptId } = params;
  const router = useRouter();

  const { data: result, isLoading } = useQuery({
    queryKey: ['exam-result', attemptId],
    queryFn: () => examsService.getAttemptResult(attemptId),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando resultado...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Resultado não encontrado</p>
        </div>
      </div>
    );
  }

  const { attempt, descriptorAnalysis } = result;
  const percentage = attempt.percentage || 0;
  const proficiency = attempt.proficiency || 0;
  const proficiencyInfo = proficiencyLabels[proficiency];

  const totalQuestions = attempt.exam?.questions?.length || 0;
  const correctAnswers =
    attempt.answers?.filter((a) => a.isCorrect).length || 0;
  const incorrectAnswers = totalQuestions - correctAnswers;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => router.push('/aluno/simulados')}
            variant="secondary"
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            size="sm"
          >
            Voltar
          </Button>
        </div>
      </div>

      {/* Resultado Geral */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <TrophyIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold">{attempt.exam?.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <p className="text-sm opacity-90 mb-2">Sua Nota</p>
            <p className="text-4xl font-bold">{percentage.toFixed(1)}%</p>
            <p className="text-sm opacity-75 mt-1">
              {attempt.score?.toFixed(1)} / {attempt.exam?.totalPoints} pontos
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <p className="text-sm opacity-90 mb-2">Proficiência SAEB</p>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${proficiencyInfo.color} text-white mt-2`}
            >
              Nível {proficiency} - {proficiencyInfo.label}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <p className="text-sm opacity-90 mb-2">Desempenho</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-2xl font-bold text-green-300">
                  {correctAnswers}
                </p>
                <p className="text-xs opacity-75">Corretas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-300">
                  {incorrectAnswers}
                </p>
                <p className="text-xs opacity-75">Incorretas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Análise por Descritor SAEB */}
      {descriptorAnalysis && descriptorAnalysis.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Análise por Habilidade SAEB
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Veja seu desempenho em cada descritor avaliado
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {descriptorAnalysis.map((analysis) => {
                  const percentage = (analysis.correct / analysis.total) * 100;
                  return (
                    <div
                      key={analysis.descriptor.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="info" size="sm">
                              {analysis.descriptor.code}
                            </Badge>
                            <Badge variant="info" size="sm">
                              {analysis.descriptor.skill}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            {analysis.descriptor.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {analysis.correct}/{analysis.total}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentage >= 70
                              ? 'bg-green-500'
                              : percentage >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico de Radar - Performance por Habilidade */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Visão Geral de Habilidades
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gráfico radar mostrando seu desempenho em cada área
              </p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart
                  data={descriptorAnalysis.map((analysis) => ({
                    descriptor: analysis.descriptor.code,
                    performance: (analysis.correct / analysis.total) * 100,
                    fullMark: 100,
                  }))}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="descriptor" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Seu Desempenho"
                    dataKey="performance"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recomendações de Estudo */}
          {(() => {
            const weakDescriptors = descriptorAnalysis
              .filter((a) => (a.correct / a.total) * 100 < 60)
              .sort((a, b) => (a.correct / a.total) - (b.correct / b.total));

            const strongDescriptors = descriptorAnalysis
              .filter((a) => (a.correct / a.total) * 100 >= 80)
              .sort((a, b) => (b.correct / b.total) - (a.correct / a.total));

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pontos Fracos - Precisa Estudar */}
                {weakDescriptors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg shadow-sm">
                    <div className="p-6 border-b border-red-200 dark:border-red-800">
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 flex items-center gap-2">
                        <LightBulbIcon className="h-5 w-5" />
                        Precisa Revisar
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Foque seu estudo nestes descritores (abaixo de 60%)
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {weakDescriptors.map((analysis) => {
                          const percentage = (analysis.correct / analysis.total) * 100;
                          return (
                            <div
                              key={analysis.descriptor.id}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-800"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <Badge variant="error" size="sm" className="mb-2">
                                    {analysis.descriptor.code} - {analysis.descriptor.skill}
                                  </Badge>
                                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                                    {analysis.descriptor.description}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {analysis.correct} de {analysis.total} questões corretas
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pontos Fortes - Continue Assim */}
                {strongDescriptors.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
                    <div className="p-6 border-b border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-400 flex items-center gap-2">
                        <TrophyIcon className="h-5 w-5" />
                        Seus Pontos Fortes
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Parabéns! Você domina estes descritores (acima de 80%)
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {strongDescriptors.map((analysis) => {
                          const percentage = (analysis.correct / analysis.total) * 100;
                          return (
                            <div
                              key={analysis.descriptor.id}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <Badge variant="success" size="sm" className="mb-2">
                                    {analysis.descriptor.code} - {analysis.descriptor.skill}
                                  </Badge>
                                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                                    {analysis.descriptor.description}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {analysis.correct} de {analysis.total} questões corretas
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Gráfico de Barras - Comparativo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                Comparativo de Performance
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Taxa de acerto por descritor SAEB
              </p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={descriptorAnalysis.map((analysis) => ({
                    name: analysis.descriptor.code,
                    percentage: (analysis.correct / analysis.total) * 100,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="percentage" name="Taxa de Acerto (%)">
                    {descriptorAnalysis.map((analysis, index) => {
                      const percentage = (analysis.correct / analysis.total) * 100;
                      const color =
                        percentage >= 80
                          ? '#10b981' // green
                          : percentage >= 60
                          ? '#eab308' // yellow
                          : '#ef4444'; // red
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Revisão de Respostas */}
      {attempt.exam?.allowReview && attempt.answers && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5" />
              Revisão das Questões
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {attempt.answers
                .sort(
                  (a, b) =>
                    (a.examQuestion?.orderNumber || 0) -
                    (b.examQuestion?.orderNumber || 0),
                )
                .map((answer, index) => {
                  const question = answer.examQuestion?.question;
                  const selectedOption = question?.options?.find(
                    (opt: any) => opt.orderNumber === answer.selectedOption,
                  );
                  const correctOption = question?.options?.find(
                    (opt: any) => opt.isCorrect,
                  );

                  return (
                    <div
                      key={answer.id}
                      className={`border-l-4 ${
                        answer.isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                          : 'border-red-500 bg-red-50 dark:bg-red-900/10'
                      } p-4 rounded-r-lg`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {answer.isCorrect ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              Questão {index + 1}
                            </span>
                            <Badge
                              variant={answer.isCorrect ? 'success' : 'error'}
                              size="sm"
                            >
                              {answer.isCorrect ? 'Correto' : 'Incorreto'}
                            </Badge>
                          </div>
                          <p className="text-gray-900 dark:text-white mb-3">
                            {question?.statement}
                          </p>

                          {!answer.isCorrect && (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <XCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <span className="text-red-700 dark:text-red-400">
                                  <strong>Sua resposta:</strong> {selectedOption?.text}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-green-700 dark:text-green-400">
                                  <strong>Resposta correta:</strong>{' '}
                                  {correctOption?.text}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-center">
        <Button onClick={() => router.push('/aluno/simulados')} size="lg">
          Ver Outros Simulados
        </Button>
      </div>
    </div>
  );
}
