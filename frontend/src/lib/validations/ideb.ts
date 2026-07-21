import { z } from 'zod';
import { numberRangeSchema } from './common';

/**
 * Séries válidas
 */
const validGradeLevels = [
  '1º ano', '2º ano', '3º ano', '4º ano', '5º ano',
  '6º ano', '7º ano', '8º ano', '9º ano',
  '1ª série', '2ª série', '3ª série',
] as const;

/**
 * Schema de validação para criar meta IDEB
 */
export const createIDEBTargetSchema = z.object({
  year: numberRangeSchema(2000, 2100, 'Ano'),
  gradeLevel: z.enum(validGradeLevels, {
    message: 'Selecione uma série válida',
  }),
  target: numberRangeSchema(0, 10, 'Meta IDEB')
    .refine(
      (val) => Number.isFinite(val) && val >= 0 && val <= 10,
      { message: 'Meta IDEB deve estar entre 0 e 10' }
    ),
  nationalTarget: numberRangeSchema(0, 10, 'Meta Nacional').optional(),
  stateTarget: numberRangeSchema(0, 10, 'Meta Estadual').optional(),
});

export type CreateIDEBTargetFormData = z.infer<typeof createIDEBTargetSchema>;

/**
 * Schema de validação para atualizar meta IDEB
 */
export const updateIDEBTargetSchema = z.object({
  target: numberRangeSchema(0, 10, 'Meta IDEB').optional(),
  nationalTarget: numberRangeSchema(0, 10, 'Meta Nacional').optional(),
  stateTarget: numberRangeSchema(0, 10, 'Meta Estadual').optional(),
}).refine(
  (data) => data.target !== undefined || data.nationalTarget !== undefined || data.stateTarget !== undefined,
  { message: 'Pelo menos um campo deve ser preenchido' }
);

export type UpdateIDEBTargetFormData = z.infer<typeof updateIDEBTargetSchema>;

/**
 * Schema de validação para calcular IDEB
 */
export const calculateIDEBSchema = z.object({
  year: numberRangeSchema(2000, 2100, 'Ano'),
  gradeLevel: z.enum(validGradeLevels, {
    message: 'Selecione uma série válida',
  }),
});

export type CalculateIDEBFormData = z.infer<typeof calculateIDEBSchema>;
