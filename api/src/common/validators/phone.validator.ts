import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isBrazilianPhone', async: false })
export class IsBrazilianPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string): boolean {
    if (!phone) return false;

    // Remove caracteres não numéricos
    const cleaned = phone.replace(/[^\d]/g, '');

    // Telefone brasileiro: 10 ou 11 dígitos
    // Formato: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
    // Onde DD é o DDD (2 dígitos)
    if (cleaned.length < 10 || cleaned.length > 11) return false;

    // Verifica se o DDD é válido (11 a 99)
    const ddd = parseInt(cleaned.substring(0, 2));
    if (ddd < 11 || ddd > 99) return false;

    // Se tem 11 dígitos, o terceiro deve ser 9 (celular)
    if (cleaned.length === 11 && cleaned.charAt(2) !== '9') return false;

    return true;
  }

  defaultMessage(): string {
    return 'Telefone inválido. Use o formato brasileiro (DDD) + número';
  }
}

/**
 * Decorator para validar telefone brasileiro
 * Aceita formatos: (11) 98765-4321, 11987654321, (11) 3456-7890, etc.
 * @param validationOptions Opções de validação
 */
export function IsBrazilianPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBrazilianPhoneConstraint,
    });
  };
}
