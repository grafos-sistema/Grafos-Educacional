export const classShiftOptions = [
  { value: '', label: 'Selecione um turno' },
  { value: 'Matutino', label: 'Matutino' },
  { value: 'Vespertino', label: 'Vespertino' },
];

export const classSectionOptions = [
  { value: '', label: 'Selecione uma turma' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
    value: letter,
    label: letter,
  })),
];

type GradeOption = {
  value: string;
  label: string;
};

const fundamentalOneGrades: GradeOption[] = [
  { value: '1º Ano', label: '1º Ano' },
  { value: '2º Ano', label: '2º Ano' },
  { value: '3º Ano', label: '3º Ano' },
  { value: '4º Ano', label: '4º Ano' },
  { value: '5º Ano', label: '5º Ano' },
];

const fundamentalTwoGrades: GradeOption[] = [
  { value: '6º Ano', label: '6º Ano' },
  { value: '7º Ano', label: '7º Ano' },
  { value: '8º Ano', label: '8º Ano' },
  { value: '9º Ano', label: '9º Ano' },
];

const highSchoolGrades: GradeOption[] = [
  { value: '1º Ano', label: '1º Ano do Ensino Médio' },
  { value: '2º Ano', label: '2º Ano do Ensino Médio' },
  { value: '3º Ano', label: '3º Ano do Ensino Médio' },
];

const fundamentalGrades: GradeOption[] = [
  ...fundamentalOneGrades,
  ...fundamentalTwoGrades,
];

type CourseSeriesConfig = {
  shortLabel: string;
  grades: GradeOption[];
};

const classSeriesByCourseLevel: Record<string, CourseSeriesConfig> = {
  'Ensino Fundamental I': {
    shortLabel: 'EF1',
    grades: fundamentalOneGrades,
  },
  'Ensino Fundamental II': {
    shortLabel: 'EF2',
    grades: fundamentalTwoGrades,
  },
  'Ensino Fundamental': {
    shortLabel: 'EF',
    grades: fundamentalGrades,
  },
  'Ensino Médio': {
    shortLabel: 'EM',
    grades: highSchoolGrades,
  },
};

function normalizeCourseLevel(value?: string) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolveCourseSeriesConfig(courseLevel?: string) {
  const normalizedLevel = normalizeCourseLevel(courseLevel);

  if (!normalizedLevel) {
    return undefined;
  }

  if (
    normalizedLevel.includes('fundamental ii') ||
    normalizedLevel.includes('fundamental 2')
  ) {
    return classSeriesByCourseLevel['Ensino Fundamental II'];
  }

  if (
    normalizedLevel.includes('fundamental i') ||
    normalizedLevel.includes('fundamental 1')
  ) {
    return classSeriesByCourseLevel['Ensino Fundamental I'];
  }

  if (normalizedLevel.includes('ensino medio') || normalizedLevel === 'medio') {
    return classSeriesByCourseLevel['Ensino Médio'];
  }

  if (normalizedLevel.includes('ensino fundamental') || normalizedLevel === 'fundamental') {
    return classSeriesByCourseLevel['Ensino Fundamental'];
  }

  return classSeriesByCourseLevel[courseLevel ?? ''];
}

export function getClassSeriesOptions(courseLevel?: string) {
  const config = resolveCourseSeriesConfig(courseLevel);

  if (!config) {
    return [{ value: '', label: 'Selecione a série/ano' }];
  }

  return [
    { value: '', label: 'Selecione a série/ano' },
    ...config.grades.map((grade) => ({
      value: grade.value,
      label: grade.label,
    })),
  ];
}

export function supportsClassSeriesOptions(courseLevel?: string) {
  return Boolean(resolveCourseSeriesConfig(courseLevel));
}

export function buildClassName(params: {
  courseLevel?: string;
  grade?: string;
  section?: string;
}) {
  const config = resolveCourseSeriesConfig(params.courseLevel);

  if (!config || !params.grade) {
    return '';
  }

  const suffix = params.section ? ` ${params.section}` : '';
  return `${config.shortLabel} | ${params.grade}${suffix}`;
}
