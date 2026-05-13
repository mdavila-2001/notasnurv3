import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';

export interface StudentEnrolledResponse {
  studentId: string;
  fullName: string;
  ci: string;
  email: string;
  degreeName: string;
}

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

export interface MySubjectResponse {
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  degreeName: string;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentApiService {
  private readonly api = inject(ApiService);

  getStudentsBySubject(subjectId: string): Observable<ApiResponse<StudentEnrolledResponse[]>> {
    return this.api.get<StudentEnrolledResponse[]>(`/enrollments/subject/${subjectId}`);
  }

  getMySubjects(): Observable<ApiResponse<MySubjectResponse[]>> {
    return this.api.get<MySubjectResponse[]>('/enrollments/my-subjects');
  }

  enrollStudent(request: EnrollmentRequest): Observable<ApiResponse<EnrollmentResponse>> {
    return this.api.post<EnrollmentResponse>('/enrollments', request);
  }

  withdrawStudent(enrollmentId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/enrollments/${enrollmentId}`);
  }
}
