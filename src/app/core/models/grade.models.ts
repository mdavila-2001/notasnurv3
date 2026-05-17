export interface GradeRequest {
  enrollmentId: number;
  componentId: number;
  score: number;
}

export interface GradeBulkRequest {
  grades: GradeRequest[];
}

export interface GradeResponse {
  id: number;
  enrollmentId: number;
  componentId: number;
  score: number;
}