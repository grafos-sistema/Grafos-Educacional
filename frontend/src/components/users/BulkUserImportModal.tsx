'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownTrayIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { UserRole, type CreateUserDto } from '@/types/user.types';
import { usersService } from '@/services/users.service';
import { type UserInstitutionOption, authService } from '@/services/auth.service';

type ImportRow = Record<string, string>;

const HEADERS = [
  'tipo',
  'nome',
  'sobrenome',
  'email',
  'cpf',
  'telefone',
  'data_nascimento',
  'senha',
  'instituicao_id',
  'responsavel_nome',
  'responsavel_cpf',
  'responsavel_email',
  'responsavel_celular',
  'parentesco',
  'especializacao',
  'formacao',
  'registro_profissional',
];

const TEMPLATE = [
  HEADERS.join(';'),
  [
    'PROFESSOR',
    'Maria',
    'Oliveira',
    'maria.oliveira@escola.com.br',
    '',
    '11999999999',
    '1988-04-12',
    '',
    'ID_DA_INSTITUICAO',
    '',
    '',
    '',
    '',
    '',
    'Matemática',
    'Licenciatura',
    '',
  ].join(';'),
  [
    'ALUNO',
    'Lucas',
    'Ferreira',
    'lucas.ferreira@escola.com.br',
    '',
    '',
    '2014-08-20',
    '',
    'ID_DA_INSTITUICAO',
    'Fernanda Ferreira',
    '',
    'fernanda@email.com',
    '11988888888',
    'Mãe',
    '',
    '',
    '',
  ].join(';'),
].join('\n');

function splitLine(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ';' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value.trim());
  return values;
}

function parseFile(content: string): ImportRow[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitLine(lines[0]).map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitLine(line);
    return headers.reduce<ImportRow>((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function normalizedRole(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'ALUNO' || normalized === 'STUDENT') return UserRole.STUDENT;
  if (normalized === 'PROFESSOR' || normalized === 'TEACHER') return UserRole.TEACHER;
  return null;
}

export function BulkUserImportModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [institutions, setInstitutions] = useState<UserInstitutionOption[]>([]);
  const [institutionId, setInstitutionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const institutionsRequested = useRef(false);

  const validRows = useMemo(
    () => rows.filter((row) => normalizedRole(row.tipo) && row.nome && row.sobrenome && row.email),
    [rows],
  );

  const loadInstitutions = async () => {
    try {
      const data = await authService.getInstitutions();
      setInstitutions(data);
      if (data.length === 1) setInstitutionId(data[0].id);
    } catch {
      toast.error('Não foi possível carregar as instituições.');
    }
  };

  useEffect(() => {
    if (isOpen && !institutionsRequested.current) {
      institutionsRequested.current = true;
      void loadInstitutions();
    }
  }, [isOpen]);

  const downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${TEMPLATE}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'modelo-importacao-usuarios.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setRows(parseFile(String(reader.result ?? '')));
    reader.readAsText(file, 'UTF-8');
  };

  const importUsers = async () => {
    if (!institutionId) {
      toast.error('Selecione a instituição dos usuários.');
      return;
    }
    if (validRows.length === 0) {
      toast.error('Envie um arquivo com linhas válidas de aluno ou professor.');
      return;
    }

    setIsLoading(true);
    const errors: string[] = [];
    let imported = 0;

    for (const [index, row] of validRows.entries()) {
      const role = normalizedRole(row.tipo)!;
      const payload: CreateUserDto = {
        email: row.email,
        password: row.senha || undefined,
        role,
        firstName: row.nome,
        lastName: row.sobrenome,
        cpf: row.cpf || undefined,
        phone: row.telefone || undefined,
        birthDate: row.data_nascimento || undefined,
        institutionId: row.instituicao_id && !row.instituicao_id.startsWith('ID_')
          ? row.instituicao_id
          : institutionId,
        specialization: row.especializacao || undefined,
        degree: row.formacao || undefined,
        registrationNumber: row.registro_profissional || undefined,
        responsaveis: role === UserRole.STUDENT && row.responsavel_nome
          ? [{
              nome: row.responsavel_nome,
              cpf: row.responsavel_cpf || undefined,
              email: row.responsavel_email || undefined,
              celular: row.responsavel_celular || undefined,
              parentesco: row.parentesco || 'Responsável',
            }]
          : undefined,
      };

      try {
        await usersService.create(payload);
        imported += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'erro não identificado';
        errors.push(`Linha ${index + 2}: ${message}`);
      }
    }

    setResult({ imported, errors });
    setIsLoading(false);
    if (imported > 0) onComplete();
  };

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => undefined : onClose} title="Importar alunos e professores" size="2xl">
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Use o arquivo CSV do modelo. Alunos precisam ter um responsável na mesma linha; professores não precisam de responsável.
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={downloadTemplate} leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}>
            Baixar modelo CSV
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
            <DocumentArrowUpIcon className="h-5 w-5" />
            Selecionar arquivo
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
          {fileName ? <span className="self-center text-sm text-gray-500">{fileName}</span> : null}
        </div>

        <Select
          label="Instituição padrão"
          value={institutionId}
          onChange={(event) => setInstitutionId(event.target.value)}
          options={[{ value: '', label: 'Selecione...' }, ...institutions.map((item) => ({ value: item.id, label: item.name }))]}
          helpText="A coluna instituicao_id pode substituir esta instituição em uma linha específica."
        />

        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">E-mail</th><th className="px-3 py-2">Responsável</th></tr></thead>
              <tbody>{rows.slice(0, 8).map((row, index) => <tr key={`${row.email}-${index}`} className="border-t border-gray-100 dark:border-gray-700"><td className="px-3 py-2">{row.tipo || '-'}</td><td className="px-3 py-2">{`${row.nome || ''} ${row.sobrenome || ''}`.trim() || '-'}</td><td className="px-3 py-2">{row.email || '-'}</td><td className="px-3 py-2">{row.responsavel_nome || '—'}</td></tr>)}</tbody>
            </table>
            {rows.length > 8 ? <p className="px-3 py-2 text-xs text-gray-500">Mostrando 8 de {rows.length} linhas.</p> : null}
          </div>
        ) : null}

        {result ? <div className="rounded-lg border border-gray-200 p-4 text-sm"><p>{result.imported} usuário(s) importado(s) com sucesso.</p>{result.errors.length > 0 ? <ul className="mt-2 list-disc pl-5 text-red-700">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div> : null}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Fechar</Button>
          <Button onClick={importUsers} isLoading={isLoading} disabled={validRows.length === 0}>Importar {validRows.length > 0 ? `${validRows.length} linha(s)` : ''}</Button>
        </div>
      </div>
    </Modal>
  );
}
