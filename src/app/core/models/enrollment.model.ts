

export interface EnrollmentResponse {
  id: string;
  studentName: string;
  studentCi: string;
  subjectCode: string;
  subjectName: string;
  enrolledAt: string;
}


export interface EnrollmentRequest {
  userDegreeId: number;
  subjectId: number;
}

export interface StudentResponseDTO {
  studentId: string;
  fullName: string;
  ci: string;
  email: string;
  degreeName: string;
  academicStatus?: string;
}


export interface MySubjectResponseDTO {
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  degreeName: string;
}
