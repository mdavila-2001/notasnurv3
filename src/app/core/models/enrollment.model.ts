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

export interface StudentEnrolledResponse {
  studentId?: string;
  id?: string;
  enrollmentId?: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  ci?: string;
  email?: string;
  degreeName?: string;
  degreeNameDto?: string;
  photoUrl?: string;
  avatarUrl?: string;
  profilePicture?: string;
  imageUrl?: string;
}

export interface MySubjectResponseDTO {
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  degreeName: string;
  modality?: string;
  credits?: number;
  semesterName?: string;
}

export interface UserProfileResponse {
  ci: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
}

export interface KardexEntryDTO {
  subjectCode: string;
  subjectName: string;
  grade: number | string;
  credits: number;
  status: string;
  semester: string;
  teacherName?: string;
  enrollmentDate?: string;
}

export interface KardexResponse {
  studentId: string;
  fullName: string;
  ci: string;
  degreeName: string;
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
  academicStatus: string;
  entries: KardexEntryDTO[];
}