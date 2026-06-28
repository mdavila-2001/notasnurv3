export interface Faculty {
  id: number;
  name: string;
  code: string;
}

export interface FacultyRequest {
  name: string;
  code: string;
}

export interface Degree {
  id: number;
  name: string;
  code: string;
  facultyId: number;
  facultyName: string;
}

export interface DegreeRequest {
  name: string;
  code: string;
  facultyId: number;
}

export interface UserDegree {
  id: number;
  studentName: string;
  degreeName: string;
  type: string;
  status: string;
}

export interface UserDegreeRequest {
  userId: string;
  degreeId: number;
  type: 'STUDENT';
}
