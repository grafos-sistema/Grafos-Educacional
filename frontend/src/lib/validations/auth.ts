import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema, cpfSchema, phoneSchema } from './common';

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema de validação para registro
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  cpf: cpfSchema.optional(),
  phone: phoneSchema.optional(),
  role: z.enum(['TEACHER', 'STUDENT', 'PARENT', 'COORDINATOR', 'INSTITUTION_ADMIN'], {
    message: 'Selecione um perfil válido',
  }),
  institutionId: z.string().min(1, 'Selecione uma instituição'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  }
);

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema de validação para recuperação de senha
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema de validação para redefinição de senha
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  }
);

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Schema de validação para alteração de senha
 */
export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'A nova senha deve ser diferente da atual',
    path: ['newPassword'],
  }
);

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Schema de validação para perfil de usuário
 */
export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  cpf: cpfSchema.optional(),
  phone: phoneSchema.optional(),
  birthDate: z.string().optional(),
  avatar: z.string().url('URL do avatar inválida').optional().or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
