export type SubjectModality = 'FACE_TO_FACE' | 'BLENDED' | 'ONLINE';

export type SubjectRecordStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'INACTIVE' | 'CLOSED';

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

export interface SubjectRequest {
  code: string;
  name: string;
  modality: SubjectModality;
  capacity: number;
  semesterId: number;
  teacherId: string;
  recordStatus?: SubjectRecordStatus; 
}

export interface SubjectCreateUpdateRequest {
  code: string;
  name: string;
  modality: SubjectModality;
  capacity: number;
  semesterId: string;
  teacherId: string;
  recordStatus?: SubjectRecordStatus; 
}