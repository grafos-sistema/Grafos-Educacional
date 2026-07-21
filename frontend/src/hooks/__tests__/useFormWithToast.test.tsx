import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useFormWithToast } from '../useFormWithToast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useFormWithToast', () => {
  const testSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize form with default values', () => {
    const { result } = renderHook(() =>
      useFormWithToast({
        schema: testSchema,
        defaultValues: {
          email: 'test@example.com',
          password: '',
        },
      })
    );

    expect(result.current.getValues('email')).toBe('test@example.com');
    expect(result.current.getValues('password')).toBe('');
  });

  it('should show validation error toast on invalid submission', async () => {
    const { result } = renderHook(() =>
      useFormWithToast({
        schema: testSchema,
      })
    );

    // Submit with invalid email
    result.current.setValue('email', 'invalid-email');
    result.current.setValue('password', 'password123');

    const mockEvent = {
      preventDefault: vi.fn(),
    } as any;

    await result.current.onSubmit(mockEvent);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email inválido');
    });
  });

  it('should call onSubmitSuccess and show success toast on valid submission', async () => {
    const onSubmitSuccess = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useFormWithToast({
        schema: testSchema,
        onSubmitSuccess,
        successMessage: 'Sucesso!',
      })
    );

    // Submit with valid data
    result.current.setValue('email', 'test@example.com');
    result.current.setValue('password', 'password123');

    const mockEvent = {
      preventDefault: vi.fn(),
    } as any;

    await result.current.onSubmit(mockEvent);

    await waitFor(() => {
      expect(onSubmitSuccess).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(toast.success).toHaveBeenCalledWith('Sucesso!');
    });
  });

  it('should show error toast when onSubmitSuccess throws', async () => {
    const error = new Error('Network error');
    const onSubmitSuccess = vi.fn().mockRejectedValue(error);
    const onSubmitError = vi.fn();

    const { result } = renderHook(() =>
      useFormWithToast({
        schema: testSchema,
        onSubmitSuccess,
        onSubmitError,
        errorMessage: 'Erro ao processar',
      })
    );

    result.current.setValue('email', 'test@example.com');
    result.current.setValue('password', 'password123');

    const mockEvent = {
      preventDefault: vi.fn(),
    } as any;

    await result.current.onSubmit(mockEvent);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
      expect(onSubmitError).toHaveBeenCalledWith(error);
    });
  });

  it('should handle array of error messages from backend', async () => {
    const errorWithArrayMessages = {
      response: {
        data: {
          message: ['Erro 1', 'Erro 2', 'Erro 3'],
        },
      },
    };
    const onSubmitSuccess = vi.fn().mockRejectedValue(errorWithArrayMessages);

    const { result } = renderHook(() =>
      useFormWithToast({
        schema: testSchema,
        onSubmitSuccess,
      })
    );

    result.current.setValue('email', 'test@example.com');
    result.current.setValue('password', 'password123');

    const mockEvent = {
      preventDefault: vi.fn(),
    } as any;

    await result.current.onSubmit(mockEvent);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(3);
      expect(toast.error).toHaveBeenCalledWith('Erro 1');
      expect(toast.error).toHaveBeenCalledWith('Erro 2');
      expect(toast.error).toHaveBeenCalledWith('Erro 3');
    });
  });

  it('should extract error message from backend response', async () => {
    const backendError = {
      response: {
        data: {
          message: 'Credenciais inválidas',
        },
      },
    };
    const onSubmitSuccess = vi.fn().mockRejectedValue(backendError);

    const { result } = renderHook(() =>
      useFormWithToast({
        schema: testSchema,
        onSubmitSuccess,
      })
    );

    result.current.setValue('email', 'test@example.com');
    result.current.setValue('password', 'password123');

    const mockEvent = {
      preventDefault: vi.fn(),
    } as any;

    await result.current.onSubmit(mockEvent);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Credenciais inválidas');
    });
  });
});
