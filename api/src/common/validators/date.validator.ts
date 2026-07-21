import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: any): boolean {
    if (!date) return false;
    const inputDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Ignora horas para comparar apenas a data
    return inputDate >= now;
  }

  defaultMessage(): string {
    return 'A data deve ser hoje ou no futuro';
  }
}

@ValidatorConstraint({ name: 'isPastDate', async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(date: any): boolean {
    if (!date) return false;
    const inputDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return inputDate <= now;
  }

  defaultMessage(): string {
    return 'A data deve ser hoje ou no passado';
  }
}

@ValidatorConstraint({ name: 'isDateInRange', async: false })
export class IsDateInRangeConstraint implements ValidatorConstraintInterface {
  validate(date: any, args: ValidationArguments): boolean {
    if (!date) return false;
    const inputDate = new Date(date);
    const [minYear, maxYear] = args.constraints as [number, number];
    const year = inputDate.getFullYear();
    return year >= minYear && year <= maxYear;
  }

  defaultMessage(args: ValidationArguments): string {
    const [minYear, maxYear] = args.constraints as [number, number];
    return `A data deve estar entre ${minYear} e ${maxYear}`;
  }
}

@ValidatorConstraint({ name: 'isAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(date: any, args: ValidationArguments): boolean {
    if (!date) return false;
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    if (!relatedValue) return true; // Se não há data de comparação, passa

    const inputDate = new Date(date);
    const compareDate = new Date(relatedValue);
    return inputDate > compareDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints;
    return `A data deve ser posterior a ${relatedPropertyName}`;
  }
}

/**
 * Valida se a data é futura (hoje ou depois)
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

/**
 * Valida se a data é passada (hoje ou antes)
 */
export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPastDateConstraint,
    });
  };
}

/**
 * Valida se a data está em um intervalo de anos
 * @param minYear Ano mínimo
 * @param maxYear Ano máximo
 */
export function IsDateInRange(
  minYear: number,
  maxYear: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minYear, maxYear],
      validator: IsDateInRangeConstraint,
    });
  };
}

/**
 * Valida se a data é posterior a outra propriedade
 * @param property Nome da propriedade para comparação
 */
export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterConstraint,
    });
  };
}
