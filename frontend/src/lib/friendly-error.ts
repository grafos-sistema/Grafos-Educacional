import { showErrorDialog } from '@/lib/error-dialog';
import { toast } from 'react-hot-toast';

export interface FriendlyErrorInfo {
  title: string;
  description: string;
  rawMessage: string;
}

type FriendlyHandledError = {
  __friendlyHandled?: boolean;
  __friendlyErrorInfo?: FriendlyErrorInfo;
  message?: string | string[];
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

function extractRawMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'string') return error;

  if (Array.isArray(error)) {
    return error.filter(Boolean).join(' ');
  }

  if (error && typeof error === 'object') {
    const typedError = error as FriendlyHandledError & Record<string, unknown>;
    const nestedMessage = typedError.response?.data?.message;

    if (Array.isArray(nestedMessage)) {
      return nestedMessage.filter(Boolean).join(' ');
    }

    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage;
    }

    if (Array.isArray(typedError.message)) {
      return typedError.message.filter(Boolean).join(' ');
    }

    if (typeof typedError.message === 'string' && typedError.message.trim()) {
      return typedError.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function buildFriendlyMessage(rawMessage: string, fallbackMessage: string): FriendlyErrorInfo {
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes('teachers_registrationnumber_key')) {
    return {
      title: 'Nao foi possivel salvar o professor',
      description: 'Ja existe um professor com esse numero de registro. Confira esse campo e tente novamente.',
      rawMessage,
    };
  }

  if (normalized.includes('students_registrationnumber_key')) {
    return {
      title: 'Nao foi possivel salvar o aluno',
      description: 'Ja existe um aluno com essa matricula. Confira esse campo e tente novamente.',
      rawMessage,
    };
  }

  if (normalized.includes('registrationnumber_key')) {
    return {
      title: 'Nao foi possivel salvar este cadastro',
      description: 'Ja existe um cadastro com esse numero de registro ou matricula. Revise esse campo e tente novamente.',
      rawMessage,
    };
  }

  if (
    normalized.includes('users_email_key') ||
    normalized.includes('email already registered') ||
    normalized.includes('já existe um usuário com este email') ||
    normalized.includes('ja existe um usuario com este email')
  ) {
    return {
      title: 'Email ja cadastrado',
      description: 'Esse email ja esta em uso por outro usuario. Use outro email ou revise o cadastro existente.',
      rawMessage,
    };
  }

  if (
    normalized.includes('users_cpf_key') ||
    (normalized.includes('cpf') && normalized.includes('duplicate key')) ||
    normalized.includes('cpf_already_registered') ||
    normalized.includes('já existe um usuário com este cpf') ||
    normalized.includes('ja existe um usuario com este cpf')
  ) {
    return {
      title: 'CPF ja cadastrado',
      description: 'Esse CPF ja esta em uso por outro usuario. Confira o numero informado antes de tentar novamente.',
      rawMessage,
    };
  }

  if (
    normalized.includes('cpf inválido') ||
    normalized.includes('cpf invalido') ||
    normalized.includes('cpf deve conter')
  ) {
    return {
      title: 'CPF inválido',
      description: 'Informe um CPF válido para continuar o cadastro.',
      rawMessage,
    };
  }

  if (
    normalized.includes('conflito de horário') ||
    normalized.includes('conflito de horario') ||
    normalized.includes('já tem aula') ||
    normalized.includes('ja tem aula') ||
    normalized.includes('já possui aula') ||
    normalized.includes('ja possui aula')
  ) {
    return {
      title: 'Conflito de horário',
      description: rawMessage,
      rawMessage,
    };
  }

  if (normalized.includes('student_requires_at_least_one_guardian')) {
    return {
      title: 'Responsavel obrigatorio',
      description: 'Todo aluno precisa ter pelo menos um responsavel cadastrado antes de salvar.',
      rawMessage,
    };
  }

  if (normalized.includes('foreign key constraint')) {
    return {
      title: 'Nao foi possivel concluir a acao',
      description: 'Esse registro possui vinculos com outros dados do sistema. Revise os relacionamentos antes de continuar.',
      rawMessage,
    };
  }

  if (
    normalized.includes('violates not-null constraint') ||
    normalized.includes('should not be empty') ||
    normalized.includes('campo obrigatorio') ||
    normalized.includes('campo obrigatório')
  ) {
    return {
      title: 'Faltam informacoes obrigatorias',
      description: 'Preencha os campos obrigatorios e tente novamente.',
      rawMessage,
    };
  }

  if (
    normalized.includes('timeout') ||
    normalized.includes('network error') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('erro de conexão') ||
    normalized.includes('erro de conexao')
  ) {
    return {
      title: 'Problema de conexao',
      description: 'Nao conseguimos concluir a acao agora. Verifique sua conexao e tente novamente.',
      rawMessage,
    };
  }

  if (
    normalized.includes('forbidden') ||
    normalized.includes('nao tem permissao') ||
    normalized.includes('não tem permissão') ||
    normalized.includes('acesso negado') ||
    normalized.includes('acesso restrito') ||
    normalized.includes('roles permitidos') ||
    normalized.includes('apenas super admin') ||
    normalized.includes('somente super admin')
  ) {
    return {
      title: 'Acesso nao permitido',
      description: 'Voce nao tem permissao para realizar essa acao.',
      rawMessage,
    };
  }

  if (normalized.includes('not found') || normalized.includes('nao encontrado') || normalized.includes('não encontrado')) {
    return {
      title: 'Registro nao encontrado',
      description: 'Nao encontramos as informacoes solicitadas. Atualize a pagina e tente novamente.',
      rawMessage,
    };
  }

  if (normalized.includes('bucket not found')) {
    return {
      title: 'Anexo indisponivel no momento',
      description: 'O sistema ainda nao conseguiu preparar o armazenamento dos anexos. Tente novamente daqui a pouco ou fale com a equipe.',
      rawMessage,
    };
  }

  if (normalized.includes('duplicate key value violates unique constraint') || normalized.includes('duplicate key')) {
    return {
      title: 'Dados duplicados',
      description: 'Ja existe um cadastro com uma das informacoes informadas. Revise os campos e tente novamente.',
      rawMessage,
    };
  }

  if (normalized.includes('internal server error') || normalized.includes('erro interno')) {
    return {
      title: 'Algo nao saiu como esperado',
      description: 'O sistema nao conseguiu concluir a acao agora. Tente novamente em instantes.',
      rawMessage,
    };
  }

  return {
    title: 'Nao foi possivel concluir a acao',
    description: fallbackMessage,
    rawMessage,
  };
}

export function getFriendlyErrorInfo(
  error: unknown,
  fallbackMessage = 'Tente novamente em instantes ou revise os dados informados.'
): FriendlyErrorInfo {
  const rawMessage = extractRawMessage(error, fallbackMessage);
  return buildFriendlyMessage(rawMessage, fallbackMessage);
}

export function presentFriendlyError(
  error: unknown,
  fallbackMessage = 'Tente novamente em instantes ou revise os dados informados.'
): FriendlyErrorInfo {
  const handledError = error as FriendlyHandledError | undefined;

  if (handledError?.__friendlyHandled && handledError.__friendlyErrorInfo) {
    return handledError.__friendlyErrorInfo;
  }

  const info = getFriendlyErrorInfo(error, fallbackMessage);
  const shown = showErrorDialog({
    title: info.title,
    description: info.description,
  });

  if (!shown && typeof window !== 'undefined') {
    toast.error(info.description);
  }

  return info;
}
