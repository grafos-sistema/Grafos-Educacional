import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Pipe para sanitizar inputs e prevenir ataques de injeção
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    // Se for um objeto, sanitizar recursivamente
    if (typeof value === 'object' && !Array.isArray(value)) {
      return this.sanitizeObject(value);
    }

    // Se for um array, sanitizar cada elemento
    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item, metadata));
    }

    // Se for uma string, sanitizar
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    return value;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.transform(obj[key], {} as ArgumentMetadata);
      }
    }
    return sanitized;
  }

  private sanitizeString(str: string): string {
    // Remove caracteres perigosos de SQL injection
    // Nota: Prisma já previne SQL injection, mas é uma camada extra
    const dangerous = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ONERROR|ONLOAD)\b)/gi;

    if (dangerous.test(str)) {
      throw new BadRequestException('Input contém conteúdo potencialmente perigoso');
    }

    // Remove tags HTML perigosas (XSS prevention)
    const cleanStr = str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers

    return cleanStr.trim();
  }
}
