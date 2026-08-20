'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { UserRole, type CreateUserDto } from '@/types/user.types';
import { usersService } from '@/services/users.service';
import { institutionsService } from '@/services/institutions.service';
import type { Institution } from '@/types/institution.types';

type ImportRow = Record<string, string>;
type ImportMode = 'ALL' | 'TEACHERS' | 'STUDENTS';

const COMMON_HEADERS = [
  'nome',
  'sobrenome',
  'nome_social',
  'email',
  'cpf',
  'telefone',
  'whatsapp',
  'telefone_fixo',
  'data_nascimento',
  'genero',
  'endereco',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado',
  'cep',
  'senha',
];

const TEACHER_HEADERS = [
  ...COMMON_HEADERS,
  'especializacao',
  'formacao',
  'registro_profissional',
  'data_admissao',
  'ocupacao',
];

const STUDENT_HEADERS = [
  ...COMMON_HEADERS,
  'situacao',
  'ano_letivo',
  'curso',
  'serie',
  'turma',
  'turno',
  'data_matricula',
  'modalidade',
  'observacoes',
  'tipo_sanguineo',
  'alergias',
  'medicamentos',
  'necessidades_especiais',
  'restricoes_alimentares',
  'convenio_medico',
  'responsavel_nome',
  'responsavel_cpf',
  'responsavel_email',
  'responsavel_celular',
  'responsavel_whatsapp',
  'responsavel_telefone_fixo',
  'parentesco',
  'responsavel_notificacoes',
  'responsavel_pode_retirar',
];

const ALL_HEADERS = [
  'tipo',
  ...COMMON_HEADERS,
  ...TEACHER_HEADERS.slice(COMMON_HEADERS.length),
  ...STUDENT_HEADERS.slice(COMMON_HEADERS.length),
];

const MODE_OPTIONS = [
  { value: 'ALL', label: 'Alunos e professores juntos' },
  { value: 'TEACHERS', label: 'Somente professores' },
  { value: 'STUDENTS', label: 'Somente alunos' },
];

const MODE_LABELS: Record<ImportMode, string> = {
  ALL: 'alunos e professores',
  TEACHERS: 'professores',
  STUDENTS: 'alunos',
};

const PROFESSOR_SAMPLE: ImportRow = {
  tipo: 'PROFESSOR',
  nome: 'Maria',
  sobrenome: 'Oliveira',
  nome_social: 'Maria Oliveira',
  email: 'maria.oliveira@escola.com.br',
  cpf: '12345678901',
  telefone: '11999999999',
  whatsapp: '11999999999',
  telefone_fixo: '1133334444',
  data_nascimento: '1988-04-12',
  genero: 'FEMALE',
  endereco: 'Rua das Flores',
  numero: '120',
  complemento: 'Sala 3',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01001000',
  senha: 'Maria@Grafos2026',
  especializacao: 'Matemática',
  formacao: 'Licenciatura em Matemática',
  registro_profissional: 'REG-2026-001',
  data_admissao: '2026-01-20',
  ocupacao: 'Professora de Matemática',
};

const STUDENT_SAMPLE: ImportRow = {
  tipo: 'ALUNO',
  nome: 'Lucas',
  sobrenome: 'Ferreira',
  nome_social: 'Lucas Ferreira',
  email: 'lucas.ferreira@escola.com.br',
  cpf: '98765432100',
  telefone: '11977776666',
  whatsapp: '11977776666',
  telefone_fixo: '1132221111',
  data_nascimento: '2014-08-20',
  genero: 'MALE',
  endereco: 'Avenida Brasil',
  numero: '450',
  complemento: 'Casa 2',
  bairro: 'Jardim América',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01430000',
  senha: 'Lucas@Grafos2026',
  situacao: 'ATIVO',
  ano_letivo: '2026',
  curso: 'Ensino Fundamental I',
  serie: '1º Ano',
  turma: '1º Ano A',
  turno: 'MATUTINO',
  data_matricula: '2026-01-15',
  modalidade: 'Presencial',
  observacoes: 'Aluno fictício utilizado no modelo de importação.',
  tipo_sanguineo: 'O+',
  alergias: 'Poeira',
  medicamentos: 'Nenhum',
  necessidades_especiais: 'Nenhuma',
  restricoes_alimentares: 'Nenhuma',
  convenio_medico: 'Saúde Escolar Exemplo',
  responsavel_nome: 'Fernanda Ferreira',
  responsavel_cpf: '11122233344',
  responsavel_email: 'fernanda@email.com',
  responsavel_celular: '11988888888',
  responsavel_whatsapp: '11988888888',
  responsavel_telefone_fixo: '1131112222',
  parentesco: 'Mãe',
  responsavel_notificacoes: 'SIM',
  responsavel_pode_retirar: 'SIM',
};

