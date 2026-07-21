'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsService, AttemptStatus } from '@/services/exams.service';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

interface PageProps {
  params: {
    examId: string;
  };
}

export default function TakeExamPage({ params }: PageProps) {
  const { examId } = params;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Buscar dados do simulado e iniciar tentativa
  const { data: examsData } = useQuery({
    queryKey: ['available-exams'],
    queryFn: () => examsService.getAvailable(),
  });

  const exam = examsData?.find((e) => e.id === examId);

  // Iniciar tentativa
  const startAttemptMutation = useMutation({
    mutationFn: () => examsService.startAttempt(examId),
    onSuccess: (attempt) => {
      setAttemptId(attempt.id);

      // Calcular tempo restante se houver duração
      if (exam?.duration && attempt.startTime) {
        const startTime = new Date(attempt.startTime).getTime();
        const endTime = startTime + exam.duration * 60 * 1000;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
      }

      queryClient.invalidateQueries({ queryKey: ['available-exams'] });
    },
  });

  // Responder questão com auto-save
  const answerMutation = useMutation({
    mutationFn: ({
      examQuestionId,
      selectedOption,
    }: {
      examQuestionId: string;
      selectedOption: number;
    }) => {
      if (!attemptId) throw new Error('No attempt ID');
      return examsService.answerQuestion(attemptId, examQuestionId, selectedOption);
    },
  });

  // Finalizar simulado
  const submitMutation = useMutation({
    mutationFn: () => {
      if (!attemptId) throw new Error('No attempt ID');
      return examsService.submitAttempt(attemptId);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['available-exams'] });
      router.push(`/aluno/simulados/resultado/${result.id}`);
    },
  });

  // Iniciar tentativa automaticamente
  useEffect(() => {
    if (exam && !attemptId) {
      if (exam.attempt && exam.attempt.status === AttemptStatus.IN_PROGRESS) {
        // Retomar tentativa existente
        setAttemptId(exam.attempt.id);

        // Restaurar respostas
        if (exam.attempt.answers) {
          const savedAnswers: Record<string, number> = {};
          exam.attempt.answers.forEach((answer) => {
            if (answer.selectedOption !== null && answer.selectedOption !== undefined) {
              savedAnswers[answer.examQuestionId] = answer.selectedOption;
            }
          });
          setAnswers(savedAnswers);
        }

        // Calcular tempo restante
        if (exam.duration && exam.attempt.startTime) {
          const startTime = new Date(exam.attempt.startTime).getTime();
          const endTime = startTime + exam.duration * 60 * 1000;
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(remaining);
        }
      } else if (!exam.attempt || exam.attempt.status === AttemptStatus.NOT_STARTED) {
        // Iniciar nova tentativa
        startAttemptMutation.mutate();
      }
    }
  }, [exam, attemptId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Tempo esgotado - submeter automaticamente
          if (attemptId) {
            submitMutation.mutate();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, attemptId]);

  // Auto-save quando responder
  const handleSelectOption = useCallback(
    (examQuestionId: string, optionIndex: number) => {
      // Atualizar estado local imediatamente
      setAnswers((prev) => ({
        ...prev,
        [examQuestionId]: optionIndex,
      }));

      // Auto-save
      if (attemptId) {
        answerMutation.mutate({
          examQuestionId,
          selectedOption: optionIndex,
        });
      }
    },
    [attemptId],
  );

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (exam?.questions && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = () => {
    if (
      !exam?.questions ||
      !confirm('Tem certeza que deseja finalizar o simulado? Essa ação não pode ser desfeita.')
    ) {
      return;
    }

    const unanswered = exam.questions.filter(
      (q) => !answers[q.id],
    ).length;

    if (
      unanswered > 0 &&
      !confirm(
        `Você ainda tem ${unanswered} questão(ões) sem resposta. Deseja finalizar mesmo assim?`,
      )
    ) {
      return;
    }

    submitMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Carregando simulado...</p>
        </div>
      </div>
    );
  }

  if (
    exam.attempt &&
    (exam.attempt.status === AttemptStatus.SUBMITTED ||
      exam.attempt.status === AttemptStatus.GRADED)
  ) {
    router.push(`/aluno/simulados/resultado/${exam.attempt.id}`);
    return null;
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Fixo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {exam.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Questão {currentQuestionIndex + 1} de {exam.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    timeRemaining < 300
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ClockIcon className="h-5 w-5" />
                  <span className="font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <Badge variant="info">
                {answeredCount}/{exam.questions.length} respondidas
              </Badge>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6">
          {/* Questão */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-bold text-sm">
                {currentQuestionIndex + 1}
              </span>
              <div className="flex-1">
                <p className="text-lg text-gray-900 dark:text-white font-medium">
                  {currentQuestion.question?.statement}
                </p>
                {currentQuestion.question?.context && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                    {currentQuestion.question.context}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-3">
            {currentQuestion.question?.options
              ?.sort((a: any, b: any) => a.orderNumber - b.orderNumber)
              .map((option: any) => {
                const isSelected = answers[currentQuestion.id] === option.orderNumber;
                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      handleSelectOption(currentQuestion.id, option.orderNumber)
                    }
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircleIcon className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="secondary"
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === exam.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                variant="success"
                leftIcon={<FlagIcon className="h-4 w-4" />}
              >
                {submitMutation.isPending ? 'Finalizando...' : 'Finalizar Simulado'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="primary"
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Próxima
              </Button>
            )}
          </div>
        </div>

        {/* Mapa de navegação */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Navegação Rápida
          </h3>
          <div className="grid grid-cols-10 gap-2">
            {exam.questions.map((question, index) => {
              const isAnswered = !!answers[question.id];
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                    isCurrent
                      ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                      : isAnswered
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
