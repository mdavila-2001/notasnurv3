
// Coincide con EnrollmentResponse del backend
export interface EnrollmentResponse {
  id: string;
  studentName: string;
  studentCi: string;
  subjectCode: string;
  subjectName: string;
  enrolledAt: string;
}

// Coincide con EnrollmentRequest del backend
export interface EnrollmentRequest {
  userDegreeId: number;
  subjectId: number;
}

// Coincide con StudentResponseDTO (docente viendo sus alumnos)
export interface StudentResponseDTO {
  studentId: string;
  fullName: string;
  ci: string;
  email: string;
  degreeName: string;
}

// Coincide con MySubjectResponseDTO (estudiante viendo sus materias)
export interface MySubjectResponseDTO {
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  degreeName: string;
}
