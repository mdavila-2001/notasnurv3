export interface Management {
  id: number;
  year: number;
}

export interface Semester {
  id: number;
  number: 1 | 2;
  startDate: string;
  endDate: string;
  managementId: number;
  managementYear: number;
}

export interface ManagementRequest {
  year: number;
}

export interface SemesterRequest {
  number: 1 | 2;
  startDate: string;
  endDate: string;
  managementId: number;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}
