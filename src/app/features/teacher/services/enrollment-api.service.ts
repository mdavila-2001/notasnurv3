import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';

export interface StudentEnrolledResponse {
  enrollmentId?: string | number;
  id?: string | number;
  userDegreeId?: string | number;
  studentId?: string | number;
  userId?: string | number;
  fullName?: string;
  studentName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  ci?: string;
  studentCi?: string;
  email?: string;
  studentEmail?: string;
  degreeName?: string;
  degreeNameDto?: string;
  careerName?: string;
  student?: {
    id?: string | number;
    fullName?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    ci?: string;
    email?: string;
  };
  user?: {
    id?: string | number;
    fullName?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    ci?: string;
    email?: string;
  };
  userDegree?: {
    id?: string | number;
    user?: {
      id?: string | number;
      fullName?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      ci?: string;
      email?: string;
    };
    degree?: {
      name?: string;
    };
  };
  degree?: {
    name?: string;
  };
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

type StudentsEndpointResponse = ApiResponse<StudentEnrolledResponse[]> | StudentEnrolledResponse[];

@Injectable({ providedIn: 'root' })
export class EnrollmentApiService {
  private readonly api = inject(ApiService);

  getStudentsBySubject(subjectId: string): Observable<ApiResponse<StudentEnrolledResponse[]>> {
    return this.getStudentsFromEndpoint(`/enrollments/subjects/${subjectId}/students`).pipe(
      catchError(() => this.getStudentsFromEndpoint(`/enrollments/subject/${subjectId}`)),
    );
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

  private getStudentsFromEndpoint(endpoint: string): Observable<ApiResponse<StudentEnrolledResponse[]>> {
    return this.api.getRaw<StudentsEndpointResponse>(endpoint).pipe(
      map((response) => this.normalizeStudentsResponse(response)),
    );
  }

  private normalizeStudentsResponse(response: StudentsEndpointResponse): ApiResponse<StudentEnrolledResponse[]> {
    if (Array.isArray(response)) {
      return {
        success: true,
        message: 'Estudiantes cargados correctamente',
        data: response,
      };
    }

    return {
      ...response,
      data: response.data ?? [],
    };
  }
}
