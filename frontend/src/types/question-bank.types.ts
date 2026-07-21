// Question Category Types
export interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  subjectId?: string;
  color?: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  subject?: {
    id: string;
    name: string;
  };
  _count?: {
    questions: number;
  };
}

export interface CreateQuestionCategoryDto {
  name: string;
  description?: string;
  subjectId?: string;
  color?: string;
}

export interface UpdateQuestionCategoryDto {
  name?: string;
  description?: string;
  subjectId?: string;
  color?: string;
}

// Question Types
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  OPEN_ENDED = 'OPEN_ENDED',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
}

export enum DifficultyLevel {
  VERY_EASY = 'VERY_EASY',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  VERY_HARD = 'VERY_HARD',
  EXPERT = 'EXPERT',
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  title: string;
  statement: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  points: number;
  explanation?: string;
  tags?: string[];
  categoryId?: string;
  subjectId?: string;
  authorId: string;
  institutionId: string;
  isPublic: boolean;
  options?: QuestionOption[];
  correctAnswer?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  category?: QuestionCategory;
  subject?: {
    id: string;
    name: string;
  };
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateQuestionDto {
  title: string;
  statement: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  points: number;
  explanation?: string;
  tags?: string[];
  categoryId?: string;
  subjectId?: string;
  isPublic?: boolean;
  options?: Omit<QuestionOption, 'id'>[];
  correctAnswer?: string;
}

export interface UpdateQuestionDto {
  title?: string;
  statement?: string;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  points?: number;
  explanation?: string;
  tags?: string[];
  categoryId?: string;
  subjectId?: string;
  isPublic?: boolean;
  options?: Omit<QuestionOption, 'id'>[];
  correctAnswer?: string;
}

export interface QuestionFilters {
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  categoryId?: string;
  subjectId?: string;
  authorId?: string;
  isPublic?: boolean;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Worksheet/Activity Types
export interface WorksheetQuestion {
  questionId: string;
  orderNumber: number;
  customPoints?: number; // Pontos customizados (sobrescreve question.points)
  question?: Question;
}

export interface Worksheet {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  classId?: string;
  totalPoints: number;
  activityDate?: string;
  headerText?: string;
  footerText?: string;
  headerTemplate?: string; // Backend retorna com esse nome
  footerTemplate?: string; // Backend retorna com esse nome
  authorId: string;
  institutionId: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  subject?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  questions?: WorksheetQuestion[];
  _count?: {
    questions: number;
  };
}

export interface CreateWorksheetDto {
  title: string;
  description?: string;
  subjectId: string; // Obrigatório
  classId: string; // Obrigatório
  academicPeriodId?: string;
  activityDate?: string;
  headerText?: string;
  footerText?: string;
}

export interface UpdateWorksheetDto {
  title?: string;
  description?: string;
  subjectId?: string;
  classId?: string;
  academicPeriodId?: string;
  activityDate?: string;
  headerText?: string;
  footerText?: string;
}

export interface WorksheetFilters {
  subjectId?: string;
  classId?: string;
  authorId?: string;
  isTemplate?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
