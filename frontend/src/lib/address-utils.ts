import { BRAZILIAN_UF_OPTIONS } from './constants/document-options';

export type CepLookupResult = {
  zipCode: string;
  address: string;
  bairro: string;
  city: string;
  state: string;
  complemento: string;
};

const VALID_UFS = new Set(BRAZILIAN_UF_OPTIONS.map((option) => option.value));

export const normalizeCep = (value?: string | null) =>
  (value ?? '').replace(/\D/g, '').slice(0, 8);

export const formatCep = (value?: string | null) => {
  const normalized = normalizeCep(value);

  if (normalized.length <= 5) {
    return normalized;
  }

  return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
};

export const isValidUf = (value?: string | null) =>
  VALID_UFS.has((value ?? '').trim().toUpperCase());

export async function lookupCep(cep: string): Promise<CepLookupResult | null> {
  const normalizedCep = normalizeCep(cep);

  if (normalizedCep.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`);

  if (!response.ok) {
    throw new Error('Não foi possível consultar o CEP informado.');
  }

  const data = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    complemento?: string;
  };

  if (data.erro) {
    return null;
  }

  return {
    zipCode: formatCep(normalizedCep),
    address: data.logradouro?.trim() ?? '',
    bairro: data.bairro?.trim() ?? '',
    city: data.localidade?.trim() ?? '',
    state: isValidUf(data.uf) ? data.uf!.trim().toUpperCase() : '',
    complemento: data.complemento?.trim() ?? '',
  };
}