const TEMPLATE_SAMPLES: Record<ImportMode, ImportRow[]> = {
  ALL: [PROFESSOR_SAMPLE, STUDENT_SAMPLE],
  TEACHERS: [PROFESSOR_SAMPLE],
  STUDENTS: [STUDENT_SAMPLE],
};

function headersForMode(mode: ImportMode) {
  if (mode === 'TEACHERS') return TEACHER_HEADERS;
  if (mode === 'STUDENTS') return STUDENT_HEADERS;
  return ALL_HEADERS;
}

function templateForMode(mode: ImportMode) {
  const headers = headersForMode(mode);
  const rows = TEMPLATE_SAMPLES[mode].map((sample) =>
    headers.map((header) => sample[header] ?? '').join(';'),
  );

  return [headers.join(';'), ...rows].join('\n');
}

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
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());
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

function roleForRow(row: ImportRow, mode: ImportMode) {
  if (mode === 'STUDENTS') return UserRole.STUDENT;
  if (mode === 'TEACHERS') return UserRole.TEACHER;
  return normalizedRole(row.tipo);
}

function institutionName(institution: Institution) {
  return institution.name || institution.slug;
}

export function BulkUserImportModal({
  isOpen,
  onClose,
  onComplete,
  defaultMode = '',
  lockMode = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  defaultMode?: ImportMode | '';
  lockMode?: boolean;
}) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [mode, setMode] = useState<ImportMode | ''>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const institutionsRequested = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedInstitution = useMemo(
    () => institutions.find((institution) => institution.id === institutionId),
    [institutionId, institutions],
  );
  const availableUnits = useMemo(
    () => (selectedInstitution?.units ?? []).filter((unit) => unit.isActive),
    [selectedInstitution],
  );
  const selectedUnit = availableUnits.find((unit) => unit.id === unitId);
  const filteredInstitutions = useMemo(() => {
    const search = institutionSearch.trim().toLocaleLowerCase('pt-BR');
    if (!search) return institutions;
    return institutions.filter((institution) =>
      institutionName(institution).toLocaleLowerCase('pt-BR').includes(search),
    );
  }, [institutionSearch, institutions]);

  const validRows = useMemo(
    () => rows.filter((row) => {
      const role = mode ? roleForRow(row, mode) : null;
      const hasBasicData = Boolean(role && row.nome?.trim() && row.sobrenome?.trim() && row.email?.trim());
      return hasBasicData && (role !== UserRole.STUDENT || Boolean(row.responsavel_nome?.trim()));
    }),
    [mode, rows],
  );

  const resetFile = () => {
    setRows([]);
    setFileName('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const response = await institutionsService.findAll({ page: 1, limit: 500, isActive: true });
      setInstitutions(response.data);
    } catch {
      toast.error('Não foi possível carregar as instituições.');
    } finally {
      setLoadingInstitutions(false);
    }
  };

  useEffect(() => {
    if (isOpen && defaultMode && mode !== defaultMode) {
      setMode(defaultMode);
    }
  }, [defaultMode, isOpen, mode]);

  useEffect(() => {
    if (!isOpen) {
      institutionsRequested.current = false;
      return;
    }

    if (!institutionsRequested.current) {
      institutionsRequested.current = true;
      void loadInstitutions();
    }
  }, [isOpen]);

  const selectInstitution = (institution: Institution) => {
    setInstitutionId(institution.id);
    setInstitutionSearch(institutionName(institution));
    setUnitId('');
    setMode('');
    resetFile();
  };

  const handleInstitutionSearch = (value: string) => {
    setInstitutionSearch(value);
    if (!selectedInstitution || value !== institutionName(selectedInstitution)) {
      setInstitutionId('');
      setUnitId('');
      setMode('');
      resetFile();
    }
  };

  const handleModeChange = (nextMode: ImportMode | '') => {
    setMode(nextMode);
    resetFile();
  };

  const downloadTemplate = () => {
    if (!mode) {
      toast.error('Selecione o tipo de importação para baixar o modelo correto.');
      return;
    }

    const blob = new Blob([`\uFEFF${templateForMode(mode)}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `modelo-importacao-${mode.toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!mode) {
      toast.error('Selecione o tipo de importação antes do arquivo.');
      event.target.value = '';
      return;
    }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setRows(parseFile(String(reader.result ?? '')));
    reader.readAsText(file, 'UTF-8');
  };

  const importUsers = async () => {
    if (!institutionId || !selectedInstitution) {
      toast.error('Selecione a instituição dos usuários.');
      return;
    }
    if (!unitId) {
      toast.error('Selecione o anexo da instituição.');
      return;
    }
    if (!mode) {
      toast.error('Selecione se a importação será de alunos, professores ou dos dois.');
      return;
    }
    if (validRows.length === 0) {
      toast.error('Envie um arquivo com linhas válidas para o modelo selecionado.');
      return;
    }

    setIsLoading(true);
    const errors: string[] = [];
    let imported = 0;

    for (const [index, row] of validRows.entries()) {
      const role = roleForRow(row, mode);
      if (!role) continue;

      const payload: CreateUserDto = {
        email: row.email,
        password: row.senha || undefined,
        role,
        firstName: row.nome,
        lastName: row.sobrenome,
        socialName: row.nome_social || undefined,
        cpf: row.cpf || undefined,
        phone: row.telefone || undefined,
        whatsapp: row.whatsapp || undefined,
        telefoneFixo: row.telefone_fixo || undefined,
        birthDate: row.data_nascimento || undefined,
        gender: (row.genero || undefined) as CreateUserDto['gender'],
        address: row.endereco || undefined,
        numero: row.numero || undefined,
        complemento: row.complemento || undefined,
        bairro: row.bairro || undefined,
        city: row.cidade || undefined,
        state: row.estado || undefined,
        zipCode: row.cep || undefined,
        institutionId,
        unitId,
        specialization: row.especializacao || undefined,
        degree: row.formacao || undefined,
        registrationNumber: row.registro_profissional || undefined,
        hireDate: row.data_admissao || undefined,
        occupation: row.ocupacao || undefined,
        unidade: selectedUnit?.name,
        situacao: row.situacao || undefined,
        anoLetivo: row.ano_letivo || undefined,
        curso: row.curso || undefined,
        serie: row.serie || undefined,
        turma: row.turma || undefined,
        turno: row.turno || undefined,
        dataMatricula: row.data_matricula || undefined,
        modalidade: row.modalidade || undefined,
        observacoes: row.observacoes || undefined,
        healthInfo: role === UserRole.STUDENT ? {
          tipoSanguineo: row.tipo_sanguineo || null,
          alergias: row.alergias || null,
          medicamentos: row.medicamentos || null,
          necessidadesEspeciais: row.necessidades_especiais || null,
          restricoesAlimentares: row.restricoes_alimentares || null,
          convenioMedico: row.convenio_medico || null,
        } : undefined,
        responsaveis: role === UserRole.STUDENT && row.responsavel_nome
          ? [{
              nome: row.responsavel_nome,
              cpf: row.responsavel_cpf || undefined,
              email: row.responsavel_email || undefined,
              celular: row.responsavel_celular || undefined,
              whatsapp: row.responsavel_whatsapp || undefined,
              telefoneFixo: row.responsavel_telefone_fixo || undefined,
              parentesco: row.parentesco || 'Responsável',
              notificacoes: ['SIM', 'S', 'TRUE', '1'].includes(row.responsavel_notificacoes?.trim().toUpperCase() || '') || undefined,
              podeRetirar: ['SIM', 'S', 'TRUE', '1'].includes(row.responsavel_pode_retirar?.trim().toUpperCase() || '') || undefined,
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
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => undefined : onClose}
      title="Importar usuários em massa"
      description="Escolha a instituição, o anexo e o tipo de cadastro antes de enviar a planilha."
      size="2xl"
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
          O arquivo deve seguir o modelo do tipo escolhido. Para alunos, o nome do responsável é obrigatório e será criado/vinculado automaticamente ao aluno.
        </div>

        <div className="space-y-2">
          <label htmlFor="bulk-import-institution" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Instituição <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="bulk-import-institution"
              value={institutionSearch}
              onChange={(event) => handleInstitutionSearch(event.target.value)}
              placeholder={loadingInstitutions ? 'Carregando instituições...' : 'Buscar instituição pelo nome'}
              disabled={loadingInstitutions || isLoading}
              className="block w-full rounded-lg border-2 border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-900/30"
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
          {!institutionId && !loadingInstitutions ? (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              {filteredInstitutions.length > 0 ? filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  onClick={() => selectInstitution(institution)}
                  className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 transition-colors last:border-0 hover:bg-primary-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-primary-900/20"
                >
                  <span className="font-medium">{institutionName(institution)}</span>
                  {institution.city || institution.state ? (
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      {[institution.city, institution.state].filter(Boolean).join(' - ')}
                    </span>
                  ) : null}
                </button>
              )) : (
                <p className="px-4 py-3 text-sm text-gray-500">Nenhuma instituição encontrada.</p>
              )}
            </div>
          ) : null}
          {selectedInstitution ? (
            <p className="text-xs text-green-700 dark:text-green-400">
              Instituição selecionada: {institutionName(selectedInstitution)}
            </p>
          ) : null}
        </div>

        {institutionId ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Anexo da instituição"
              value={unitId}
              onChange={(event) => {
                setUnitId(event.target.value);
                setMode('');
                resetFile();
              }}
              options={[{ value: '', label: 'Selecione o anexo...' }, ...availableUnits.map((unit) => ({ value: unit.id, label: unit.name }))]}
              disabled={isLoading}
              required
              helpText={availableUnits.length === 0 ? 'Esta instituição ainda não possui anexos ativos.' : 'Os usuários serão vinculados a este anexo.'}
            />
            {unitId ? (
              lockMode ? (
                <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-900/50 dark:bg-primary-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">Tipo da importação</p>
                  <p className="mt-1 text-sm font-medium text-primary-900 dark:text-primary-100">{MODE_LABELS[mode || defaultMode as ImportMode]}</p>
                  <p className="mt-1 text-xs text-primary-700/80 dark:text-primary-300/80">Este modelo foi definido pelo menu que você acessou.</p>
                </div>
              ) : (
                <Select
                  label="O que deseja importar?"
                  value={mode}
                  onChange={(event) => handleModeChange(event.target.value as ImportMode | '')}
                  options={[{ value: '', label: 'Selecione...' }, ...MODE_OPTIONS]}
                  disabled={isLoading}
                  required
                />
              )
            ) : (
              <div className="flex items-center rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Selecione o anexo para liberar o tipo de importação.
              </div>
            )}
          </div>
        ) : null}

        {mode ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={downloadTemplate} leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}>
              Baixar modelo de {MODE_LABELS[mode]}
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
              <DocumentArrowUpIcon className="h-5 w-5" />
              Selecionar arquivo
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} disabled={isLoading} />
            </label>
            {fileName ? <span className="self-center text-sm text-gray-500">{fileName}</span> : null}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">E-mail</th>
                  <th className="px-3 py-2">Anexo</th>
                  <th className="px-3 py-2">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row, index) => {
                  const role = mode ? roleForRow(row, mode) : null;
                  return (
                    <tr key={`${row.email}-${index}`} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2">{role === UserRole.STUDENT ? 'Aluno' : role === UserRole.TEACHER ? 'Professor' : row.tipo || '-'}</td>
                      <td className="px-3 py-2">{`${row.nome || ''} ${row.sobrenome || ''}`.trim() || '-'}</td>
                      <td className="px-3 py-2">{row.email || '-'}</td>
                      <td className="px-3 py-2">{selectedUnit?.name || '-'}</td>
                      <td className="px-3 py-2">{row.responsavel_nome || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 8 ? <p className="px-3 py-2 text-xs text-gray-500">Mostrando 8 de {rows.length} linhas.</p> : null}
            {validRows.length < rows.length ? <p className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">{rows.length - validRows.length} linha(s) não serão importadas porque estão incompletas ou não correspondem ao modelo selecionado.</p> : null}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700">
            <p>{result.imported} usuário(s) importado(s) com sucesso.</p>
            {result.errors.length > 0 ? <ul className="mt-2 list-disc pl-5 text-red-700">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Fechar</Button>
          <Button onClick={importUsers} isLoading={isLoading} disabled={!mode || !institutionId || !unitId || validRows.length === 0}>
            Importar {validRows.length > 0 ? `${validRows.length} linha(s)` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
