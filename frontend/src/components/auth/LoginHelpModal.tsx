'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { supportTicketsService } from '@/services/support-tickets.service';

type LoginHelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  accentSoftColor: string;
  defaultEmail?: string;
  requesterRole: string;
  source: string;
};

type Step = 'options' | 'ticket';

const maxFiles = 3;
const maxFileBytes = 5 * 1024 * 1024;

function normalizeCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatCpf(value: string) {
  const digits = normalizeCpf(value);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatPhone(value: string) {
  const digits = normalizePhone(value);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function LoginHelpModal({
  isOpen,
  onClose,
  accentColor,
  accentSoftColor,
  defaultEmail,
  requesterRole,
  source,
}: LoginHelpModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('options');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('options');
    setEmail(defaultEmail ?? '');
  }, [defaultEmail, isOpen]);

  const helperText = useMemo(
    () => 'Explique o que aconteceu e, se ajudar, anexe ate 3 imagens de no maximo 5MB cada.',
    []
  );

  const resetForm = () => {
    setStep('options');
    setIsSubmitting(false);
    setName('');
    setCpf('');
    setPhone('');
    setEmail(defaultEmail ?? '');
    setDescription('');
    setFiles([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length > maxFiles) {
      toast.error('Envie no maximo 3 imagens.');
      event.target.value = '';
      return;
    }

    const invalidFile = selectedFiles.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      toast.error('Aceitamos apenas imagens JPG, PNG ou WEBP.');
      event.target.value = '';
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > maxFileBytes);
    if (oversizedFile) {
      toast.error(`A imagem ${oversizedFile.name} ultrapassa o limite de 5MB.`);
      event.target.value = '';
      return;
    }

    setFiles(selectedFiles);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error('Informe o nome para abrir o chamado.');
      return;
    }

    if (!email.trim()) {
      toast.error('Informe um email para retorno.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error('Descreva o problema com um pouco mais de detalhe.');
      return;
    }

    try {
      setIsSubmitting(true);
      await supportTicketsService.createPublic({
        name: name.trim(),
        cpf: normalizeCpf(cpf),
        phone: normalizePhone(phone),
        email: email.trim(),
        description: description.trim(),
        images: files,
        requesterRole,
        source,
      });

      toast.success('Chamado enviado com sucesso.');
      handleClose();
    } catch (error) {
      console.error('Erro ao abrir chamado de suporte:', error);
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel abrir o chamado agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'options' ? 'Precisa de ajuda para acessar?' : 'Abrir chamado de suporte'}
      description={
        step === 'options'
          ? 'Escolha como deseja seguir.'
          : 'Preencha as informacoes basicas para o time de suporte entrar em contato.'
      }
      size="2xl"
    >
      {step === 'options' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              handleClose();
              router.push('/forgot-password');
            }}
            className="w-full rounded-2xl border px-5 py-4 text-left transition-colors"
            style={{ borderColor: accentSoftColor, backgroundColor: '#ffffff' }}
          >
            <p className="text-base font-semibold text-gray-900">Alterar senha</p>
            <p className="mt-1 text-sm text-gray-600">
              Siga para o fluxo de recuperacao e redefina a sua senha.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStep('ticket')}
            className="w-full rounded-2xl border px-5 py-4 text-left transition-colors"
            style={{ borderColor: accentSoftColor, backgroundColor: accentSoftColor }}
          >
            <p className="text-base font-semibold text-gray-900">Entrar em contato com o suporte</p>
            <p className="mt-1 text-sm text-gray-700">
              Abra um chamado com identificacao, descricao do problema e anexos.
            </p>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-primary-500"
                placeholder="Seu nome completo"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
              CPF
              <input
                value={formatCpf(cpf)}
                onChange={(event) => setCpf(normalizeCpf(event.target.value))}
                className="h-12 rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-primary-500"
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
              Celular
              <input
                value={formatPhone(phone)}
                onChange={(event) => setPhone(normalizePhone(event.target.value))}
                className="h-12 rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-primary-500"
                placeholder="(00) 00000-0000"
                inputMode="tel"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-primary-500"
                placeholder="voce@email.com"
                type="email"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
            O que esta acontecendo?
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[132px] rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-primary-500"
              placeholder="Descreva o problema com o maximo de contexto possivel."
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
            Imagens do problema
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleFilesChange}
              className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm"
            />
            <span className="text-xs text-gray-500">{helperText}</span>
          </label>

          {files.length > 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-800">Arquivos selecionados</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setStep('options')}
              className="h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-70"
              style={{ backgroundColor: accentColor }}
            >
              {isSubmitting ? 'Enviando chamado...' : 'Enviar chamado'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
