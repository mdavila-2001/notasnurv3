export interface GradeRequest {
  enrollmentId: string;
  componentId: number;
  score: number;
}

export interface GradeBulkRequest {
  grades: GradeRequest[];
}

export interface GradeResponse {
  id: number;
  enrollmentId: string | number;
  componentId: number;
  score: number;
}

export interface GradeRowUI {
  studentId: string;
  enrollmentId: string | null;
  studentName: string;
  ci?: string;
  degreeName?: string;
  scores: Record<number, number | null>;
}

export interface StudentGradeRowUI {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  ci: string;
  email: string;
  degreeName: string;
  score: number | null;
  status: 'pending' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
}

export interface GradeRecordUI {
  enrollmentId: string;
  componentId: number;
  score: number | null;
  status: 'pending' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
}
