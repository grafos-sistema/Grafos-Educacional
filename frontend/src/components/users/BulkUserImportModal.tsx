'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { UserRole, type CreateUserDto } from '@/types/user.types';
import { usersService } from '@/services/users.service';
import { classesService } from '@/services/classes.service';
import { institutionsService } from '@/services/institutions.service';
import type { Institution } from '@/types/institution.types';
import type { Class } from '@/types/class.types';
import { getFriendlyErrorInfo } from '@/lib/friendly-error';

type ImportRow = Record<string, string> & {
  __lineNumber?: string;
};
type ImportMode = 'ALL' | 'TEACHERS' | 'STUDENTS';
type ImportBatchSize = 1 | 5 | 10;

const IMPORT_BATCH_OPTIONS: Array<{
  value: ImportBatchSize;
  label: string;
  description: string;
}> = [
  {
    value: 1,
    label: 'Sequencial',
    description: 'Um usuário por vez, com máxima estabilidade.',
  },
  {
    value: 5,
    label: 'Grupos de 3 a 5',
    description: 'Até 5 usuários ao mesmo tempo, equilibrando velocidade.',
  },
  {
    value: 10,
    label: 'Grupos de 6 a 10',
    description: 'Até 10 usuários ao mesmo tempo, para planilhas maiores.',
  },
];

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
  'responsavel_data_nascimento',
  'responsavel_financeiro',
  'responsavel_contato_emergencia',
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
  responsavel_data_nascimento: '1982-06-18',
  responsavel_financeiro: 'SIM',
  responsavel_contato_emergencia: 'SIM',
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
    headers
      .map(
        (header) => sample[header] ?? (mode === 'ALL' ? 'NÃO SE APLICA' : ''),
      )
      .join(';'),
  );

  return [headers.join(';'), ...rows].join('\n');
}

function splitLine(line: string, delimiter: ',' | ';') {
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
    } else if (char === delimiter && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value.trim());
  return values;
}

function detectDelimiter(headerLine: string): ',' | ';' {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;

  for (let index = 0; index < headerLine.length; index += 1) {
    const char = headerLine[index];
    if (char === '"') {
      if (quoted && headerLine[index + 1] === '"') {
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === ',') commas += 1;
    if (!quoted && char === ';') semicolons += 1;
  }

  return commas > semicolons ? ',' : ';';
}

function parseFile(content: string): ImportRow[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map((header) =>
    header.toLowerCase(),
  );
  return lines.slice(1).map((line, index) => {
    const values = splitLine(line, delimiter);
    const row = headers.reduce<ImportRow>((parsedRow, header, valueIndex) => {
      parsedRow[header] = values[valueIndex] ?? '';
      return parsedRow;
    }, {});
    row.__lineNumber = String(index + 2);
    return row;
  });
}

function normalizedRole(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'ALUNO' || normalized === 'STUDENT')
    return UserRole.STUDENT;
  if (normalized === 'PROFESSOR' || normalized === 'TEACHER')
    return UserRole.TEACHER;
  return null;
}

