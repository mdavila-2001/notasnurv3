// Lo que devuelve el backend (SubjectResponse)
export interface Subject {
  id: number;
  code: string;
  name: string;
  modality: string;
  capacity: number;
  recordStatus: 'DRAFT' | 'ACTIVE';
  semesterName: string;
  teacherName: string;
  management: string;
}

// Lo que se envía al backend para crear o editar (SubjectRequest)
export interface SubjectRequest {
  code: string;
  name: string;
  modality: 'PRESENCIAL' | 'SEMI_PRESENCIAL';
  capacity: number;
  semesterId: number;
  teacherId: string;
}
