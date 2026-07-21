import { useId } from 'react';

/**
 * Hook para gerar IDs acessíveis para formulários
 *
 * @example
 * const { getFieldProps, getInputProps } = useAccessibleForm('loginForm');
 *
 * // Use getInputProps for spreading on DOM elements (excludes errorId/helpId)
 * <label htmlFor={getFieldProps('email', errors.email?.message).id}>Email</label>
 * <input {...getInputProps('email', errors.email?.message)} />
 *
 * // Use getFieldProps when you need errorId/helpId for accessibility
 * {errors.email && (
 *   <span id={getFieldProps('email', errors.email?.message).errorId}>
 *     {errors.email.message}
 *   </span>
 * )}
 */
export function useAccessibleForm(formId: string) {
  const baseId = useId();

  const getFieldProps = (fieldName: string, error?: string, helpText?: string) => {
    const fieldId = `${baseId}-${fieldName}`;
    const errorId = error ? `${fieldId}-error` : undefined;
    const helpId = helpText ? `${fieldId}-help` : undefined;

    const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

    return {
      id: fieldId,
      name: fieldName,
      'aria-invalid': error ? ('true' as const) : undefined,
      'aria-describedby': describedBy,
      errorId,
      helpId,
    };
  };

  // Returns only DOM-safe props that can be spread on input elements
  const getInputProps = (fieldName: string, error?: string, helpText?: string) => {
    const { errorId, helpId, ...domProps } = getFieldProps(fieldName, error, helpText);
    return domProps;
  };

  return { getFieldProps, getInputProps, formId: `${baseId}-${formId}` };
}
