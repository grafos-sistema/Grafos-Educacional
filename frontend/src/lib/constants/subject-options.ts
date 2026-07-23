export type SubjectCatalogOption = {
  name: string;
  code: string;
};

export const subjectCatalog: SubjectCatalogOption[] = [
  { name: 'Língua Portuguesa', code: 'LP' },
  { name: 'Redação e Produção Textual', code: 'RED' },
  { name: 'Literatura', code: 'LIT' },
  { name: 'Matemática', code: 'MAT' },
  { name: 'Ciências', code: 'CIE' },
  { name: 'História', code: 'HIS' },
  { name: 'Geografia', code: 'GEO' },
  { name: 'Arte', code: 'ART' },
  { name: 'Educação Física', code: 'EDF' },
  { name: 'Ensino Religioso', code: 'ER' },
  { name: 'Inglês', code: 'ING' },
  { name: 'Espanhol', code: 'ESP' },
  { name: 'Física', code: 'FIS' },
  { name: 'Química', code: 'QUI' },
  { name: 'Biologia', code: 'BIO' },
  { name: 'Filosofia', code: 'FIL' },
  { name: 'Sociologia', code: 'SOC' },
  { name: 'Projeto de Vida', code: 'PV' },
  { name: 'Tecnologia e Inovação', code: 'TEC' },
  { name: 'Informática', code: 'INF' },
  { name: 'Robótica', code: 'ROB' },
  { name: 'Empreendedorismo', code: 'EMP' },
  { name: 'Educação Financeira', code: 'EFI' },
  { name: 'Música', code: 'MUS' },
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isCatalogSubject(name?: string) {
  if (!name) return false;
  const normalizedName = normalizeText(name);
  return subjectCatalog.some((subject) => normalizeText(subject.name) === normalizedName);
}

export function findCatalogSubject(name?: string) {
  if (!name) return undefined;
  const normalizedName = normalizeText(name);
  return subjectCatalog.find((subject) => normalizeText(subject.name) === normalizedName);
}

export function filterCatalogSubjects(search: string) {
  const normalizedSearch = normalizeText(search);

  if (!normalizedSearch) {
    return subjectCatalog;
  }

  return subjectCatalog.filter((subject) =>
    normalizeText(subject.name).includes(normalizedSearch)
  );
}

function sanitizeCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function buildCodeBase(name: string) {
  const catalogSubject = findCatalogSubject(name);
  if (catalogSubject) {
    return catalogSubject.code;
  }

  const words = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Z0-9]/g, ''))
    .filter(Boolean);

  if (words.length === 0) {
    return 'DISC';
  }

  if (words.length === 1) {
    return words[0].slice(0, 4) || 'DISC';
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => sanitizeCode(word).charAt(0))
    .join('')
    .slice(0, 4);

  return initials || words.map((word) => word.charAt(0)).join('').slice(0, 4) || 'DISC';
}

export function suggestUniqueSubjectCode(
  name: string,
  existingCodes: string[],
) {
  const normalizedExistingCodes = new Set(
    existingCodes
      .map((code) => sanitizeCode(code))
      .filter(Boolean)
  );

  const baseCode = buildCodeBase(name);

  if (!normalizedExistingCodes.has(baseCode)) {
    return baseCode;
  }

  let suffix = 2;
  while (normalizedExistingCodes.has(`${baseCode}${suffix}`)) {
    suffix += 1;
  }

  return `${baseCode}${suffix}`;
}

export function normalizeSubjectCode(code: string) {
  return sanitizeCode(code);
}
