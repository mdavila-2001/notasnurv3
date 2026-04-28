export type SubjectModality = 'FACE_TO_FACE' | 'BLENDED' | 'ONLINE';
export type SubjectRecordStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

// Lo que devuelve el backend (SubjectResponse)
export interface Subject {
  id: number;
  code: string;
  name: string;
  modality: SubjectModality;
  capacity: number;
  recordStatus: SubjectRecordStatus;
  semesterId: number;
  semesterName: string;
  teacherId: string;
  teacherName: string;
  management: string;
}

// Lo que se envía al backend para crear o editar (SubjectRequest)
export interface SubjectRequest {
  code: string;
  name: string;
  modality: SubjectModality;
  capacity: number;
  semesterId: number;
  teacherId: string;
}
