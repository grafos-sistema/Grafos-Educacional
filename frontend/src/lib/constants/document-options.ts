export const RG_MAX_LENGTH = 14;

export const RG_ISSUER_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'SSP', label: 'SSP' },
  { value: 'SESP', label: 'SESP' },
  { value: 'SDS', label: 'SDS' },
  { value: 'PC', label: 'PC' },
  { value: 'DGPC', label: 'DGPC' },
  { value: 'IFP', label: 'IFP' },
  { value: 'DETRAN', label: 'DETRAN' },
] as const;

export const BRAZILIAN_UF_OPTIONS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
].map((uf) => ({
  value: uf,
  label: uf,
}));

export const NATIONALITY_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'Brasileira', label: 'Brasileira' },
  { value: 'Venezuelana', label: 'Venezuelana' },
  { value: 'Haitiana', label: 'Haitiana' },
  { value: 'Outra', label: 'Outra' },
] as const;

export function sanitizeRgValue(value?: string | null) {
  if (!value) return '';

  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, RG_MAX_LENGTH);
}

export function parseRgIssuerValue(value?: string | null) {
  if (!value) {
    return { issuer: '', uf: '' };
  }

  const normalized = value.trim().toUpperCase();
  const [issuer = '', uf = ''] = normalized.split('/');

  return {
    issuer,
    uf: BRAZILIAN_UF_OPTIONS.some((option) => option.value === uf) ? uf : '',
  };
}

export function formatRgIssuerValue(issuer?: string | null, uf?: string | null) {
  const normalizedIssuer = issuer?.trim().toUpperCase() ?? '';
  const normalizedUf = uf?.trim().toUpperCase() ?? '';

  if (!normalizedIssuer) return undefined;
  if (!normalizedUf) return normalizedIssuer;

  return `${normalizedIssuer}/${normalizedUf}`;
}
