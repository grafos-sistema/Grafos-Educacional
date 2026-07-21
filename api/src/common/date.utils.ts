/**
 * Utilitários para conversão e validação de datas
 */

/**
 * Converte diferentes formatos de data para Date
 * Aceita: ISO strings, date strings simples, timestamps, objetos Date
 */
export function transformDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  // Se já é uma instância de Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  
  // Se é string, tenta converter
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  // Se é número (timestamp)
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  return undefined;
}

/**
 * Valida se um valor pode ser convertido para uma data válida
 */
export function isValidDate(value: any): boolean {
  if (!value) return true; // opcional
  
  const date = transformDate(value);
  return date !== undefined;
}

/**
 * Formata uma data para ISO string
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString();
}

/**
 * Converte uma data para o início do dia (00:00:00)
 */
export function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Converte uma data para o final do dia (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}
