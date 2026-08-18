const STUDENT_TAG_SEPARATOR = /[\n;]+/;

export const STUDENT_TAG_FIELDS = [
  'alergias',
  'medicamentos',
  'necessidadesEspeciais',
  'restricoesAlimentares',
  'convenioMedico',
] as const;

export function parseStudentTagList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item ?? '').trim())
          .filter(Boolean)
      )
    );
  }

  if (typeof value !== 'string') return [];

  return Array.from(
    new Set(
      value
        .split(STUDENT_TAG_SEPARATOR)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function serializeStudentTagList(value: unknown): string | undefined {
  const tags = parseStudentTagList(value);
  return tags.length > 0 ? tags.join('\n') : undefined;
}
