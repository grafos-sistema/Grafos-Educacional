export type AssessmentSlot = 'VA1' | 'VA2' | 'VA3' | 'VA4';
export type EvaluationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface Evaluation {
  id: string;
  title: string;
  type: string;
  slot: AssessmentSlot;
  description?: string;
  examDate?: string;
  maxValue: number;
  countsTowardsAverage: boolean;
  status: EvaluationStatus;
  rejectionReason?: string;
  institutionId: string;
  classSubjectId: string;
  academicPeriodId: string;
  classSubject?: {
    id: string;
    class?: { id: string; name: string; grade?: string };
    subject?: { id: string; name: string; code?: string };
  };
  academicPeriod?: { id: string; name: string; orderNumber: number; type?: string };
  createdBy?: { id: string; name: string; firstName?: string; lastName?: string };
  approvedBy?: { id: string; name: string; firstName?: string; lastName?: string };
}

export interface CreateEvaluationDto {
  title: string;
  type: string;
  slot: AssessmentSlot;
  classSubjectId: string;
  academicPeriodId: string;
  description?: string;
  examDate?: string;
  maxValue?: number;
  countsTowardsAverage?: boolean;
}
