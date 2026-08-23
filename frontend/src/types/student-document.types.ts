export const STUDENT_DOCUMENT_DEFINITIONS = [
  { key: 'birth_certificate', label: 'Certidão de Nascimento' },
  { key: 'student_rg', label: 'Identidade do Aluno' },
  { key: 'school_record', label: 'Histórico Escolar' },
  { key: 'vaccination_card', label: 'Carteirinha de Vacinação' },
  {
    key: 'physical_education_medical_certificate',
    label: 'Atestado Médico para Educação Física',
  },
  {
    key: 'medical_psychopedagogical_report',
    label: 'Laudo Médico/Psicopedagógico',
  },
] as const;

export type StudentDocumentKey = (typeof STUDENT_DOCUMENT_DEFINITIONS)[number]['key'];

export interface StudentDocumentRecord {
  key: StudentDocumentKey;
  label: string;
  fileName: string;
  path?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  status?: 'PENDING' | 'UPLOADED' | 'LOCAL';
}

export interface PendingStudentDocumentUpload extends StudentDocumentRecord {
  file?: File;
}