function roleForRow(row: ImportRow, mode: ImportMode) {
  if (mode === 'STUDENTS') return UserRole.STUDENT;
  if (mode === 'TEACHERS') return UserRole.TEACHER;
  return normalizedRole(row.tipo);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function rowValidationError(row: ImportRow, mode: ImportMode) {
  const role = roleForRow(row, mode);

  if (!role) return 'tipo de usuário inválido';
  if (!row.nome?.trim() || !row.sobrenome?.trim()) {
    return 'nome e sobrenome são obrigatórios';
  }
  if (!isValidEmail(row.email || '')) return 'e-mail inválido';
  if (role === UserRole.STUDENT && !row.responsavel_nome?.trim()) {
    return 'nome do responsável é obrigatório para alunos';
  }

  return null;
}

function normalizeErrorText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function friendlyImportError(error: unknown) {
  const info = getFriendlyErrorInfo(
    error,
    'Não foi possível importar este usuário. Revise os dados e tente novamente.',
  );
  const normalized = normalizeErrorText(`${info.rawMessage} ${info.description}`);
  const isDuplicate =
    normalized.includes('duplicate') ||
    normalized.includes('duplicad') ||
    normalized.includes('ja existe') ||
    normalized.includes('cadastrad') ||
    normalized.includes('already registered') ||
    normalized.includes('unique constraint');

  if (normalized.includes('cpf') && isDuplicate) {
    return 'CPF duplicado: já existe outro usuário com esse CPF.';
  }

  if (
    normalized.includes('email') &&
    (normalized.includes('invalid') ||
      normalized.includes('invalido') ||
      normalized.includes('format') ||
      normalized.includes('validate'))
  ) {
    return 'E-mail inválido: confira o endereço informado.';
  }

  if (
    normalized.includes('email') &&
    (isDuplicate || normalized.includes('registered'))
  ) {
    return 'E-mail já cadastrado: informe outro endereço.';
  }

  if (normalized.includes('cpf') && normalized.includes('invalido')) {
    return 'CPF inválido: confira os números informados.';
  }

  if (
    normalized.includes('obrigatori') ||
    normalized.includes('required') ||
    normalized.includes('not-null')
  ) {
    return 'Dados incompletos: preencha os campos obrigatórios.';
  }

  if (
    normalized.includes('forbidden') ||
    normalized.includes('permissao') ||
    normalized.includes('acesso negado')
  ) {
    return 'Acesso não permitido para importar este usuário.';
  }

  if (
    normalized.includes('network') ||
    normalized.includes('timeout') ||
    normalized.includes('conexao') ||
    normalized.includes('conexão')
  ) {
    return 'Falha de conexão: tente importar esta linha novamente.';
  }

  return info.description;
}

function institutionName(institution: Institution) {
  return institution.name || institution.slug;
}

function normalizeImportLookup(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[ºª]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveImportedClassId(row: ImportRow, classes: Class[]) {
  const className = normalizeImportLookup(row.turma);
  const courseName = normalizeImportLookup(row.curso);
  const grade = normalizeImportLookup(row.serie);
  const shift = normalizeImportLookup(row.turno);
  const academicYear = normalizeImportLookup(row.ano_letivo);

  if (!className || !courseName || !grade || !academicYear) return undefined;

  const candidates = classes.filter((item) => {
    const itemClassName = normalizeImportLookup(item.name);
    const itemCourseName = normalizeImportLookup(item.course?.name);
    const itemGrade = normalizeImportLookup(item.grade);
    const itemShift = normalizeImportLookup(item.shift);
    const itemAcademicYear = normalizeImportLookup(
      item.academicYear?.year ?? item.academicYear?.name,
    );

    const classMatches =
      itemClassName === className || itemClassName.endsWith(` ${className}`);
    const yearMatches =
      itemAcademicYear === academicYear || itemAcademicYear.includes(academicYear);

    return (
      item.isActive &&
      classMatches &&
      itemCourseName === courseName &&
      itemGrade === grade &&
      yearMatches &&
      (!shift || itemShift === shift)
    );
  });

  return candidates.length === 1 ? candidates[0].id : undefined;
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
  const [classes, setClasses] = useState<Class[]>([]);
  const [mode, setMode] = useState<ImportMode | ''>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importBatchSize, setImportBatchSize] = useState<ImportBatchSize>(1);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
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
    () => (mode ? rows.filter((row) => !rowValidationError(row, mode)) : []),
    [mode, rows],
  );
  const invalidRows = useMemo(
    () =>
      mode
        ? rows
            .map((row) => ({ row, reason: rowValidationError(row, mode) }))
            .filter(
              (item): item is { row: ImportRow; reason: string } =>
                Boolean(item.reason),
            )
        : [],
    [mode, rows],
  );

  const resetFile = () => {
    setRows([]);
    setFileName('');
    setResult(null);
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const response = await institutionsService.findAll({
        page: 1,
        limit: 500,
        isActive: true,
      });
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

  useEffect(() => {
    if (!isOpen || !institutionId) {
      setClasses([]);
      return;
    }

    let cancelled = false;
    void classesService
      .findAll({ institutionId, page: 1, limit: 500, isActive: true })
      .then((response) => {
        if (!cancelled) setClasses(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [institutionId, isOpen]);

  const selectInstitution = (institution: Institution) => {
    setInstitutionId(institution.id);
    setInstitutionSearch(institutionName(institution));
    setUnitId('');
    setMode('');
    resetFile();
  };

  const handleInstitutionSearch = (value: string) => {
    setInstitutionSearch(value);
    if (
      !selectedInstitution ||
      value !== institutionName(selectedInstitution)
    ) {
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
      toast.error(
        'Selecione o tipo de importação para baixar o modelo correto.',
      );
      return;
    }

    const blob = new Blob([`\uFEFF${templateForMode(mode)}`], {
      type: 'text/csv;charset=utf-8;',
    });
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
      toast.error(
        'Selecione se a importação será de alunos, professores ou dos dois.',
      );
      return;
    }
    if (validRows.length === 0) {
      toast.error(
        'Envie um arquivo com linhas válidas para o modelo selecionado.',
      );
      return;
    }

    setIsLoading(true);
    setImportProgress(0);
    const errors: string[] = invalidRows.map(
      ({ row, reason }) => `Linha ${row.__lineNumber ?? '?'}: ${reason}`,
    );
    let imported = 0;
    const buildPayload = (row: ImportRow, role: UserRole): CreateUserDto => ({
      email: row.email.trim(),
      password: row.senha || undefined,
      role,
      firstName: row.nome.trim(),
      lastName: row.sobrenome.trim(),
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
      importSource: role === UserRole.STUDENT ? 'BULK_IMPORT' : undefined,
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
      turmaId:
        role === UserRole.STUDENT
          ? resolveImportedClassId(row, classes)
          : undefined,
      turno: row.turno || undefined,
      dataMatricula: row.data_matricula || undefined,
      modalidade: row.modalidade || undefined,
      observacoes: row.observacoes || undefined,
      healthInfo:
        role === UserRole.STUDENT
          ? {
              tipoSanguineo: row.tipo_sanguineo || null,
              alergias: row.alergias || null,
              medicamentos: row.medicamentos || null,
              necessidadesEspeciais: row.necessidades_especiais || null,
              restricoesAlimentares: row.restricoes_alimentares || null,
              convenioMedico: row.convenio_medico || null,
            }
          : undefined,
      responsaveis:
        role === UserRole.STUDENT && row.responsavel_nome
          ? [
              {
                nome: row.responsavel_nome,
                cpf: row.responsavel_cpf || undefined,
                email: row.responsavel_email || undefined,
                celular: row.responsavel_celular || undefined,
                whatsapp: row.responsavel_whatsapp || undefined,
                telefoneFixo: row.responsavel_telefone_fixo || undefined,
                parentesco: row.parentesco || 'Responsável',
                dataNascimento: row.responsavel_data_nascimento || undefined,
                financeiro: ['SIM', 'S', 'TRUE', '1'].includes(
                  row.responsavel_financeiro?.trim().toUpperCase() || '',
                ),
                contatoEmergencia: ['SIM', 'S', 'TRUE', '1'].includes(
                  row.responsavel_contato_emergencia?.trim().toUpperCase() ||
                    '',
                ),
                notificacoes:
                  ['SIM', 'S', 'TRUE', '1'].includes(
                    row.responsavel_notificacoes?.trim().toUpperCase() || '',
                  ) || undefined,
                podeRetirar:
                  ['SIM', 'S', 'TRUE', '1'].includes(
                    row.responsavel_pode_retirar?.trim().toUpperCase() || '',
                  ) || undefined,
              },
            ]
          : undefined,
    });
    const rowsToImport = validRows.flatMap((row) => {
      const role = roleForRow(row, mode);
      return role ? [{ row, role }] : [];
    });

    try {
      for (
        let start = 0;
        start < rowsToImport.length;
        start += importBatchSize
      ) {
        const batch = rowsToImport.slice(start, start + importBatchSize);
        const batchResults = await Promise.allSettled(
          batch.map(({ row, role }) =>
            usersService.create(buildPayload(row, role)),
          ),
        );

        batchResults.forEach((batchResult, batchIndex) => {
          const row = batch[batchIndex].row;
          if (batchResult.status === 'fulfilled') {
            imported += 1;
            return;
          }

          errors.push(
            `Linha ${row.__lineNumber ?? '?'}: ${friendlyImportError(batchResult.reason)}`,
          );
        });

        const processed = Math.min(
          start + batch.length,
          rowsToImport.length,
        );
        setImportProgress(
          Math.round((processed / rowsToImport.length) * 100),
        );
      }

      setResult({ imported, errors });
      if (imported > 0) onComplete();
    } catch (error) {
      errors.push(`Importação interrompida: ${friendlyImportError(error)}`);
      setResult({ imported, errors });
    } finally {
      setImportProgress(100);
      setIsLoading(false);
    }
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
        <div className="space-y-2">
          <label
            htmlFor="bulk-import-institution"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Instituição <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="bulk-import-institution"
              value={institutionSearch}
              onChange={(event) => handleInstitutionSearch(event.target.value)}
              placeholder={
                loadingInstitutions
                  ? 'Carregando instituições...'
                  : 'Buscar instituição pelo nome'
              }
              disabled={loadingInstitutions || isLoading}
              className="block w-full rounded-lg border-2 border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-900/30"
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
          {!institutionId && !loadingInstitutions ? (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              {filteredInstitutions.length > 0 ? (
                filteredInstitutions.map((institution) => (
                  <button
                    key={institution.id}
                    type="button"
                    onClick={() => selectInstitution(institution)}
                    className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 transition-colors last:border-0 hover:bg-primary-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-primary-900/20"
                  >
                    <span className="font-medium">
                      {institutionName(institution)}
                    </span>
                    {institution.city || institution.state ? (
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        {[institution.city, institution.state]
                          .filter(Boolean)
                          .join(' - ')}
                      </span>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500">
                  Nenhuma instituição encontrada.
                </p>
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
              options={[
                { value: '', label: 'Selecione o anexo...' },
                ...availableUnits.map((unit) => ({
                  value: unit.id,
                  label: unit.name,
                })),
              ]}
              disabled={isLoading}
              required
              helpText={
                availableUnits.length === 0
                  ? 'Esta instituição ainda não possui anexos ativos.'
                  : 'Os usuários serão vinculados a este anexo.'
              }
            />
            {unitId ? (
              lockMode ? (
                <p className="self-center text-sm text-gray-600 dark:text-gray-300">
                  Importação de{' '}
                  {MODE_LABELS[mode || (defaultMode as ImportMode)]}.
                </p>
              ) : (
                <Select
                  label="O que deseja importar?"
                  value={mode}
                  onChange={(event) =>
                    handleModeChange(event.target.value as ImportMode | '')
                  }
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...MODE_OPTIONS,
                  ]}
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
            <Button
              variant="secondary"
              onClick={downloadTemplate}
              leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
            >
              Baixar modelo de {MODE_LABELS[mode]}
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
              <DocumentArrowUpIcon className="h-5 w-5" />
              Selecionar arquivo
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
                disabled={isLoading}
              />
            </label>
            {fileName ? (
              <span className="self-center text-sm text-gray-500">
                {fileName}
              </span>
            ) : null}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Velocidade da importação
              </p>
              <InformationCircleIcon
                className="h-4 w-4 cursor-help text-gray-400"
                title="Escolha quantos usuários serão processados por vez. O sistema nunca envia a planilha inteira de uma só vez."
                aria-label="Informações sobre a velocidade da importação"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {IMPORT_BATCH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setImportBatchSize(option.value)}
                  disabled={isLoading}
                  aria-pressed={importBatchSize === option.value}
                  className={`rounded-lg border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    importBatchSize === option.value
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100 dark:border-primary-400 dark:bg-primary-950/30 dark:ring-primary-900/40'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-700 dark:hover:bg-primary-900/20'
                  }`}
                >
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
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
                  {mode !== 'TEACHERS' ? (
                    <th className="px-3 py-2">Responsável</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row, index) => {
                  const role = mode ? roleForRow(row, mode) : null;
                  return (
                    <tr
                      key={`${row.email}-${index}`}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      <td className="px-3 py-2">
                        {role === UserRole.STUDENT
                          ? 'Aluno'
                          : role === UserRole.TEACHER
                            ? 'Professor'
                            : row.tipo || '-'}
                      </td>
                      <td className="px-3 py-2">
                        {`${row.nome || ''} ${row.sobrenome || ''}`.trim() ||
                          '-'}
                      </td>
                      <td className="px-3 py-2">{row.email || '-'}</td>
                      <td className="px-3 py-2">{selectedUnit?.name || '-'}</td>
                      {mode !== 'TEACHERS' ? (
                        <td className="px-3 py-2">
                          {row.responsavel_nome || '—'}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 8 ? (
              <p className="px-3 py-2 text-xs text-gray-500">
                Mostrando 8 de {rows.length} linhas.
              </p>
            ) : null}
            {invalidRows.length > 0 ? (
              <p className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {invalidRows.length} linha(s) não serão importadas.{' '}
                {invalidRows
                  .slice(0, 3)
                  .map(({ row, reason }) => `Linha ${row.__lineNumber}: ${reason}`)
                  .join(' • ')}
                {invalidRows.length > 3 ? ' • ...' : ''}
              </p>
            ) : null}
            {importProgress !== null ? (
              <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800/60">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-[width] duration-200"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  {isLoading
                    ? `Processando em lotes de até ${importBatchSize}... ${importProgress}%`
                    : `Importação concluída: ${importProgress}%`}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700">
            <p>{result.imported} usuário(s) importado(s) com sucesso.</p>
            {result.errors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-red-700">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Fechar
          </Button>
          <Button
            onClick={importUsers}
            isLoading={isLoading}
            disabled={
              isLoading ||
              !mode ||
              !institutionId ||
              !unitId ||
              validRows.length === 0
            }
          >
            Importar{' '}
            {validRows.length > 0 ? `${validRows.length} linha(s)` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
