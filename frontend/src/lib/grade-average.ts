import type { AssessmentSlot } from '@/types/evaluation.types';

export type GradeValue = {
  value: number;
  weight?: number | null;
};

/**
 * Calcula a média de um conjunto de notas.
 *
 * Lançamentos novos usam pesos percentuais e, por isso, a nota é a soma de
 * cada valor multiplicado pelo seu percentual, dividida por 100. Registros
 * antigos usavam o peso 1 para todas as avaliações; nesses casos mantemos a
 * média aritmética para preservar o histórico existente.
 */
export function calculateGradeAverage(grades: GradeValue[]): number | null {
  const validGrades = grades.filter(
    (grade) => Number.isFinite(grade.value) && Number.isFinite(grade.weight ?? 1),
  );

  if (validGrades.length === 0) return null;

  const usesPercentageWeights = validGrades.some(
    (grade) => Number(grade.weight ?? 1) > 1,
  );
  const weightedSum = validGrades.reduce(
    (sum, grade) => sum + grade.value * Number(grade.weight ?? 1),
    0,
  );
  const denominator = usesPercentageWeights
    ? 100
    : validGrades.reduce((sum, grade) => sum + Number(grade.weight ?? 1), 0);

  return denominator > 0 ? weightedSum / denominator : null;
}

export function calculateAssessmentScore(
  values: Partial<Record<AssessmentSlot, string | number | null | undefined>>,
  slots: AssessmentSlot[],
  weights: Partial<Record<AssessmentSlot, number>>,
): number | null {
  let score = 0;
  let hasValue = false;

  for (const slot of slots) {
    const rawValue = values[slot];
    if (rawValue === '' || rawValue === null || rawValue === undefined) continue;

    const value = Number(rawValue);
    const weight = Number(weights[slot] ?? 0);
    if (!Number.isFinite(value) || !Number.isFinite(weight)) continue;

    score += value * (weight / 100);
    hasValue = true;
  }

  return hasValue ? score : null;
}
