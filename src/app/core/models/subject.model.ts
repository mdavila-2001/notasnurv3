export interface Subject {
  id: string;
  code: string;
  name: string;
  modality: 'PRESENCIAL' | 'SEMI_PRESENCIAL';
  semesterId: string;
  teacherId: string;
  createdAt?: string;
  // Optional relations
  semester?: any;
  teacher?: any;
}

export interface SubjectRequest {
  code: string;
  name: string;
  modality: 'PRESENCIAL' | 'SEMI_PRESENCIAL';
  semesterId: string;
  teacherId: string;
}
