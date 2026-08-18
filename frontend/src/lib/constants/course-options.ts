export const courseLevelOptions = [
  { value: '', label: 'Selecione...' },
  { value: 'Educação Infantil', label: 'Educação Infantil' },
  { value: 'Ensino Fundamental I', label: 'Ensino Fundamental I' },
  { value: 'Ensino Fundamental II', label: 'Ensino Fundamental II' },
  { value: 'Ensino Fundamental', label: 'Ensino Fundamental' },
  { value: 'Ensino Médio', label: 'Ensino Médio' },
  { value: 'Ensino Técnico', label: 'Ensino Técnico' },
  { value: 'Ensino Profissionalizante', label: 'Ensino Profissionalizante' },
  { value: 'Ensino Superior', label: 'Ensino Superior' },
  { value: 'Pós-Graduação', label: 'Pós-Graduação' },
  { value: 'EJA', label: 'EJA' },
  { value: 'Curso Livre', label: 'Curso Livre' },
];

const COURSE_LEVEL_CODES: Record<string, string> = {
  'Educação Infantil': 'EI',
  'Ensino Fundamental I': 'EF1',
  'Ensino Fundamental II': 'EF2',
  'Ensino Fundamental': 'EF',
  'Ensino Médio': 'EM',
  'Ensino Técnico': 'ET',
  'Ensino Profissionalizante': 'EP',
  'Ensino Superior': 'ES',
  'Pós-Graduação': 'PG',
  EJA: 'EJA',
  'Curso Livre': 'CL',
};

export function suggestCourseCode(level: string): string {
  const knownCode = COURSE_LEVEL_CODES[level];
  if (knownCode) return knownCode;

  return level
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 6);
}
