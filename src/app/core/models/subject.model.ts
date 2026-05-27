export type SubjectModality = 'FACE_TO_FACE' | 'BLENDED' | 'ONLINE';

// AÑADIDO: 'ACTIVE' para que coincida exactamente con tu Enum de Java
export type SubjectRecordStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'INACTIVE' | 'CLOSED';

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

export interface SubjectResponse {
  id: string;
  code: string;
  name: string;
  modality: SubjectModality;
  capacity: number;
  semesterId: string;
  teacherId: string;
  semesterName?: string;
  teacherName?: string;
  recordStatus: SubjectRecordStatus;
  management?: string;
}

// Lo que se envía al backend para crear o editar (SubjectRequest)
export interface SubjectRequest {
  code: string;
  name: string;
  modality: SubjectModality;
  capacity: number;
  semesterId: number;
  teacherId: string;
  // NUEVO: El campo opcional para que TypeScript deje pasar el estado al editar
  recordStatus?: SubjectRecordStatus; 
}

export interface SubjectCreateUpdateRequest {
  code: string;
  name: string;
  modality: SubjectModality;
  capacity: number;
  semesterId: string;
  teacherId: string;
  // NUEVO: Añadido aquí también por precaución si lo usas en otro componente
  recordStatus?: SubjectRecordStatus; 
}