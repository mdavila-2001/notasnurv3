export type ReportType = 'grades-pdf' | 'grades-excel';

export interface ReportOption {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  filename: (subjectId: string) => string;
  endpoint: (subjectId: string) => string;
  mimeType: string;
  successMessage: string;
  errorMessage: string;
}
