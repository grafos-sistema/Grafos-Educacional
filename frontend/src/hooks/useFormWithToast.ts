import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

interface UseFormWithToastProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: z.ZodType<T>;
  onSubmitSuccess?: (data: T) => void | Promise<void>;
  onSubmitError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook customizado que combina React Hook Form + Zod + Toast
 *
 * @example
 * const { register, handleSubmit, formState } = useFormWithToast({
 *   schema: loginSchema,
 *   onSubmitSuccess: async (data) => {
 *     await authService.login(data);
 *   },
 *   successMessage: 'Login realizado com sucesso!',
 * });
 */
export function useFormWithToast<T extends FieldValues>({
  schema,
  onSubmitSuccess,
  onSubmitError,
  successMessage,
  errorMessage = 'Erro ao processar formulário',
  ...formProps
}: UseFormWithToastProps<T>) {
  const form = useForm<T>({
    ...formProps,
    // @ts-ignore - Type mismatch between zod and react-hook-form versions
    resolver: zodResolver(schema),
  });

  const onSubmit = form.handleSubmit(
    async (data) => {
      try {
        // @ts-ignore - Type mismatch
        await onSubmitSuccess?.(data);
        if (successMessage) {
          toast.success(successMessage);
        }
      } catch (error: any) {
        console.error('Form submission error:', error);

        // Extrair mensagem de erro do backend se disponível
        const message =
          error?.response?.data?.message ||
          error?.message ||
          errorMessage;

        // Se for array de mensagens (erros de validação do backend)
        if (Array.isArray(message)) {
          message.forEach((msg: string) => toast.error(msg));
        } else {
          toast.error(message);
        }

        onSubmitError?.(error);
      }
    },
    (errors) => {
      // Mostrar primeiro erro de validação
      const firstError = Object.values(errors)[0];
      if (firstError?.message) {
        toast.error(firstError.message as string);
      }
    }
  );

  return {
    ...form,
    onSubmit,
  };
}
