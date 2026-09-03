export type GradeValue = {
  value: number;
  weight?: number | null;
};

/**
 * Calcula a média ponderada sem alterar o resultado de históricos antigos.
 * Pesos acima de 1 representam o novo formato percentual (soma sobre 100);
 * pesos iguais a 1 representam o formato legado, que era uma média simples.
 */
export function calculateGradeAverage(grades: GradeValue[]): number | null {
  const validGrades = grades.filter(
    (grade) =>
      Number.isFinite(grade.value) && Number.isFinite(grade.weight ?? 1),
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
