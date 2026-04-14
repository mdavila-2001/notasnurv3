export interface Management {
  id: string;
  year: number;
  createdAt?: string;
}

export interface Semester {
  id: string;
  number: 1 | 2;
  startDate: string;
  endDate: string;
  managementId: string;
  management?: Management;
}

export interface ManagementRequest {
  year: number;
}

export interface SemesterRequest {
  number: 1 | 2;
  startDate: string;
  endDate: string;
  managementId: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}
