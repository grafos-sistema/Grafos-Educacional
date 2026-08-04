const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value?: string | null): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

export function getValidInstitutionIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter(isUuid)));
}
