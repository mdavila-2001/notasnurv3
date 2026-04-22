import { Semester } from './academic-management.model';

export interface Subject {
  id: string;
  code: string;
  name: string;
  modality: 'PRESENCIAL' | 'SEMI_PRESENCIAL';
  semesterId: string;
  teacherId: string;
  semester?: Semester;
  teacher?: any; // Assuming 'any' since User model might not exist yet
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectRequest {
  code: string;
  name: string;
  modality: 'PRESENCIAL' | 'SEMI_PRESENCIAL';
  semesterId: string;
  teacherId: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}
