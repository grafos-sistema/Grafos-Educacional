import type { AssessmentSlot } from './evaluation.types';

export type GradeCompositionStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export interface GradeComposition {
  id: string;
  assessmentCount: number;
  va1Weight: number;
  va2Weight?: number | null;
  va3Weight?: number | null;
  va4Weight?: number | null;
  status: GradeCompositionStatus;
  reviewNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  classSubjectId: string;
  academicPeriodId: string;
  classSubject?: {
    id: string;
    teacherId?: string | null;
    class?: {
      id: string;
      name: string;
      grade?: string;
      institutionId?: string;
      academicYearId?: string;
    };
    subject?: { id: string; name: string; code?: string | null };
  };
  academicPeriod?: {
    id: string;
    name: string;
    orderNumber: number;
    type?: string;
    academicYearId?: string;
  };
  submittedBy?: { id: string; name: string; firstName?: string; lastName?: string };
  reviewedBy?: { id: string; name: string; firstName?: string; lastName?: string };
}

export interface CreateGradeCompositionDto {
  classSubjectId: string;
  academicPeriodId: string;
  assessmentCount: number;
  va1Weight: number;
  va2Weight?: number;
  va3Weight?: number;
  va4Weight?: number;
}

export interface GradeCompositionFilters {
  classSubjectId?: string;
  academicPeriodId?: string;
  status?: GradeCompositionStatus;
}

export const compositionWeightForSlot = (
  composition: GradeComposition,
  slot: AssessmentSlot,
) => {
  const weights = {
    VA1: composition.va1Weight,
    VA2: composition.va2Weight ?? null,
    VA3: composition.va3Weight ?? null,
    VA4: composition.va4Weight ?? null,
  };

  return weights[slot];
};
