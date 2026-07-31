export const STUDENT_DOCUMENT_DEFINITIONS = [
  { key: 'birth_certificate', label: 'Certidão de Nascimento' },
  { key: 'student_rg', label: 'RG do Aluno' },
  { key: 'student_cpf', label: 'CPF do Aluno' },
  { key: 'proof_of_address', label: 'Comprovante de Residência' },
  { key: 'school_record', label: 'Histórico Escolar' },
  { key: 'vaccination_card', label: 'Cartão de Vacinação' },
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
