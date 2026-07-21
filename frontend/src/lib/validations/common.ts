import { z } from 'zod';

/**
 * Validadores comuns reutilizáveis
 */

// CPF Validator
export const cpfSchema = z.string().refine(
  (cpf) => {
    // Remove caracteres não numéricos
    const cleaned = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleaned.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let digit1 = remainder >= 10 ? 0 : remainder;

    if (parseInt(cleaned.charAt(9)) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    let digit2 = remainder >= 10 ? 0 : remainder;

    if (parseInt(cleaned.charAt(10)) !== digit2) return false;

    return true;
  },
  { message: 'CPF inválido' }
);

// Phone Validator (Brazilian)
export const phoneSchema = z.string().refine(
  (phone) => {
    const cleaned = phone.replace(/\D/g, '');

    // 10 ou 11 dígitos (com DDD)
    if (cleaned.length < 10 || cleaned.length > 11) return false;

    // DDD válido (11-99)
    const ddd = parseInt(cleaned.substring(0, 2));
    if (ddd < 11 || ddd > 99) return false;

    // Se tem 11 dígitos, o terceiro deve ser 9
    if (cleaned.length === 11 && cleaned.charAt(2) !== '9') return false;

    return true;
  },
  { message: 'Telefone inválido. Use formato (DD) XXXXX-XXXX' }
);

// Email Validator
export const emailSchema = z
  .string()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .toLowerCase();

// Password Validator
export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres')
  .max(100, 'Senha muito longa');

// Strong Password Validator
export const strongPasswordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número')
  .max(100, 'Senha muito longa');

// Name Validator
export const nameSchema = z
  .string()
  .min(2, 'Nome deve ter no mínimo 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s']+$/, 'Nome contém caracteres inválidos');

// Date Validator (ISO format)
export const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Data inválida. Use formato YYYY-MM-DD'
);

// Future Date Validator
export const futureDateSchema = z.string().refine(
  (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  },
  { message: 'Data deve ser hoje ou no futuro' }
);

// Past Date Validator
export const pastDateSchema = z.string().refine(
  (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate <= today;
  },
  { message: 'Data deve ser hoje ou no passado' }
);

// UUID Validator
export const uuidSchema = z.string().uuid('ID inválido');

// Number Range Validator
export const numberRangeSchema = (min: number, max: number, label = 'Valor') =>
  z
    .number()
    .min(min, `${label} deve ser no mínimo ${min}`)
    .max(max, `${label} deve ser no máximo ${max}`);

// Positive Number Validator
export const positiveNumberSchema = (label = 'Valor') =>
  z
    .number()
    .positive(`${label} deve ser positivo`);

// URL Validator
export const urlSchema = z.string().url('URL inválida');

// Optional URL Validator
export const optionalUrlSchema = z.union([
  z.string().url('URL inválida'),
  z.literal(''),
]);
