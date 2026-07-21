import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Séries válidas no sistema educacional brasileiro
 */
const VALID_GRADE_LEVELS = [
  // Educação Infantil
  'Berçário',
  'Maternal I',
  'Maternal II',
  'Jardim I',
  'Jardim II',
  'Pré I',
  'Pré II',

  // Ensino Fundamental Anos Iniciais
  '1º ano',
  '2º ano',
  '3º ano',
  '4º ano',
  '5º ano',

  // Ensino Fundamental Anos Finais
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',

  // Ensino Médio
  '1ª série',
  '2ª série',
  '3ª série',

  // EJA - Educação de Jovens e Adultos
  'EJA - Fundamental I',
  'EJA - Fundamental II',
  'EJA - Médio',
];

@ValidatorConstraint({ name: 'isValidGradeLevel', async: false })
export class IsValidGradeLevelConstraint implements ValidatorConstraintInterface {
  validate(gradeLevel: string): boolean {
    if (!gradeLevel) return false;

    // Aceita os valores exatos da lista
    if (VALID_GRADE_LEVELS.includes(gradeLevel)) return true;

    // Aceita também formatos alternativos comuns
    const normalized = gradeLevel.trim();

    // Regex para aceitar variações: "1 ano", "1° ano", "1ª série", etc.
    const patterns = [
      /^[1-5]º ano$/i,           // 1º ano até 5º ano
      /^[6-9]º ano$/i,           // 6º ano até 9º ano
      /^[1-3]ª série$/i,         // 1ª série até 3ª série
      /^EJA/i,                   // Qualquer variação de EJA
      /^(Berçário|Maternal|Jardim|Pré)/i, // Educação infantil
    ];

    return patterns.some(pattern => pattern.test(normalized));
  }

  defaultMessage(): string {
    return 'Série/ano escolar inválido. Use formatos como: "1º ano", "6º ano", "1ª série", etc.';
  }
}

/**
 * Decorator para validar séries escolares brasileiras
 * @param validationOptions Opções de validação
 */
export function IsValidGradeLevel(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidGradeLevelConstraint,
    });
  };
}

/**
 * Retorna lista de séries válidas
 */
export function getValidGradeLevels(): string[] {
  return [...VALID_GRADE_LEVELS];
}
